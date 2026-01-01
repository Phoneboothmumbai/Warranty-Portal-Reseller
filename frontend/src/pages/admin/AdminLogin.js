import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const { login, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
    checkAdminSetup();
  }, [isAuthenticated, navigate]);

  const checkAdminSetup = async () => {
    try {
      // Try to fetch me - if 401, check if setup needed
      await axios.get(`${API}/auth/me`);
    } catch (error) {
      // This is expected - just checking
    }
    setCheckingSetup(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful');
      navigate('/admin/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      if (message.includes('Invalid credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#0F62FE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            {(settings.logo_base64 || settings.logo_url) ? (
              <img 
                src={settings.logo_base64 || settings.logo_url} 
                alt="Logo" 
                className="h-10 w-auto"
              />
            ) : (
              <Shield className="h-10 w-10 text-[#0F62FE]" />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Admin Portal</h1>
          <p className="text-slate-500 text-sm">Sign in to manage warranties and assets</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="form-input pl-11"
                  data-testid="admin-email-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input pl-11"
                  data-testid="admin-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F62FE] hover:bg-[#0043CE] text-white py-3"
              data-testid="admin-login-btn"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Setup Link */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              First time?{' '}
              <a 
                href="/admin/setup" 
                className="text-[#0F62FE] hover:underline font-medium"
                data-testid="setup-link"
              >
                Create admin account
              </a>
            </p>
          </div>
        </div>

        {/* Back to Portal */}
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Back to Warranty Portal
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
