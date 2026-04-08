import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from '../utils/toast';

// Global flag to prevent multiple initializations across component instances
let googleInitialized = false;

function GoogleSignInButton({ text = 'signin_with' }) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  useEffect(() => {
    // Initialize Google Sign-In only once globally
    if (window.google && !googleInitialized) {
      googleInitialized = true;
      
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      // Render the button
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            theme: 'outline',
            size: 'large',
            text: text,
            width: buttonRef.current?.offsetWidth || 320,
            logo_alignment: 'left',
          }
        );
      }
    }

    // Note: We don't reset googleInitialized on unmount to prevent re-initialization
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      const result = await googleLogin(response.credential);
      toast.success('Successfully signed in with Google!');
      
      // Role-based redirect
      if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center"></div>
    </div>
  );
}

export default GoogleSignInButton;
