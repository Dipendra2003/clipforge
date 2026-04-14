import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Demo from './pages/Demo';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ShareClip from './pages/ShareClip';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import OAuthCallback from './pages/auth/OAuthCallback';

// User Dashboard Pages
import DashboardOverview from './pages/user/DashboardOverview';
import Videos from './pages/user/Videos';
import VideoDetails from './pages/user/VideoDetails';
import Clips from './pages/user/Clips';
import Scheduled from './pages/user/Scheduled';
import Analytics from './pages/user/Analytics';
import ClipAnalytics from './pages/user/ClipAnalytics';
import Subscription from './pages/user/Subscription';
import Settings from './pages/user/Settings';

// Admin Dashboard Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';
import Plans from './pages/admin/Plans';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="how-it-works" element={<Home />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="demo" element={<Demo />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            
            {/* OAuth Callback Routes */}
            <Route path="auth/youtube/callback" element={<OAuthCallback />} />
          </Route>

          {/* Public Share Page (No Layout) */}
          <Route path="/share/:clipId" element={<ShareClip />} />
          
          {/* User Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardOverview />} />
            <Route path="videos" element={<Videos />} />
            <Route path="videos/:videoId" element={<VideoDetails />} />
            <Route path="clips" element={<Clips />} />
            <Route path="scheduled" element={<Scheduled />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="analytics/clip/:clipId" element={<ClipAnalytics />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="analytics" element={<PlatformAnalytics />} />
            <Route path="plans" element={<Plans />} />
            <Route path="integrations" element={<Settings />} />
            <Route path="logs" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
