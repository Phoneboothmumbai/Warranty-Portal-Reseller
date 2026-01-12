import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Shield, Search, ArrowRight, CheckCircle, XCircle, Clock, AlertTriangle, 
  Laptop, Calendar, Building2, User, Wrench, Package, MapPin, Tag,
  Printer, Monitor, Router, Camera, HardDrive, Cpu, FileText
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const deviceIcons = {
  'Laptop': Laptop,
  'CCTV': Camera,
  'Printer': Printer,
  'Monitor': Monitor,
  'Router': Router,
  'Server': HardDrive,
  'Desktop': Cpu,
};

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DeviceIcon = result?.device?.device_type ? 
    (deviceIcons[result.device.device_type] || Laptop) : Laptop;

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

  const warranty = result ? getWarrantyStatus(result.device.warranty_end) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {orgInfo.logo_url ? (
              <img src={orgInfo.logo_url} alt={orgInfo.name} className="h-10 w-auto" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-slate-900">{orgInfo.name}</h1>
              <p className="text-xs text-slate-500">Warranty Verification Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        {!result && (
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
        )}

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
                  Check
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Features - only show when no result */}
        {!result && !error && (
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
        )}

        {/* Error Message */}
        {error && !result && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6" data-testid="warranty-result">
            {/* Device Card with Warranty Status Banner */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Warranty Status Banner */}
              <div className={`p-6 ${
                result.device.warranty_active 
                  ? (warranty?.status === 'expiring' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500')
                  : 'bg-gradient-to-r from-red-500 to-rose-500'
              } text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.device.warranty_active ? (
                      warranty?.status === 'expiring' ? <AlertTriangle className="h-8 w-8" /> : <CheckCircle className="h-8 w-8" />
                    ) : (
                      <XCircle className="h-8 w-8" />
                    )}
                    <div>
                      <p className="text-sm opacity-80">Warranty Status</p>
                      <p className="text-2xl font-bold">
                        {result.device.warranty_active ? (warranty?.label || 'Active') : 'Expired'}
                      </p>
                    </div>
                  </div>
                  {warranty?.days !== undefined && (
                    <div className="text-right">
                      <p className="text-3xl font-bold">{warranty.days}</p>
                      <p className="text-sm opacity-80">
                        {warranty.status === 'expired' ? 'days ago' : 'days left'}
                      </p>
                    </div>
                  )}
                </div>
                {result.coverage_source === 'amc_contract' && !result.device.device_warranty_active && (
                  <p className="mt-3 text-sm bg-white/20 px-3 py-1 rounded-full inline-block">
                    Protected under AMC Contract
                  </p>
                )}
              </div>

              {/* Device Details */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                    <DeviceIcon className="h-8 w-8 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {result.device.brand} {result.device.model}
                    </h3>
                    <p className="text-slate-500">{result.device.device_type || 'Device'}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Serial Number
                    </p>
                    <p className="font-mono font-semibold text-slate-900">{result.device.serial_number}</p>
                  </div>
                  {result.device.asset_tag && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <Tag className="h-4 w-4" /> Asset Tag
                      </p>
                      <p className="font-mono font-semibold text-slate-900">{result.device.asset_tag}</p>
                    </div>
                  )}
                  {result.device.purchase_date && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Purchase Date
                      </p>
                      <p className="font-semibold text-slate-900">{formatDate(result.device.purchase_date)}</p>
                    </div>
                  )}
                  {result.device.warranty_end && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Warranty Expiry
                      </p>
                      <p className="font-semibold text-slate-900">{formatDate(result.device.warranty_end)}</p>
                    </div>
                  )}
                  {result.device.vendor && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Vendor
                      </p>
                      <p className="font-semibold text-slate-900">{result.device.vendor}</p>
                    </div>
                  )}
                  {result.device.condition && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1">Condition</p>
                      <p className="font-semibold text-slate-900 capitalize">{result.device.condition}</p>
                    </div>
                  )}
                  {result.company_name && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Company
                      </p>
                      <p className="font-semibold text-slate-900">{result.company_name}</p>
                    </div>
                  )}
                  {result.assigned_user && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <User className="h-4 w-4" /> Assigned To
                      </p>
                      <p className="font-semibold text-slate-900">{result.assigned_user}</p>
                    </div>
                  )}
                  {result.device.location && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Location
                      </p>
                      <p className="font-semibold text-slate-900">{result.device.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AMC Contract Info */}
            {result.amc_contract && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  AMC Contract Coverage
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-sm text-green-600 mb-1">Contract Name</p>
                    <p className="font-semibold text-green-800">{result.amc_contract.name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Type</p>
                    <p className="font-semibold text-slate-900 capitalize">{result.amc_contract.amc_type || 'Standard'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Coverage Until</p>
                    <p className="font-semibold text-slate-900">{formatDate(result.amc_contract.coverage_end)}</p>
                  </div>
                </div>
                {result.amc_contract.coverage_includes && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700 mb-2">Coverage Includes:</p>
                    <p className="text-sm text-slate-600">{
                      typeof result.amc_contract.coverage_includes === 'string' 
                        ? result.amc_contract.coverage_includes 
                        : JSON.stringify(result.amc_contract.coverage_includes)
                    }</p>
                  </div>
                )}
              </div>
            )}

            {/* Parts Section */}
            {result.parts && result.parts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Parts ({result.parts.length})
                </h3>
                <div className="space-y-3">
                  {result.parts.map((part, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        part.warranty_active 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {part.warranty_active ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-400" />
                          )}
                          <div>
                            <p className="font-medium text-slate-900">{part.part_name}</p>
                            {part.part_number && (
                              <p className="text-sm text-slate-500">Part #: {part.part_number}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          part.warranty_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {part.warranty_active ? 'Under Warranty' : 'Expired'}
                        </span>
                      </div>
                      {part.warranty_end && (
                        <p className="mt-2 ml-8 text-sm text-slate-500">
                          Warranty until: {formatDate(part.warranty_end)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service History Section */}
            {result.service_history && result.service_history.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  Service History ({result.service_history.length})
                </h3>
                <div className="space-y-4">
                  {result.service_history.map((service, index) => (
                    <div 
                      key={service.id || index}
                      className="p-4 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${
                            service.service_type === 'repair' ? 'bg-amber-100 text-amber-700' :
                            service.service_type === 'maintenance' ? 'bg-blue-100 text-blue-700' :
                            service.service_type === 'installation' ? 'bg-green-100 text-green-700' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            {service.service_type?.charAt(0).toUpperCase() + service.service_type?.slice(1) || 'Service'}
                          </span>
                          <p className="font-medium text-slate-900">{service.description}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          service.status === 'completed' ? 'bg-green-100 text-green-700' :
                          service.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          service.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {service.status?.charAt(0).toUpperCase() + service.status?.slice(1) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        {service.technician && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {service.technician}
                          </span>
                        )}
                        {service.created_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDateTime(service.created_at)}
                          </span>
                        )}
                        {service.cost > 0 && (
                          <span className="font-medium text-slate-700">
                            Cost: ₹{service.cost}
                          </span>
                        )}
                      </div>
                      {service.notes && (
                        <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-100">
                          {service.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Support */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <p className="text-sm text-blue-700">
                <strong>Need support?</strong> Contact {orgInfo.name} for warranty claims or service requests.
              </p>
            </div>

            {/* Search Again Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setSearchQuery('');
                }}
                className="mt-4"
                data-testid="search-again-btn"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Another Device
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} {orgInfo.name}. Powered by AssetGuard.</p>
        </div>
      </footer>
    </div>
  );
};

export default OrgWarrantyPage;
