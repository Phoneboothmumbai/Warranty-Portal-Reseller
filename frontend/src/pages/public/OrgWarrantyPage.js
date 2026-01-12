import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Search, ArrowRight, CheckCircle, XCircle, Clock, AlertTriangle, Laptop, Calendar, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const OrgWarrantyPage = () => {
  const { slug } = useParams();
  const [orgInfo, setOrgInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrgInfo();
  }, [slug]);

  const fetchOrgInfo = async () => {
    try {
      const response = await axios.get(`${API}/api/public/org/${slug}`);
      setOrgInfo(response.data);
    } catch (error) {
      setError('Organization not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setResult(null);
    setError('');

    try {
      const response = await axios.get(`${API}/api/public/org/${slug}/warranty`, {
        params: { q: searchQuery.trim() }
      });
      setResult(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setError('No device found with this serial number or asset tag');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setSearching(false);
    }
  };

  const getWarrantyStatus = (warrantyEnd) => {
    if (!warrantyEnd) return { status: 'unknown', label: 'Unknown', color: 'slate' };
    
    const today = new Date();
    const endDate = new Date(warrantyEnd);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', label: 'Expired', color: 'red', days: Math.abs(daysLeft) };
    if (daysLeft <= 30) return { status: 'expiring', label: 'Expiring Soon', color: 'amber', days: daysLeft };
    return { status: 'active', label: 'Active', color: 'green', days: daysLeft };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!orgInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Shield className="h-16 w-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Organization Not Found</h1>
        <p className="text-slate-500 mb-6">The organization you're looking for doesn't exist.</p>
        <Link to="/">
          <Button>Go to Home</Button>
        </Link>
      </div>
    );
  }

  const warranty = result ? getWarrantyStatus(result.warranty_end) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">{orgInfo.name}</h1>
              <p className="text-xs text-slate-500">Warranty Verification Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <p className="text-sm text-blue-600 font-medium uppercase tracking-wide mb-2">
            WARRANTY VERIFICATION PORTAL
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Check Your
            <span className="text-blue-600 block">Warranty Status</span>
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Enter your device Serial Number or Asset Tag to view warranty coverage details instantly.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="flex gap-3 bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-2 border border-slate-200">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Serial Number or Asset Tag"
                className="w-full pl-12 pr-4 py-4 text-lg bg-transparent focus:outline-none"
                data-testid="warranty-search-input"
              />
            </div>
            <Button 
              type="submit" 
              disabled={searching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg"
              data-testid="warranty-search-btn"
            >
              {searching ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Check Warranty
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Features */}
        <div className="flex justify-center gap-8 text-sm text-slate-500 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Real-time Data
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Secure Lookup
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Instant Results
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Warranty Status Banner */}
            <div className={`p-6 ${
              warranty.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              warranty.status === 'expiring' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              warranty.status === 'expired' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
              'bg-gradient-to-r from-slate-400 to-slate-500'
            } text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {warranty.status === 'active' && <CheckCircle className="h-8 w-8" />}
                  {warranty.status === 'expiring' && <AlertTriangle className="h-8 w-8" />}
                  {warranty.status === 'expired' && <XCircle className="h-8 w-8" />}
                  {warranty.status === 'unknown' && <Clock className="h-8 w-8" />}
                  <div>
                    <p className="text-sm opacity-80">Warranty Status</p>
                    <p className="text-2xl font-bold">{warranty.label}</p>
                  </div>
                </div>
                {warranty.days !== undefined && (
                  <div className="text-right">
                    <p className="text-3xl font-bold">{warranty.days}</p>
                    <p className="text-sm opacity-80">
                      {warranty.status === 'expired' ? 'days ago' : 'days left'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Device Details */}
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Laptop className="h-8 w-8 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {result.brand} {result.model}
                  </h3>
                  <p className="text-slate-500">{result.device_type || 'Device'}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500 mb-1">Serial Number</p>
                  <p className="font-mono font-semibold text-slate-900">{result.serial_number}</p>
                </div>
                {result.asset_tag && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Asset Tag</p>
                    <p className="font-mono font-semibold text-slate-900">{result.asset_tag}</p>
                  </div>
                )}
                {result.purchase_date && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Purchase Date</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {formatDate(result.purchase_date)}
                    </p>
                  </div>
                )}
                {result.warranty_end && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Warranty Expiry</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {formatDate(result.warranty_end)}
                    </p>
                  </div>
                )}
                {result.vendor && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Vendor</p>
                    <p className="font-semibold text-slate-900">{result.vendor}</p>
                  </div>
                )}
                {result.condition && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Condition</p>
                    <p className="font-semibold text-slate-900 capitalize">{result.condition}</p>
                  </div>
                )}
              </div>

              {/* Contact Support */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  <strong>Need support?</strong> Contact {orgInfo.name} for warranty claims or service requests.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} {orgInfo.name}. Powered by AssetGuard.</p>
        </div>
      </footer>
    </div>
  );
};

export default OrgWarrantyPage;
