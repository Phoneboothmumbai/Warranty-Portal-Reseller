import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, MapPin, MoreVertical,
  Phone, Mail, Building2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const SITE_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'site_project', label: 'Site / Project' },
  { value: 'branch', label: 'Branch' },
];

const OrgSites = () => {
  const { orgData } = useOutletContext();
  const [sites, setSites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    company_id: '',
    site_type: 'office',
    address: '',
    city: '',
    state: '',
    pincode: '',
    primary_contact_name: '',
    contact_number: '',
    contact_email: '',
    notes: ''
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('orgToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchData();
  }, [filterCompany]);

  const fetchData = async () => {
    try {
      const params = filterCompany ? { company_id: filterCompany } : {};
      const [sitesRes, companiesRes] = await Promise.all([
        axios.get(`${API}/api/org/sites`, { params, headers: getAuthHeaders() }),
        axios.get(`${API}/api/org/companies`, { headers: getAuthHeaders() })
      ]);
      setSites(sitesRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || '-';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter site name');
      return;
    }

    try {
      if (editingSite) {
        await axios.put(`${API}/api/org/sites/${editingSite.id}`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Site updated');
      } else {
        await axios.post(`${API}/api/org/sites`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Site created');
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (site) => {
    if (!window.confirm(`Delete "${site.name}"?`)) return;
    
    try {
      await axios.delete(`${API}/api/org/sites/${site.id}`, {
        headers: getAuthHeaders()
      });
      toast.success('Site deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete site');
    }
  };

  const openCreateModal = () => {
    setEditingSite(null);
    setFormData({
      name: '',
      company_id: filterCompany || '',
      site_type: 'office',
      address: '',
      city: '',
      state: '',
      pincode: '',
      primary_contact_name: '',
      contact_number: '',
      contact_email: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (site) => {
    setEditingSite(site);
    setFormData({
      name: site.name || '',
      company_id: site.company_id || '',
      site_type: site.site_type || 'office',
      address: site.address || '',
      city: site.city || '',
      state: site.state || '',
      pincode: site.pincode || '',
      primary_contact_name: site.primary_contact_name || '',
      contact_number: site.contact_number || '',
      contact_email: site.contact_email || '',
      notes: site.notes || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSite(null);
  };

  const filteredSites = sites.filter(site => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      site.name?.toLowerCase().includes(q) ||
      site.city?.toLowerCase().includes(q) ||
      site.address?.toLowerCase().includes(q)
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
    <div className="space-y-6" data-testid="org-sites-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sites</h1>
          <p className="text-slate-500">Manage your locations and offices</p>
        </div>
        <Button onClick={openCreateModal} className="bg-violet-600 hover:bg-violet-700" data-testid="add-site-btn">
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            data-testid="search-sites"
          />
        </div>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All Companies</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
      </div>

      {/* Sites Grid */}
      {filteredSites.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <MapPin className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No sites found</p>
          <Button onClick={openCreateModal} className="mt-4 bg-violet-600 hover:bg-violet-700">
            Add Your First Site
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((site) => (
            <div key={site.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{site.name}</h3>
                    <span className="text-xs text-slate-500 capitalize">{site.site_type?.replace('_', ' ')}</span>
                    {site.company_id && (
                      <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {getCompanyName(site.company_id)}
                      </p>
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
                    <DropdownMenuItem onClick={() => openEditModal(site)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(site)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {site.address && (
                <p className="text-sm text-slate-600 mb-2">{site.address}</p>
              )}
              {site.city && (
                <p className="text-sm text-slate-500">{site.city}{site.state ? `, ${site.state}` : ''} {site.pincode}</p>
              )}
              
              {site.primary_contact_name && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-sm text-slate-700 font-medium">{site.primary_contact_name}</p>
                  {site.contact_number && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {site.contact_number}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSite ? 'Edit Site' : 'Add New Site'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Site Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  data-testid="site-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site Type</label>
                <select
                  value={formData.site_type}
                  onChange={(e) => setFormData({ ...formData, site_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {SITE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
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
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="col-span-2 border-t pt-4 mt-2">
                <p className="text-sm font-medium text-slate-700 mb-3">Contact Information</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                {editingSite ? 'Update' : 'Create'} Site
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgSites;
