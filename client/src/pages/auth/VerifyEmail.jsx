import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from '../../utils/toast';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = searchParams.get('token');
  
  // Get email from location state (passed from signup/login)
  const [email, setEmail] = useState(location.state?.email || '');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const [status, setStatus] = useState(token ? 'verifying' : 'input'); // input, verifying, success, error
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    setStatus('verifying');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
        token: verificationToken
      });
      
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      toast.success('Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to verify email. Token may be invalid or expired.');
      toast.error('Verification failed');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
        token: otp
      });
      
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      toast.success('Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired code');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setShowEmailInput(true);
      toast.error('Please enter your email address');
      return;
    }

    setResending(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, {
        email
      });
      
      toast.success(response.data.message || 'Verification code sent to your email!');
      setShowEmailInput(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

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

            {status === 'input' && (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify your email</h2>
                {email ? (
                  <p className="text-gray-600 mb-6">
                    Enter the 6-digit code sent to <span className="font-semibold text-purple-600">{email}</span>
                  </p>
                ) : (
                  <p className="text-gray-600 mb-6">Enter the 6-digit code sent to your email</p>
                )}

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                      placeholder="000000"
                      required
                      autoFocus
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Code expires in 15 minutes
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={verifying || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>

                <div className="mt-6 space-y-4">
                  {showEmailInput && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                        placeholder="you@example.com"
                        required
                        autoFocus
                      />
                    </div>
                  )}
                  
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="w-full text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50 py-2 font-medium"
                  >
                    {resending ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending new code...
                      </span>
                    ) : (
                      "Didn't receive the code? Resend"
                    )}
                  </button>
                  
                  {!showEmailInput && !email && (
                    <button
                      onClick={() => setShowEmailInput(true)}
                      className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                    >
                      Need to enter a different email?
                    </button>
                  )}
                </div>
              </>
            )}

            {status === 'verifying' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg className="animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Verifying your email</h2>
                <p className="text-gray-600">Please wait while we verify your email address...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Email verified!</h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Verification failed</h2>
                <p className="text-gray-600 mb-6">{message}</p>

                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </>
            )}
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
    </div>
  );
}

export default VerifyEmail;
