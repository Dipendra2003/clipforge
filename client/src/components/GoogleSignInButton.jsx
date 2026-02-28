import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';

function GoogleSignInButton({ text = 'signin_with' }) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  useEffect(() => {
    // Initialize Google Sign-In
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      // Render the button
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
      console.error('Google sign-in error:', error);
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
