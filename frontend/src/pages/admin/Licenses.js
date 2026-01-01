import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, Key, MoreVertical, Building2, 
  Calendar, Eye, RefreshCw, AlertTriangle, CheckCircle, Clock,
  Users, Laptop, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { SmartSelect } from '../../components/ui/smart-select';
import { DateDurationInput } from '../../components/ui/date-duration-input';
import { QuickCreateCompany } from '../../components/forms';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Licenses = () => {
  const { token } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [editingLicense, setEditingLicense] = useState(null);
  const [expiringSummary, setExpiringSummary] = useState(null);

  const [formData, setFormData] = useState({
    company_id: '',
    software_name: '',
    vendor: '',
    license_type: 'subscription',
    license_key: '',
    seats: 1,
    assigned_to_type: 'company',
    start_date: '',
    end_date: '',
    purchase_cost: '',
    renewal_cost: '',
    auto_renew: false,
    renewal_reminder_days: 30,
    notes: ''
  });

  useEffect(() => {
    fetchData();
    fetchExpiringSummary();
  }, [filterCompany, filterStatus, filterType]);

  const fetchData = async () => {
    try {
      const params = {};
      if (filterCompany) params.company_id = filterCompany;
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.license_type = filterType;

      const [licensesRes, companiesRes] = await Promise.all([
        axios.get(`${API}/admin/licenses`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/companies`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setLicenses(licensesRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringSummary = async () => {
    try {
      const response = await axios.get(`${API}/admin/licenses/expiring/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpiringSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch expiring summary');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_id || !formData.software_name || !formData.start_date) {
      toast.error('Please fill in required fields');
      return;
    }

    const submitData = { ...formData };
    // Clean up optional fields
    if (submitData.purchase_cost) submitData.purchase_cost = parseFloat(submitData.purchase_cost);
    else delete submitData.purchase_cost;
    if (submitData.renewal_cost) submitData.renewal_cost = parseFloat(submitData.renewal_cost);
    else delete submitData.renewal_cost;
    submitData.seats = parseInt(submitData.seats) || 1;
    submitData.renewal_reminder_days = parseInt(submitData.renewal_reminder_days) || 30;

    // For perpetual licenses, clear end_date
    if (submitData.license_type === 'perpetual') {
      delete submitData.end_date;
    }

    try {
      if (editingLicense) {
        await axios.put(`${API}/admin/licenses/${editingLicense.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('License updated');
      } else {
        await axios.post(`${API}/admin/licenses`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('License created');
      }
      fetchData();
      fetchExpiringSummary();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (license) => {
    if (!window.confirm(`Delete "${license.software_name}" license?`)) return;

    try {
      await axios.delete(`${API}/admin/licenses/${license.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('License deleted');
      fetchData();
      fetchExpiringSummary();
    } catch (error) {
      toast.error('Failed to delete license');
    }
  };

  const openCreateModal = () => {
    setEditingLicense(null);
    setFormData({
      company_id: filterCompany || '',
      software_name: '',
      vendor: '',
      license_type: 'subscription',
      license_key: '',
      seats: 1,
      assigned_to_type: 'company',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      purchase_cost: '',
      renewal_cost: '',
      auto_renew: false,
      renewal_reminder_days: 30,
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (license) => {
    setEditingLicense(license);
    setFormData({
      company_id: license.company_id,
      software_name: license.software_name,
      vendor: license.vendor || '',
      license_type: license.license_type,
      license_key: license.license_key || '',
      seats: license.seats || 1,
      assigned_to_type: license.assigned_to_type || 'company',
      start_date: license.start_date,
      end_date: license.end_date || '',
      purchase_cost: license.purchase_cost || '',
      renewal_cost: license.renewal_cost || '',
      auto_renew: license.auto_renew || false,
      renewal_reminder_days: license.renewal_reminder_days || 30,
      notes: license.notes || ''
    });
    setModalOpen(true);
  };

  const openDetailModal = async (license) => {
    try {
      const response = await axios.get(`${API}/admin/licenses/${license.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedLicense(response.data);
      setDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to fetch license details');
    }
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

  const filteredLicenses = licenses.filter(l =>
    l.software_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.vendor && l.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.company_name && l.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusColors = {
    active: 'bg-emerald-50 text-emerald-600',
    expiring: 'bg-amber-50 text-amber-600',
    expired: 'bg-red-50 text-red-600',
    cancelled: 'bg-slate-100 text-slate-500'
  };

  const statusIcons = {
    active: CheckCircle,
    expiring: AlertTriangle,
    expired: Clock,
    cancelled: Clock
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F62FE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="licenses-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Software Licenses</h1>
          <p className="text-slate-500 mt-1">Manage software licenses and renewals</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-[#0F62FE] hover:bg-[#0043CE] text-white"
          data-testid="add-license-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add License
        </Button>
      </div>

      {/* Expiring Summary Alert */}
      {expiringSummary && (expiringSummary.expiring_7_days.length > 0 || expiringSummary.expired.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800">Attention Required</h3>
              <div className="mt-2 text-sm text-amber-700 space-y-1">
                {expiringSummary.expired.length > 0 && (
                  <p>{expiringSummary.expired.length} license(s) have expired</p>
                )}
                {expiringSummary.expiring_7_days.length > 0 && (
                  <p>{expiringSummary.expiring_7_days.length} license(s) expiring within 7 days</p>
                )}
                {expiringSummary.expiring_30_days.length > 0 && (
                  <p>{expiringSummary.expiring_30_days.length} license(s) expiring within 30 days</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by software, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-11"
            data-testid="search-licenses"
          />
        </div>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="form-select w-full sm:w-48"
        >
          <option value="">All Companies</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="form-select w-full sm:w-40"
        >
          <option value="">All Types</option>
          <option value="subscription">Subscription</option>
          <option value="perpetual">Perpetual</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-select w-full sm:w-36"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Total Licenses</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{expiringSummary?.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Perpetual</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{expiringSummary?.perpetual || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1">{expiringSummary?.active || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Expiring Soon</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">
            {(expiringSummary?.expiring_7_days?.length || 0) + (expiringSummary?.expiring_30_days?.length || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Expired</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">{expiringSummary?.expired?.length || 0}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {filteredLicenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-modern">
              <thead>
                <tr>
                  <th>Software</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Seats</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((license) => {
                  const daysLeft = getDaysUntilExpiry(license.end_date);
                  const StatusIcon = statusIcons[license.status] || CheckCircle;
                  return (
                    <tr key={license.id} data-testid={`license-row-${license.id}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Key className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{license.software_name}</p>
                            {license.vendor && (
                              <p className="text-xs text-slate-500">{license.vendor}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm">{license.company_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          license.license_type === 'perpetual'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}>
                          {license.license_type}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm">{license.seats}</span>
                        </div>
                      </td>
                      <td>
                        {license.license_type === 'perpetual' ? (
                          <span className="text-xs text-blue-600 font-medium">Perpetual</span>
                        ) : license.end_date ? (
                          <div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              daysLeft > 30
                                ? 'bg-emerald-50 text-emerald-600'
                                : daysLeft > 0
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-red-50 text-red-600'
                            }`}>
                              {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">{formatDate(license.end_date)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not set</span>
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full capitalize ${statusColors[license.status]}`}>
                          <StatusIcon className="h-3 w-3" />
                          {license.status}
                        </span>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailModal(license)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(license)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(license)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Key className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">No licenses found</p>
            <Button onClick={openCreateModal} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add your first license
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLicense ? 'Edit License' : 'Add License'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Company *</label>
                <SmartSelect
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                  placeholder="Select Company"
                  searchPlaceholder="Search companies..."
                  emptyText="No companies found"
                  fetchOptions={async (q) => {
                    const res = await axios.get(`${API}/admin/companies`, {
                      params: { q, limit: 20 },
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    return res.data;
                  }}
                  displayKey="name"
                  valueKey="id"
                  allowCreate
                  createLabel="Add New Company"
                  renderCreateForm={({ initialValue, onSuccess, onCancel }) => (
                    <QuickCreateCompany
                      initialValue={initialValue}
                      onSuccess={onSuccess}
                      onCancel={onCancel}
                      token={token}
                    />
                  )}
                />
              </div>
              <div>
                <label className="form-label">License Type *</label>
                <select
                  value={formData.license_type}
                  onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  className="form-select"
                >
                  <option value="subscription">Subscription</option>
                  <option value="perpetual">Perpetual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Software Name *</label>
                <input
                  type="text"
                  value={formData.software_name}
                  onChange={(e) => setFormData({ ...formData, software_name: e.target.value })}
                  className="form-input"
                  placeholder="Windows 11 Pro, Office 365..."
                  data-testid="license-software-input"
                />
              </div>
              <div>
                <label className="form-label">Vendor</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="form-input"
                  placeholder="Microsoft, Adobe..."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Seats</label>
                <input
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                  className="form-input"
                  min="1"
                />
              </div>
              <div>
                <label className="form-label">Purchase Cost</label>
                <input
                  type="number"
                  value={formData.purchase_cost}
                  onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="form-label">Renewal Cost</label>
                <input
                  type="number"
                  value={formData.renewal_cost}
                  onChange={(e) => setFormData({ ...formData, renewal_cost: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="form-label">License Key</label>
              <input
                type="text"
                value={formData.license_key}
                onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                className="form-input font-mono"
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="form-input"
                />
              </div>
              {formData.license_type === 'subscription' && (
                <div>
                  <DateDurationInput
                    label="License End"
                    startDate={formData.start_date}
                    endDate={formData.end_date}
                    onEndDateChange={(date) => setFormData({ ...formData, end_date: date })}
                    defaultMode="duration"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Reminder Days Before Expiry</label>
                <select
                  value={formData.renewal_reminder_days}
                  onChange={(e) => setFormData({ ...formData, renewal_reminder_days: parseInt(e.target.value) })}
                  className="form-select"
                >
                  <option value={7}>7 days</option>
                  <option value={15}>15 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  id="auto_renew"
                  checked={formData.auto_renew}
                  onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="auto_renew" className="text-sm text-slate-600">Auto-renew enabled</label>
              </div>
            </div>

            <div>
              <label className="form-label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input"
                rows={2}
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0F62FE] hover:bg-[#0043CE] text-white" data-testid="license-submit-btn">
                {editingLicense ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>License Details</DialogTitle>
          </DialogHeader>
          {selectedLicense && (
            <div className="space-y-6 mt-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Key className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{selectedLicense.software_name}</h3>
                  {selectedLicense.vendor && (
                    <p className="text-slate-500">{selectedLicense.vendor}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[selectedLicense.status]}`}>
                      {selectedLicense.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      selectedLicense.license_type === 'perpetual'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}>
                      {selectedLicense.license_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-500">Company</p>
                    <p className="font-medium">{selectedLicense.company_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Seats</p>
                    <p className="font-medium">{selectedLicense.seats}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Start Date</p>
                    <p className="font-medium">{formatDate(selectedLicense.start_date)}</p>
                  </div>
                  {selectedLicense.purchase_cost && (
                    <div>
                      <p className="text-slate-500">Purchase Cost</p>
                      <p className="font-medium">₹{selectedLicense.purchase_cost.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {selectedLicense.license_key && (
                    <div>
                      <p className="text-slate-500">License Key</p>
                      <p className="font-mono text-sm">{selectedLicense.license_key_masked || '****'}</p>
                    </div>
                  )}
                  {selectedLicense.license_type !== 'perpetual' && (
                    <div>
                      <p className="text-slate-500">End Date</p>
                      <p className="font-medium">
                        {selectedLicense.end_date ? formatDate(selectedLicense.end_date) : 'Not set'}
                        {selectedLicense.end_date && getDaysUntilExpiry(selectedLicense.end_date) > 0 && (
                          <span className="ml-2 text-xs text-emerald-600">
                            ({getDaysUntilExpiry(selectedLicense.end_date)} days left)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedLicense.renewal_cost && (
                    <div>
                      <p className="text-slate-500">Renewal Cost</p>
                      <p className="font-medium">₹{selectedLicense.renewal_cost.toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-500">Auto-Renew</p>
                    <p className="font-medium">{selectedLicense.auto_renew ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {selectedLicense.notes && (
                <div>
                  <p className="text-slate-500 text-sm">Notes</p>
                  <p className="text-sm mt-1">{selectedLicense.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openEditModal(selectedLicense);
                  }}
                  className="bg-[#0F62FE] hover:bg-[#0043CE] text-white"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit License
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Licenses;
