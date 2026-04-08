import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlToken = searchParams.get('token');
  const mode = searchParams.get('mode');
  const emailFromUrl = searchParams.get('email');

  const [step, setStep] = useState('otp'); // 'otp' or 'password'
  const [resetMethod, setResetMethod] = useState(urlToken ? 'link' : 'otp');
  const [formData, setFormData] = useState({
    email: emailFromUrl || '',
    otp: '',
    token: urlToken || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [otpVerified, setOtpVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // If there's a token in URL, skip OTP and go directly to password reset
    if (urlToken) {
      setResetMethod('link');
      setStep('password');
      setOtpVerified(true);
      setFormData(prev => ({ ...prev, token: urlToken }));
    }
    // If mode=otp in URL, start with OTP verification
    else if (mode === 'otp') {
      setResetMethod('otp');
      setStep('otp');
      setFormData(prev => ({ ...prev, token: '', email: emailFromUrl || '' }));
    }
  }, [urlToken, mode, emailFromUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for OTP input
    if (name === 'otp') {
      // Only allow numbers and limit to 6 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleResendOTP = async () => {
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Email is required to resend OTP' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        email: formData.email.trim().toLowerCase()
      });
      
      // Clear the old OTP input
      setFormData(prev => ({ ...prev, otp: '' }));
      
      setMessage({ 
        type: 'success', 
        text: 'New 6-digit code sent! Check your email.' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to resend code. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    
    if (!formData.otp || formData.otp.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }

    if (!formData.email) {
      setMessage({ type: 'error', text: 'Email is required' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Verify OTP without resetting password
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        token: formData.otp,
        email: formData.email.trim().toLowerCase()
      });
      
      setMessage({ type: 'success', text: '✓ Code verified! Now set your new password.' });
      setOtpVerified(true);
      setStep('password');
      
      // Store the verified token for password reset
      setFormData(prev => ({ ...prev, token: formData.otp }));
      
      // Clear success message after 2 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid or expired code. Please try again.';
      setMessage({ 
        type: 'error', 
        text: errorMsg
      });
      
      // If expired, suggest resending
      if (errorMsg.toLowerCase().includes('expired')) {
        setTimeout(() => {
          setMessage({ 
            type: 'error', 
            text: 'Code expired. Click "Resend Code" to get a new one.' 
          });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!formData.token) {
      setMessage({ 
        type: 'error', 
        text: 'Reset code is required. Please verify your code first.' 
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    if (formData.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long!' });
      return;
    }

    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    
    if (!hasLetter || !hasNumber) {
      setMessage({ 
        type: 'error', 
        text: 'Password must contain at least one letter and one number!' 
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        token: formData.token,
        password: formData.password,
        method: resetMethod
      });
      
      setMessage({ 
        type: 'success', 
        text: '✓ Password reset successful! Redirecting to login...' 
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful! Please log in with your new password.' } });
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Your code may have expired.';
      setMessage({ type: 'error', text: errorMessage });
      
      // If token expired, suggest going back to get new code
      if (errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('invalid')) {
        setTimeout(() => {
          setMessage({ 
            type: 'error', 
            text: 'Your reset code expired. Please request a new one.' 
          });
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if we should show the landing page
  const showLandingPage = !urlToken && !mode && !formData.email;

  if (showLandingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">CF</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">ClipForge AI</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reset Your Password</h2>
            <p className="text-gray-600 mb-6">Enter your 6-digit reset code from email</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                setStep('otp');
                setResetMethod('otp');
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              Enter Reset Code
            </button>
            
            <div className="text-center text-gray-500">or</div>
            
            <Link 
              to="/forgot-password" 
              className="w-full border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-50 transition text-center block"
            >
              Get Reset Code
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-purple-600 hover:text-purple-700 flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification Step
  if (step === 'otp' && !otpVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">CF</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">ClipForge AI</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Reset Code</h2>
            <p className="text-gray-600">We sent a 6-digit code to your email</p>
            {formData.email && (
              <p className="text-sm text-purple-600 mt-2">{formData.email}</p>
            )}
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleOTPVerification} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                6-Digit Reset Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                required
                value={formData.otp}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                disabled={loading}
                maxLength={6}
                autoComplete="off"
                autoFocus
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 text-center">Enter the 6-digit code from your email</p>
                <p className="text-xs text-gray-400 text-center">⏰ Code expires in 15 minutes</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || formData.otp.length !== 6}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Resend Code'}
            </button>
            <div className="pt-2">
              <Link to="/forgot-password" className="text-sm text-gray-600 hover:text-gray-700 flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Use different email
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password Reset Step
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">CF</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">ClipForge AI</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
            <p className="text-gray-600">Enter your new password below</p>
            {otpVerified && (
              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Code Verified
              </div>
            )}
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={8}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
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
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
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
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-purple-600 hover:text-purple-700 flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
