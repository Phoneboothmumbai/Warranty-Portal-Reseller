import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, ArrowLeft, Settings, Link2, Save, Loader2,
  CheckCircle2, AlertCircle, Eye, EyeOff, TestTube2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const OrgSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const [formData, setFormData] = useState({
    ticketing_url: '',
    ticketing_api_key: '',
    ticketing_enabled: false
  });

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
      
      // Load existing settings
      const settingsResponse = await axios.get(`${API}/api/org/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const settings = settingsResponse.data;
      setFormData({
        ticketing_url: settings.ticketing_url || '',
        ticketing_api_key: settings.ticketing_api_key || '',
        ticketing_enabled: settings.ticketing_enabled || false
      });
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('orgToken');
        navigate('/org/login');
      } else {
        toast.error('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSave = async () => {
    const token = localStorage.getItem('orgToken');
    if (!token) return;

    setSaving(true);
    try {
      await axios.put(`${API}/api/org/settings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.ticketing_url || !formData.ticketing_api_key) {
      toast.error('Please enter URL and API key first');
      return;
    }

    const token = localStorage.getItem('orgToken');
    if (!token) return;

    setTesting(true);
    try {
      const response = await axios.post(`${API}/api/org/settings/test-ticketing`, {
        url: formData.ticketing_url,
        api_key: formData.ticketing_api_key
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Connection successful!');
      } else {
        toast.error(response.data.message || 'Connection failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Connection test failed');
    } finally {
      setTesting(false);
    }
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
  const hasTicketingAccess = plan?.features?.osticket_integration;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link 
                to="/org/dashboard" 
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="font-bold text-slate-900">Organization Settings</h1>
                <p className="text-xs text-slate-500">{org?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-violet-600" />
            Organization Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Organization Name</label>
              <p className="text-slate-900">{org?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Subdomain</label>
              <p className="text-slate-900">{org?.slug}.assetguard.com</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Current Plan</label>
              <p className="text-slate-900">{plan?.name || 'Free'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Industry</label>
              <p className="text-slate-900">{org?.industry || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Ticketing System Integration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-violet-600" />
              Ticketing System Integration
            </h2>
            {hasTicketingAccess ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Available
              </span>
            ) : (
              <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Pro Plan Required
              </span>
            )}
          </div>

          {!hasTicketingAccess ? (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <p className="text-sm text-violet-700 mb-2">
                <strong>Upgrade to Pro</strong> to connect your ticketing system and manage support tickets seamlessly.
              </p>
              <Button 
                size="sm" 
                className="bg-violet-600 hover:bg-violet-700"
                onClick={() => navigate('/org/billing')}
              >
                Upgrade Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Connect your ticketing system to automatically create and sync support tickets.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ticketing System URL
                </label>
                <input
                  type="url"
                  name="ticketing_url"
                  value={formData.ticketing_url}
                  onChange={handleChange}
                  placeholder="https://support.yourcompany.com/api"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  data-testid="ticketing-url-input"
                />
                <p className="text-xs text-slate-500 mt-1">
                  The API endpoint URL for your ticketing system
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    name="ticketing_api_key"
                    value={formData.ticketing_api_key}
                    onChange={handleChange}
                    placeholder="Enter your API key"
                    className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    data-testid="ticketing-api-key-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your ticketing system API key for authentication
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="ticketing_enabled"
                  checked={formData.ticketing_enabled}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  id="ticketing_enabled"
                  data-testid="ticketing-enabled-checkbox"
                />
                <label htmlFor="ticketing_enabled" className="text-sm text-slate-700">
                  Enable ticketing system integration
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.ticketing_url || !formData.ticketing_api_key}
                  data-testid="test-connection-btn"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube2 className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-700"
                  data-testid="save-settings-btn"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Other Integrations Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-violet-600" />
            Other Integrations
          </h2>
          
          <div className="text-center py-8 text-slate-500">
            <p className="mb-2">More integrations coming soon!</p>
            <p className="text-sm">Email notifications, Slack, and more...</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrgSettings;
