import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get query parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Determine which platform based on current path
    const path = window.location.pathname;
    const platform = path.includes('youtube') ? 'youtube' : 'instagram';

    if (error) {
      // OAuth error occurred
      console.error(`${platform} OAuth error:`, error);
      navigate(`/dashboard/settings?error=${platform}_auth_failed`);
      return;
    }

    if (code && state) {
      // Forward to backend callback
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      window.location.href = `${backendUrl}/api/platform/${platform}/callback?code=${code}&state=${state}`;
    } else {
      // Missing parameters
      navigate(`/dashboard/settings?error=${platform}_auth_failed`);
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Connecting your account...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we complete the authentication.</p>
      </div>
    </div>
  );
}

export default OAuthCallback;
