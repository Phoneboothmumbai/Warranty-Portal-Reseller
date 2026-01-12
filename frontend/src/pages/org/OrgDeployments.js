import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, Truck, MoreVertical, Building2, 
  Calendar, MapPin, Package, CheckCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrgDeployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    company_id: '',
    site_id: '',
    deployment_type: 'new_installation',
    scheduled_date: '',
    status: 'scheduled',
    device_ids: [],
    notes: ''
  });

  const token = localStorage.getItem('org_token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deploymentsRes, companiesRes, sitesRes, devicesRes] = await Promise.all([
        axios.get(`${API}/org/deployments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/org/companies`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/org/sites`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/org/devices`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setDeployments(deploymentsRes.data || []);
      setCompanies(companiesRes.data || []);
      setSites(sitesRes.data || []);
      setDevices(devicesRes.data?.devices || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduled_date) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingDeployment) {
        await axios.put(`${API}/org/deployments/${editingDeployment.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Deployment updated');
      } else {
        await axios.post(`${API}/org/deployments`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Deployment created');
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (deployment) => {
    if (!window.confirm(`Delete "${deployment.title}" deployment?`)) return;

    try {
      await axios.delete(`${API}/org/deployments/${deployment.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deployment deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete deployment');
    }
  };

  const openCreateModal = () => {
    setEditingDeployment(null);
    setFormData({
      title: '',
      company_id: '',
      site_id: '',
      deployment_type: 'new_installation',
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      device_ids: [],
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (deployment) => {
    setEditingDeployment(deployment);
    setFormData({
      title: deployment.title,
      company_id: deployment.company_id || '',
      site_id: deployment.site_id || '',
      deployment_type: deployment.deployment_type || 'new_installation',
      scheduled_date: deployment.scheduled_date || '',
      status: deployment.status || 'scheduled',
      device_ids: deployment.device_ids || [],
      notes: deployment.notes || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDeployment(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredDeployments = deployments.filter(d =>
    d.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    scheduled: 'bg-blue-50 text-blue-600',
    in_progress: 'bg-amber-50 text-amber-600',
    completed: 'bg-emerald-50 text-emerald-600',
    cancelled: 'bg-red-50 text-red-600'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="org-deployments-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deployments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage device deployments and installations</p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700" data-testid="add-deployment-btn">
          <Plus className="h-4 w-4 mr-2" />
          Add Deployment
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deployments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Deployments List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredDeployments.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No deployments found</h3>
            <p className="text-slate-500 mb-4">Schedule your first deployment</p>
            <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Deployment
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Deployment</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Site</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Scheduled</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeployments.map((deployment) => {
                  const company = companies.find(c => c.id === deployment.company_id);
                  const site = sites.find(s => s.id === deployment.site_id);
                  
                  return (
                    <tr key={deployment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Truck className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{deployment.title}</p>
                            {deployment.device_ids?.length > 0 && (
                              <p className="text-sm text-slate-500">{deployment.device_ids.length} device(s)</p>
                            )}
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
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{site?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full capitalize">
                          {deployment.deployment_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{formatDate(deployment.scheduled_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[deployment.status] || statusColors.scheduled}`}>
                          {deployment.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                          {deployment.status?.replace('_', ' ').charAt(0).toUpperCase() + deployment.status?.slice(1).replace('_', ' ')}
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
                              <DropdownMenuItem onClick={() => openEditModal(deployment)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(deployment)} className="text-red-600">
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
            <DialogTitle>{editingDeployment ? 'Edit Deployment' : 'Add Deployment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site</label>
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select --</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={formData.deployment_type}
                  onChange={(e) => setFormData({ ...formData, deployment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new_installation">New Installation</option>
                  <option value="replacement">Replacement</option>
                  <option value="relocation">Relocation</option>
                  <option value="upgrade">Upgrade</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date *</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
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
                {editingDeployment ? 'Update' : 'Create'} Deployment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgDeployments;
