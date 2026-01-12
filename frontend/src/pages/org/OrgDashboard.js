import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, LogOut, Settings, Building2, Users, Laptop, 
  BarChart3, CreditCard, Bot, Link2, ChevronRight,
  Calendar, TrendingUp, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const OrgDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    const token = localStorage.getItem('orgToken');
    if (!token) {
      navigate('/org/login');
      return;
    }

    try {
      const response = await axios.get(`${API}/api/org/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrgData(response.data);
      setUser(response.data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('orgToken');
        localStorage.removeItem('orgUser');
        localStorage.removeItem('organization');
        navigate('/org/login');
      }
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('orgToken');
    localStorage.removeItem('orgUser');
    localStorage.removeItem('organization');
    navigate('/org/login');
    toast.success('Logged out successfully');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      trialing: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      past_due: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      expired: 'bg-slate-100 text-slate-700'
    };
    return styles[status] || styles.trialing;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const org = orgData?.organization;
  const plan = orgData?.plan;
  const usage = orgData?.usage;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">{org?.name || 'Organization'}</h1>
                <p className="text-xs text-slate-500">{org?.slug}.assetguard.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/org/settings" 
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                data-testid="settings-link"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-slate-500"
                data-testid="logout-btn"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}!</h2>
          <p className="text-slate-500">Manage your organization and assets</p>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Current Plan</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{plan?.name || 'Free'}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  org?.subscription_status === 'trialing' ? 'bg-white/20' :
                  org?.subscription_status === 'active' ? 'bg-green-400/30' :
                  'bg-red-400/30'
                }`}>
                  {org?.subscription_status?.replace('_', ' ').toUpperCase() || 'TRIALING'}
                </span>
                {org?.trial_ends_at && org?.subscription_status === 'trialing' && (
                  <span className="text-sm text-violet-200">
                    Trial ends {formatDate(org.trial_ends_at)}
                  </span>
                )}
              </div>
            </div>
            <Button 
              className="bg-white text-violet-600 hover:bg-violet-50"
              onClick={() => navigate('/org/billing')}
              data-testid="upgrade-btn"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Laptop className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">
                {usage?.device_count || 0} / {plan?.features?.max_devices === -1 ? '∞' : plan?.features?.max_devices || 10}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{usage?.device_count || 0}</h3>
            <p className="text-sm text-slate-500">Devices</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm text-slate-500">
                {usage?.user_count || 0} / {plan?.features?.max_users === -1 ? '∞' : plan?.features?.max_users || 2}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{usage?.user_count || 0}</h3>
            <p className="text-sm text-slate-500">Team Members</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm text-slate-500">
                {usage?.company_count || 0} / {plan?.features?.max_companies === -1 ? '∞' : plan?.features?.max_companies || 1}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{usage?.company_count || 0}</h3>
            <p className="text-sm text-slate-500">Sub-Companies</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-orange-600" />
              </div>
              {plan?.features?.ai_support_bot ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-slate-300" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {plan?.features?.ai_support_bot ? 'Enabled' : 'Disabled'}
            </h3>
            <p className="text-sm text-slate-500">AI Support Bot</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              to="/org/devices"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
              data-testid="manage-devices-link"
            >
              <Laptop className="h-5 w-5 text-violet-600" />
              <span className="font-medium text-slate-700">Manage Devices</span>
              <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>

            <Link 
              to="/org/team"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
              data-testid="manage-team-link"
            >
              <Users className="h-5 w-5 text-violet-600" />
              <span className="font-medium text-slate-700">Manage Team</span>
              <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>

            <Link 
              to="/org/settings"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
              data-testid="integrations-link"
            >
              <Link2 className="h-5 w-5 text-violet-600" />
              <span className="font-medium text-slate-700">Integrations</span>
              <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>

            <Link 
              to="/org/billing"
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
              data-testid="billing-link"
            >
              <CreditCard className="h-5 w-5 text-violet-600" />
              <span className="font-medium text-slate-700">Billing</span>
              <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Feature Access */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Feature Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'QR Code Labels', key: 'qr_codes', icon: '📱' },
              { name: 'AI Support Bot', key: 'ai_support_bot', icon: '🤖' },
              { name: 'Priority Support', key: 'priority_support', icon: '⭐' },
              { name: 'API Access', key: 'api_access', icon: '🔌' },
              { name: 'Custom Branding', key: 'custom_branding', icon: '🎨' },
              { name: 'Ticketing Integration', key: 'osticket_integration', icon: '🎫' },
            ].map((feature) => (
              <div 
                key={feature.key}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  plan?.features?.[feature.key] 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <span className="text-xl">{feature.icon}</span>
                <span className={`font-medium ${
                  plan?.features?.[feature.key] ? 'text-green-700' : 'text-slate-400'
                }`}>
                  {feature.name}
                </span>
                {plan?.features?.[feature.key] ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-300 ml-auto" />
                )}
              </div>
            ))}
          </div>
          
          {!plan?.features?.ai_support_bot && (
            <div className="mt-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
              <p className="text-sm text-violet-700">
                <strong>Upgrade to Pro</strong> to unlock AI Support Bot, Priority Support, and more features!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrgDashboard;
