import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, Key, MoreVertical, Building2, 
  Calendar, Eye, AlertTriangle, CheckCircle, Clock, Users
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrgLicenses = () => {
  const [licenses, setLicenses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);

  const [formData, setFormData] = useState({
    company_id: '',
    software_name: '',
    vendor: '',
    license_type: 'subscription',
    license_key: '',
    seats: 1,
    start_date: '',
    end_date: '',
    purchase_cost: '',
    notes: ''
  });

  const token = localStorage.getItem('org_token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [licensesRes, companiesRes] = await Promise.all([
        axios.get(`${API}/org/licenses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/org/companies`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setLicenses(licensesRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.software_name || !formData.start_date) {
      toast.error('Please fill in required fields');
      return;
    }

    const submitData = { ...formData };
    if (submitData.purchase_cost) submitData.purchase_cost = parseFloat(submitData.purchase_cost);
    else delete submitData.purchase_cost;
    submitData.seats = parseInt(submitData.seats) || 1;

    try {
      if (editingLicense) {
        await axios.put(`${API}/org/licenses/${editingLicense.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('License updated');
      } else {
        await axios.post(`${API}/org/licenses`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('License created');
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (license) => {
    if (!window.confirm(`Delete "${license.software_name}" license?`)) return;

    try {
      await axios.delete(`${API}/org/licenses/${license.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('License deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete license');
    }
  };

  const openCreateModal = () => {
    setEditingLicense(null);
    setFormData({
      company_id: '',
      software_name: '',
      vendor: '',
      license_type: 'subscription',
      license_key: '',
      seats: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      purchase_cost: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (license) => {
    setEditingLicense(license);
    setFormData({
      company_id: license.company_id || '',
      software_name: license.software_name,
      vendor: license.vendor || '',
      license_type: license.license_type || 'subscription',
      license_key: license.license_key || '',
      seats: license.seats || 1,
      start_date: license.start_date || '',
      end_date: license.end_date || '',
      purchase_cost: license.purchase_cost || '',
      notes: license.notes || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLicense(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysUntilExpiry = (dateStr) => {
    if (!dateStr) return null;
    const end = new Date(dateStr);
    const now = new Date();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const getStatus = (license) => {
    if (!license.end_date) return 'active';
    const days = getDaysUntilExpiry(license.end_date);
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring';
    return 'active';
  };

  const filteredLicenses = licenses.filter(l =>
    l.software_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.vendor && l.vendor.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusColors = {
    active: 'bg-emerald-50 text-emerald-600',
    expiring: 'bg-amber-50 text-amber-600',
    expired: 'bg-red-50 text-red-600'
  };

  const StatusIcon = ({ status }) => {
    const icons = { active: CheckCircle, expiring: AlertTriangle, expired: Clock };
    const Icon = icons[status] || CheckCircle;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="org-licenses-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Licenses</h1>
          <p className="text-slate-500 text-sm mt-1">Manage software licenses and subscriptions</p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700" data-testid="add-license-btn">
          <Plus className="h-4 w-4 mr-2" />
          Add License
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search licenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="license-search-input"
          />
        </div>
      </div>

      {/* Licenses List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredLicenses.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No licenses found</h3>
            <p className="text-slate-500 mb-4">Add your first software license to start tracking</p>
            <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add License
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Software</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Seats</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Expiry</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLicenses.map((license) => {
                  const status = getStatus(license);
                  const days = getDaysUntilExpiry(license.end_date);
                  const company = companies.find(c => c.id === license.company_id);
                  
                  return (
                    <tr key={license.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Key className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{license.software_name}</p>
                            {license.vendor && <p className="text-sm text-slate-500">{license.vendor}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{company?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full capitalize">
                          {license.license_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{license.seats || 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{formatDate(license.end_date)}</span>
                        </div>
                        {days !== null && days <= 30 && days >= 0 && (
                          <p className="text-xs text-amber-600 mt-1">{days} days left</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                          <StatusIcon status={status} />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(license)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(license)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLicense ? 'Edit License' : 'Add License'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Software Name *</label>
              <input
                type="text"
                value={formData.software_name}
                onChange={(e) => setFormData({ ...formData, software_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                data-testid="license-software-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">License Type</label>
                <select
                  value={formData.license_type}
                  onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="subscription">Subscription</option>
                  <option value="perpetual">Perpetual</option>
                  <option value="trial">Trial</option>
                  <option value="oem">OEM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seats</label>
                <input
                  type="number"
                  min="1"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">License Key</label>
              <input
                type="text"
                value={formData.license_key}
                onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="XXXX-XXXX-XXXX-XXXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Company --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Cost</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingLicense ? 'Update' : 'Create'} License
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgLicenses;
