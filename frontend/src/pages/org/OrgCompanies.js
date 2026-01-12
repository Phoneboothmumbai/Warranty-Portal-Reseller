import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, Building2, MoreVertical, Eye,
  MapPin, Users, Laptop, Phone, Mail, ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Finance', 
  'Education', 'Real Estate', 'Hospitality', 'Construction', 'Other'
];

const AMC_STATUSES = [
  { value: 'active', label: 'Active AMC', color: 'bg-green-100 text-green-700' },
  { value: 'expired', label: 'Expired AMC', color: 'bg-red-100 text-red-700' },
  { value: 'not_applicable', label: 'No AMC', color: 'bg-slate-100 text-slate-600' },
];

const OrgCompanies = () => {
  const { orgData } = useOutletContext();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    company_code: '',
    industry: '',
    gst_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    amc_status: 'not_applicable',
    notes: ''
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('orgToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/api/org/companies`, {
        headers: getAuthHeaders()
      });
      setCompanies(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (companyId) => {
    try {
      const response = await axios.get(`${API}/api/org/companies/${companyId}`, {
        headers: getAuthHeaders()
      });
      setSelectedCompany(response.data);
      setDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to fetch company details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contact_name || !formData.contact_email) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingCompany) {
        await axios.put(`${API}/api/org/companies/${editingCompany.id}`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Company updated');
      } else {
        await axios.post(`${API}/api/org/companies`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Company created');
      }
      fetchCompanies();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (company) => {
    if (!window.confirm(`Delete "${company.name}" and all its data (sites, users)?`)) return;
    
    try {
      await axios.delete(`${API}/api/org/companies/${company.id}`, {
        headers: getAuthHeaders()
      });
      toast.success('Company deleted');
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      company_code: '',
      industry: '',
      gst_number: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      amc_status: 'not_applicable',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || '',
      company_code: company.company_code || '',
      industry: company.industry || '',
      gst_number: company.gst_number || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      pincode: company.pincode || '',
      contact_name: company.contact_name || '',
      contact_email: company.contact_email || '',
      contact_phone: company.contact_phone || '',
      amc_status: company.amc_status || 'not_applicable',
      notes: company.notes || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCompany(null);
  };

  const getAmcBadge = (status) => {
    const config = AMC_STATUSES.find(s => s.value === status) || AMC_STATUSES[2];
    return <span className={`px-2 py-0.5 text-xs rounded-full ${config.color}`}>{config.label}</span>;
  };

  const filteredCompanies = companies.filter(company => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      company.name?.toLowerCase().includes(q) ||
      company.contact_name?.toLowerCase().includes(q) ||
      company.city?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="org-companies-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
          <p className="text-slate-500">Manage your client companies</p>
        </div>
        <Button onClick={openCreateModal} className="bg-violet-600 hover:bg-violet-700" data-testid="add-company-btn">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          data-testid="search-companies"
        />
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No companies found</p>
          <Button onClick={openCreateModal} className="mt-4 bg-violet-600 hover:bg-violet-700">
            Add Your First Client Company
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <div 
              key={company.id} 
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{company.name}</h3>
                    {company.company_code && (
                      <span className="text-xs text-slate-500">{company.company_code}</span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => fetchCompanyDetails(company.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditModal(company)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(company)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mb-3">
                {getAmcBadge(company.amc_status)}
                {company.industry && (
                  <span className="ml-2 text-xs text-slate-500">{company.industry}</span>
                )}
              </div>

              <div className="space-y-1.5 text-sm text-slate-600">
                {company.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {company.city}{company.state ? `, ${company.state}` : ''}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  {company.contact_name}
                </div>
                {company.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {company.contact_phone}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link 
                  to={`/org/admin/devices?company=${company.id}`}
                  className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  View Devices
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  data-testid="company-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Code</label>
                <input
                  type="text"
                  value={formData.company_code}
                  onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                  placeholder="e.g., ACME001"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                <input
                  type="text"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="col-span-2 border-t pt-4 mt-2">
                <p className="text-sm font-medium text-slate-700 mb-3">Primary Contact</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">AMC Status</label>
                <select
                  value={formData.amc_status}
                  onChange={(e) => setFormData({ ...formData, amc_status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {AMC_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                {editingCompany ? 'Update' : 'Create'} Company
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedCompany.name}</h3>
                  {selectedCompany.company_code && (
                    <p className="text-sm text-slate-500">{selectedCompany.company_code}</p>
                  )}
                  {getAmcBadge(selectedCompany.amc_status)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 rounded-lg p-3">
                  <MapPin className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xl font-semibold">{selectedCompany.sites_count || 0}</p>
                  <p className="text-xs text-slate-500">Sites</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <Users className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xl font-semibold">{selectedCompany.users_count || 0}</p>
                  <p className="text-xs text-slate-500">Users</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <Laptop className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xl font-semibold">{selectedCompany.devices_count || 0}</p>
                  <p className="text-xs text-slate-500">Devices</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedCompany.industry && (
                  <div>
                    <p className="text-slate-500">Industry</p>
                    <p className="font-medium">{selectedCompany.industry}</p>
                  </div>
                )}
                {selectedCompany.gst_number && (
                  <div>
                    <p className="text-slate-500">GST Number</p>
                    <p className="font-medium">{selectedCompany.gst_number}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-slate-500">Contact</p>
                  <p className="font-medium">{selectedCompany.contact_name}</p>
                  <p className="text-sm text-slate-600">{selectedCompany.contact_email}</p>
                  <p className="text-sm text-slate-600">{selectedCompany.contact_phone}</p>
                </div>
                {selectedCompany.address && (
                  <div className="col-span-2">
                    <p className="text-slate-500">Address</p>
                    <p className="font-medium">
                      {selectedCompany.address}
                      {selectedCompany.city && `, ${selectedCompany.city}`}
                      {selectedCompany.state && `, ${selectedCompany.state}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => openEditModal(selectedCompany)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgCompanies;
