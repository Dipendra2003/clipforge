import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  // Hide footer on auth pages
  const hideFooter = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="6" width="16" height="12" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
                  <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
                  <path d="M10 10 L10 14 L14 12 Z" fill="#8B5CF6"/>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ClipForge AI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</Link>
              <Link to="/demo" className="text-gray-600 hover:text-gray-900 transition">Demo</Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 transition">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition">Contact</Link>
              {user ? (
                <Link to="/dashboard" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 transition">Login</Link>
                  <Link to="/signup" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
              <div className="flex flex-col space-y-4 px-4 py-6">
                <Link to="/pricing" className="text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                <Link to="/demo" className="text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>Demo</Link>
                <Link to="/about" className="text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>About</Link>
                <Link to="/contact" className="text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                {user ? (
                  <Link to="/dashboard" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                    <Link to="/signup" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer - Hidden on auth pages */}
      {!hideFooter && (
      <footer className="relative bg-gray-900 text-gray-300">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-800/30 to-transparent pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
            {/* Logo & Description */}
            <div className="lg:col-span-5">
              <Link to="/" className="flex items-center space-x-3 mb-6 group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:shadow-purple-500/50 transition-all">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="6" width="16" height="12" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
                    <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
                    <path d="M10 10 L10 14 L14 12 Z" fill="#8B5CF6"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  ClipForge AI
                </span>
              </Link>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                Transform your long-form videos into viral short-form clips with the power of AI. 
                Save time, increase engagement, and grow your audience across all platforms.
              </p>
              
              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-400">No credit card required</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-400">14-day free trial</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h3 className="text-white font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="/#how-it-works" 
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault();
                        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="text-gray-400 hover:text-purple-400 transition-colors flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-purple-400 transition-all mr-0 group-hover:mr-2"></span>
                    How It Works
                  </a>
                </li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-purple-400 transition-all mr-0 group-hover:mr-2"></span>
                  Pricing
                </Link></li>
                <li><Link to="/demo" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-purple-400 transition-all mr-0 group-hover:mr-2"></span>
                  Demo
                </Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-2">
              <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-purple-400 transition-all mr-0 group-hover:mr-2"></span>
                  About Us
                </Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-purple-400 transition-all mr-0 group-hover:mr-2"></span>
                  Contact
                </Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-purple-400 transition-all mr-0 group-hover:mr-2"></span>
                  Privacy Policy
                </Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-purple-400 transition-all mr-0 group-hover:mr-2"></span>
                  Terms of Service
                </Link></li>
              </ul>
            </div>

            {/* Connect & Newsletter */}
            <div className="lg:col-span-3">
              <h3 className="text-white font-semibold text-lg mb-4">Stay Connected</h3>
              <p className="text-gray-400 text-sm mb-4">Follow us on social media for updates and tips</p>
              <div className="flex space-x-3 mb-6">
                <a href="#" aria-label="Facebook" className="w-11 h-11 bg-gray-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/50">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Twitter/X" className="w-11 h-11 bg-gray-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/50">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn" className="w-11 h-11 bg-gray-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/50">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" aria-label="YouTube" className="w-11 h-11 bg-gray-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/50">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm text-center md:text-left">
                © {new Date().getFullYear()} ClipForge AI. All rights reserved. Made with ❤️ for content creators.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <span className="text-gray-500 hidden sm:inline">🔒 Secure & Private</span>
                <span className="text-gray-500 hidden sm:inline">⚡ Lightning Fast</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}

export default Layout;
