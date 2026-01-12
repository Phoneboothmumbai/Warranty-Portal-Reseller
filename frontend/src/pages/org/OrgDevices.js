import { useState, useEffect } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, Laptop, MoreVertical, Eye,
  Calendar, Shield, CheckCircle, XCircle, AlertTriangle, QrCode, Building2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const OrgDevices = () => {
  const { orgData } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [devices, setDevices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [masters, setMasters] = useState({ device_types: [], brands: [], conditions: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCompany, setFilterCompany] = useState(searchParams.get('company') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  const [formData, setFormData] = useState({
    company_id: '',
    device_type: '',
    brand: '',
    model: '',
    serial_number: '',
    asset_tag: '',
    purchase_date: '',
    warranty_end_date: '',
    vendor: '',
    location: '',
    site_id: '',
    assigned_user_id: '',
    condition: 'good',
    status: 'active',
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
      const [devicesRes, companiesRes, sitesRes, usersRes, mastersRes] = await Promise.all([
        axios.get(`${API}/api/org/devices`, { params, headers: getAuthHeaders() }),
        axios.get(`${API}/api/org/companies`, { headers: getAuthHeaders() }),
        axios.get(`${API}/api/org/sites`, { headers: getAuthHeaders() }),
        axios.get(`${API}/api/org/users`, { headers: getAuthHeaders() }),
        axios.get(`${API}/api/org/masters`, { headers: getAuthHeaders() }).catch(() => ({ data: {} }))
      ]);
      setDevices(devicesRes.data.devices || []);
      setCompanies(companiesRes.data || []);
      setSites(sitesRes.data || []);
      setUsers(usersRes.data || []);
      setMasters(mastersRes.data || { device_types: [], brands: [], conditions: [], statuses: [] });
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
    if (!formData.brand || !formData.model || !formData.serial_number) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingDevice) {
        await axios.put(`${API}/api/org/devices/${editingDevice.id}`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Device updated');
      } else {
        await axios.post(`${API}/api/org/devices`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Device created');
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (device) => {
    if (!window.confirm(`Delete "${device.brand} ${device.model}"?`)) return;
    
    try {
      await axios.delete(`${API}/api/org/devices/${device.id}`, {
        headers: getAuthHeaders()
      });
      toast.success('Device deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  const openCreateModal = () => {
    setEditingDevice(null);
    setFormData({
      device_type: '',
      brand: '',
      model: '',
      serial_number: '',
      asset_tag: '',
      purchase_date: '',
      warranty_end_date: '',
      vendor: '',
      location: '',
      site_id: '',
      assigned_user_id: '',
      condition: 'good',
      status: 'active',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (device) => {
    setEditingDevice(device);
    setFormData({
      device_type: device.device_type || '',
      brand: device.brand || '',
      model: device.model || '',
      serial_number: device.serial_number || '',
      asset_tag: device.asset_tag || '',
      purchase_date: device.purchase_date || '',
      warranty_end_date: device.warranty_end || '',
      vendor: device.vendor || '',
      location: device.location || '',
      site_id: device.site_id || '',
      assigned_user_id: device.assigned_user_id || '',
      condition: device.condition || 'good',
      status: device.status || 'active',
      notes: device.notes || ''
    });
    setModalOpen(true);
  };

  const openDetailModal = (device) => {
    setSelectedDevice(device);
    setDetailModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDevice(null);
  };

  const getWarrantyStatus = (device) => {
    if (!device.warranty_end) return { status: 'unknown', label: 'Unknown', color: 'slate' };
    
    const today = new Date();
    const warrantyEnd = new Date(device.warranty_end);
    const daysLeft = Math.ceil((warrantyEnd - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', label: 'Expired', color: 'red', days: daysLeft };
    if (daysLeft <= 30) return { status: 'expiring', label: `${daysLeft}d left`, color: 'amber', days: daysLeft };
    return { status: 'active', label: 'Active', color: 'green', days: daysLeft };
  };

  const filteredDevices = devices.filter(device => {
    if (filterStatus && device.status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      device.brand?.toLowerCase().includes(q) ||
      device.model?.toLowerCase().includes(q) ||
      device.serial_number?.toLowerCase().includes(q) ||
      device.asset_tag?.toLowerCase().includes(q)
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
    <div className="space-y-6" data-testid="org-devices-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Devices</h1>
          <p className="text-slate-500">Manage your IT assets and equipment</p>
        </div>
        <Button onClick={openCreateModal} className="bg-violet-600 hover:bg-violet-700" data-testid="add-device-btn">
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by serial, brand, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            data-testid="search-devices"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="in_repair">In Repair</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {/* Devices Table */}
      {filteredDevices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Laptop className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No devices found</p>
          <Button onClick={openCreateModal} className="mt-4 bg-violet-600 hover:bg-violet-700">
            Add Your First Device
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Device</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Serial / Asset</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Warranty</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map((device) => {
                  const warranty = getWarrantyStatus(device);
                  return (
                    <tr key={device.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Laptop className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{device.brand} {device.model}</p>
                            <p className="text-sm text-slate-500">{device.device_type || 'Device'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm text-slate-900">{device.serial_number}</p>
                        {device.asset_tag && (
                          <p className="text-xs text-slate-500">{device.asset_tag}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                          warranty.color === 'green' ? 'bg-green-100 text-green-700' :
                          warranty.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                          warranty.color === 'red' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {warranty.status === 'active' && <CheckCircle className="h-3 w-3" />}
                          {warranty.status === 'expiring' && <AlertTriangle className="h-3 w-3" />}
                          {warranty.status === 'expired' && <XCircle className="h-3 w-3" />}
                          {warranty.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          device.status === 'active' ? 'bg-green-100 text-green-700' :
                          device.status === 'in_repair' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {device.status?.replace('_', ' ') || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailModal(device)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(device)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(device)} className="text-red-600">
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
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDevice ? 'Edit Device' : 'Add New Device'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Device Type</label>
                <select
                  value={formData.device_type}
                  onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select Type</option>
                  {(masters.device_types?.length > 0 ? masters.device_types : ['Laptop', 'Desktop', 'Printer', 'Monitor', 'Server', 'Network Device', 'Other']).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  list="brands-list"
                  data-testid="device-brand-input"
                />
                <datalist id="brands-list">
                  {(masters.brands?.length > 0 ? masters.brands : ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer']).map(b => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  data-testid="device-model-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number *</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  data-testid="device-serial-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Tag</label>
                <input
                  type="text"
                  value={formData.asset_tag}
                  onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Warranty End Date</label>
                <input
                  type="date"
                  value={formData.warranty_end_date}
                  onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site</label>
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select Site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned User</label>
                <select
                  value={formData.assigned_user_id}
                  onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Floor 2, Desk 15"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="active">Active</option>
                  <option value="in_repair">In Repair</option>
                  <option value="retired">Retired</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                {editingDevice ? 'Update' : 'Create'} Device
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Laptop className="h-8 w-8 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedDevice.brand} {selectedDevice.model}
                  </h3>
                  <p className="text-slate-500">{selectedDevice.device_type || 'Device'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Serial Number</p>
                  <p className="font-mono font-medium">{selectedDevice.serial_number}</p>
                </div>
                {selectedDevice.asset_tag && (
                  <div>
                    <p className="text-slate-500">Asset Tag</p>
                    <p className="font-medium">{selectedDevice.asset_tag}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-medium capitalize">{selectedDevice.status?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-500">Condition</p>
                  <p className="font-medium capitalize">{selectedDevice.condition}</p>
                </div>
                {selectedDevice.purchase_date && (
                  <div>
                    <p className="text-slate-500">Purchase Date</p>
                    <p className="font-medium">{selectedDevice.purchase_date}</p>
                  </div>
                )}
                {selectedDevice.warranty_end && (
                  <div>
                    <p className="text-slate-500">Warranty End</p>
                    <p className="font-medium">{selectedDevice.warranty_end}</p>
                  </div>
                )}
                {selectedDevice.vendor && (
                  <div>
                    <p className="text-slate-500">Vendor</p>
                    <p className="font-medium">{selectedDevice.vendor}</p>
                  </div>
                )}
                {selectedDevice.location && (
                  <div>
                    <p className="text-slate-500">Location</p>
                    <p className="font-medium">{selectedDevice.location}</p>
                  </div>
                )}
              </div>
              
              {selectedDevice.notes && (
                <div>
                  <p className="text-slate-500 text-sm">Notes</p>
                  <p className="text-sm mt-1">{selectedDevice.notes}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => openEditModal(selectedDevice)}>
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

export default OrgDevices;
