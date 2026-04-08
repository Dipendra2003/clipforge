import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from '../../utils/toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Settings() {
  const { user, logout, logoutAll, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [platformConnections, setPlatformConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmButtonText, setConfirmButtonText] = useState('Confirm');
  const [requiresTyping, setRequiresTyping] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch platform connections on mount
  useEffect(() => {
    fetchPlatformConnections();
    
    // Update profile data when user changes
    if (user) {
      setProfileData({ name: user.name });
    }
    
    // Check for OAuth callback success/error
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const channel = params.get('channel');
    
    if (success === 'youtube_connected') {
      const message = channel 
        ? `YouTube connected successfully! Channel: ${decodeURIComponent(channel)}`
        : 'YouTube connected successfully!';
      toast.success(message);
      fetchPlatformConnections();
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (success === 'instagram_connected') {
      toast.success('Instagram connected successfully!');
      fetchPlatformConnections();
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (error) {
      // Handle specific error cases
      const errorMessages = {
        'youtube_auth_failed': 'Failed to connect YouTube. Please try again.',
        'youtube_auth_denied': 'YouTube authorization was denied. Please grant permissions to continue.',
        'youtube_no_channel': 'No YouTube channel found. Please create a YouTube channel first at youtube.com, then try connecting again.',
        'youtube_no_refresh_token': 'Failed to get refresh token. Please try connecting again.',
        'youtube_auth_invalid': 'Invalid YouTube authentication. Please try again.',
        'youtube_api_forbidden': 'YouTube API access forbidden. Check your Google Cloud project settings.',
        'instagram_auth_failed': 'Failed to connect Instagram. Please try again.',
        'instagram_no_pages': 'No Facebook Pages found. Please create a Facebook Page and connect it to your Instagram Business account.',
        'instagram_no_business_account': 'No Instagram Business Account found. Please convert your Instagram account to a Business account and connect it to a Facebook Page.'
      };
      
      const errorMessage = errorMessages[error] || 'An error occurred during authentication.';
      toast.error(errorMessage);
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [user]); // Add user as dependency

  const fetchPlatformConnections = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/platform/connections`);
      setPlatformConnections(response.data.connections || []);
    } catch {
      // Silent fail - connections are optional
    }
  };

  const handleConnectPlatform = (platform) => {
    // Prevent double-clicks
    if (loading) {
      return;
    }

    // Get the access token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      toast.error('Please login first');
      return;
    }
    
    setLoading(true);
    
    // Redirect to backend OAuth initiation endpoint with token in URL
    // Backend will validate token and then redirect to OAuth provider
    window.location.href = `${API_URL}/api/platform/${platform}?token=${token}`;
  };

  const handleDisconnectPlatform = async (platform) => {
    setConfirmTitle(`🔌 Disconnect ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
    setConfirmMessage(`Are you sure you want to disconnect your ${platform} account? You won't be able to post to ${platform} until you reconnect.`);
    setConfirmButtonText('Yes, Disconnect');
    setRequiresTyping(false);
    setConfirmAction(() => async () => {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/api/platform/connections/${platform}`);
        toast.success(`${platform} disconnected successfully`);
        fetchPlatformConnections();
        setShowConfirmModal(false);
      } catch {
        toast.error(`Failed to disconnect ${platform}`);
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmModal(true);
  };

  const isPlatformConnected = (platform) => {
    return platformConnections.some(conn => conn.platform === platform);
  };

  const getPlatformUsername = (platform) => {
    const connection = platformConnections.find(conn => conn.platform === platform);
    return connection?.platformUsername || '';
  };

  const isPlatformExpired = (platform) => {
    const connection = platformConnections.find(conn => conn.platform === platform);
    return connection?.isExpired || false;
  };

  const handleLogoutAll = async () => {
    setConfirmTitle('🚪 Logout from All Devices');
    setConfirmMessage('Are you sure you want to logout from all devices? You will need to login again on all your devices.');
    setConfirmButtonText('Yes, Logout All');
    setRequiresTyping(false);
    setConfirmAction(() => async () => {
      try {
        await logoutAll();
        toast.success('Logged out from all devices');
        setShowConfirmModal(false);
      } catch {
        toast.error('Error logging out');
      }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteAccount = async () => {
    setConfirmTitle('⚠️ Delete Account');
    setConfirmMessage('This action cannot be undone! All your videos, clips, and data will be permanently deleted. Type "DELETE" below to confirm:');
    setConfirmButtonText('Delete My Account');
    setRequiresTyping(true);
    setTypedConfirmation('');
    setConfirmAction(() => async () => {
      // Get the current value from the input field directly
      const inputValue = document.querySelector('input[type="text"][placeholder*="DELETE"]')?.value || '';
      
      if (inputValue !== 'DELETE') {
        toast.error('Please type "DELETE" to confirm');
        return;
      }
      
      try {
        await axios.delete(`${API_URL}/api/auth/account`);
        toast.success('Account deleted successfully');
        setShowConfirmModal(false);
        setTimeout(() => {
          logout();
        }, 1500);
      } catch (err) {
        const message = err.response?.data?.message || 'Error deleting account';
        toast.error(message);
      }
    });
    setShowConfirmModal(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (profileData.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await axios.put(`${API_URL}/api/auth/profile`, {
        name: profileData.name.trim()
      });

      // Update user context
      if (updateUser) {
        updateUser(response.data.user);
      }

      toast.success('Profile updated successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Error updating profile';
      toast.error(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword) {
      toast.error('Current password is required');
      return;
    }

    if (!passwordData.newPassword) {
      toast.error('New password is required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await axios.put(`${API_URL}/api/auth/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast.success('Password changed successfully');
      
      // If backend requires re-authentication, handle it
      if (response.data.requireReauth) {
        toast.info('Please log in again with your new password');
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error changing password';
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{confirmTitle}</h3>
            <p className="text-gray-600 mb-6 whitespace-pre-line">{confirmMessage}</p>
            
            {requiresTyping && (
              <input
                type="text"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-6 font-mono text-center text-lg"
                autoFocus
              />
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setTypedConfirmation('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={requiresTyping && typedConfirmation !== 'DELETE'}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirmButtonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        {['profile', 'password', 'accounts', 'notifications'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 font-medium capitalize transition ${
              activeTab === tab
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                required
                minLength={2}
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
          {user?.google_id && !user?.password ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Google Account:</strong> You signed up with Google and don't have a password set. 
                You can continue using Google Sign-In or contact support if you need to set a password.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showCurrentPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showNewPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">At least 8 characters with letters and numbers</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Connected Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Connected Accounts</h2>
          <p className="text-sm text-gray-600 mb-6">
            Connect your YouTube account to enable posting features. 
            Platform connection is optional - you can still generate and download clips without connecting.
          </p>
          
          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>📌 Important:</strong> You must have a YouTube channel to connect. 
              If you don't have one, create it at <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="underline">youtube.com</a> first.
            </p>
          </div>
          
          <div className="space-y-4">
            {/* YouTube */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">▶️</span>
                <div>
                  <p className="font-medium text-gray-900">YouTube</p>
                  {isPlatformConnected('youtube') ? (
                    <>
                      {isPlatformExpired('youtube') ? (
                        <p className="text-sm text-orange-600">
                          ⚠️ Connection expired - <strong>{getPlatformUsername('youtube')}</strong>
                        </p>
                      ) : (
                        <p className="text-sm text-green-600">
                          ✓ Connected as <strong>{getPlatformUsername('youtube')}</strong>
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Not connected</p>
                  )}
                </div>
              </div>
              {isPlatformConnected('youtube') ? (
                <div className="flex gap-2">
                  {isPlatformExpired('youtube') && (
                    <button
                      onClick={() => handleConnectPlatform('youtube')}
                      disabled={loading}
                      className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition disabled:opacity-50"
                    >
                      Reconnect
                    </button>
                  )}
                  <button
                    onClick={() => handleDisconnectPlatform('youtube')}
                    disabled={loading}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnectPlatform('youtube')}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Settings</h2>
          <div className="space-y-4">
            {[
              { label: 'Email notifications', description: 'Receive email updates about your clips' },
              { label: 'Processing complete', description: 'Get notified when video processing is done' },
              { label: 'Scheduled posts', description: 'Reminders about upcoming scheduled posts' },
              { label: 'Marketing emails', description: 'Receive tips and product updates' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow p-6 mt-6 border-2 border-red-200">
        <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
        <div className="space-y-3">
          <button
            onClick={handleLogoutAll}
            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-left"
          >
            Logout from all devices
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-left"
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
