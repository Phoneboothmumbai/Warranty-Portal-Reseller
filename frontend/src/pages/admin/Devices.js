import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Laptop, MoreVertical, Building2, User, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const deviceTypes = ['Laptop', 'Desktop', 'Monitor', 'Printer', 'CCTV', 'Router', 'Server', 'UPS', 'Other'];

const Devices = () => {
  const { token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    assigned_user_id: '',
    device_type: 'Laptop',
    brand: '',
    model: '',
    serial_number: '',
    asset_tag: '',
    purchase_date: '',
    warranty_end_date: '',
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, [filterCompany]);

  const fetchData = async () => {
    try {
      const [devicesRes, companiesRes] = await Promise.all([
        axios.get(`${API}/admin/devices`, {
          params: filterCompany ? { company_id: filterCompany } : {},
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/companies`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setDevices(devicesRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyUsers = async (companyId) => {
    if (!companyId) {
      setUsers([]);
      return;
    }
    try {
      const response = await axios.get(`${API}/admin/users`, {
        params: { company_id: companyId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const handleCompanyChange = (companyId) => {
    setFormData({ ...formData, company_id: companyId, assigned_user_id: '' });
    fetchCompanyUsers(companyId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_id || !formData.serial_number || !formData.brand || !formData.model) {
      toast.error('Please fill in required fields');
      return;
    }

    const submitData = { ...formData };
    if (!submitData.assigned_user_id) delete submitData.assigned_user_id;
    if (!submitData.asset_tag) delete submitData.asset_tag;
    if (!submitData.warranty_end_date) delete submitData.warranty_end_date;

    try {
      if (editingDevice) {
        await axios.put(`${API}/admin/devices/${editingDevice.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Device updated');
      } else {
        await axios.post(`${API}/admin/devices`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
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
    if (!window.confirm(`Delete "${device.brand} ${device.model}"? This will also delete related parts and AMC.`)) return;
    
    try {
      await axios.delete(`${API}/admin/devices/${device.id}`, {
        headers: { Authorization: `Bearer ${token}` }
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
      company_id: filterCompany || '',
      assigned_user_id: '',
      device_type: 'Laptop',
      brand: '',
      model: '',
      serial_number: '',
      asset_tag: '',
      purchase_date: '',
      warranty_end_date: '',
      status: 'active'
    });
    if (filterCompany) {
      fetchCompanyUsers(filterCompany);
    } else {
      setUsers([]);
    }
    setModalOpen(true);
  };

  const openEditModal = async (device) => {
    setEditingDevice(device);
    setFormData({
      company_id: device.company_id,
      assigned_user_id: device.assigned_user_id || '',
      device_type: device.device_type,
      brand: device.brand,
      model: device.model,
      serial_number: device.serial_number,
      asset_tag: device.asset_tag || '',
      purchase_date: device.purchase_date,
      warranty_end_date: device.warranty_end_date || '',
      status: device.status
    });
    await fetchCompanyUsers(device.company_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDevice(null);
    setUsers([]);
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isWarrantyActive = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) >= new Date();
  };

  const filteredDevices = devices.filter(d => 
    d.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.asset_tag && d.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F62FE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="devices-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Devices</h1>
          <p className="text-slate-500 mt-1">Manage devices and assets</p>
        </div>
        <Button 
          onClick={openCreateModal}
          className="bg-[#0F62FE] hover:bg-[#0043CE] text-white"
          data-testid="add-device-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by serial, brand, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-11"
            data-testid="search-devices"
          />
        </div>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="form-select w-full sm:w-64"
        >
          <option value="">All Companies</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {filteredDevices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-modern">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Serial / Asset</th>
                  <th>Company</th>
                  <th>Warranty</th>
                  <th>Status</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr key={device.id} data-testid={`device-row-${device.id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Laptop className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{device.brand} {device.model}</p>
                          <p className="text-xs text-slate-500">{device.device_type}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-mono text-sm">{device.serial_number}</p>
                      {device.asset_tag && (
                        <p className="text-xs text-slate-500 font-mono">Tag: {device.asset_tag}</p>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm">{getCompanyName(device.company_id)}</span>
                      </div>
                    </td>
                    <td>
                      {device.warranty_end_date ? (
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isWarrantyActive(device.warranty_end_date)
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isWarrantyActive(device.warranty_end_date) ? 'Active' : 'Expired'}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(device.warranty_end_date)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not set</span>
                      )}
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        device.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-600'
                          : device.status === 'retired'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {device.status}
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
                          <DropdownMenuItem onClick={() => openEditModal(device)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(device)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Laptop className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">No devices found</p>
            <Button onClick={openCreateModal} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add your first device
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDevice ? 'Edit Device' : 'Add Device'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Company *</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="form-select"
                  data-testid="device-company-select"
                >
                  <option value="">Select Company</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Assigned User</label>
                <select
                  value={formData.assigned_user_id}
                  onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                  className="form-select"
                  disabled={!formData.company_id}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Device Type *</label>
              <select
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                className="form-select"
              >
                {deviceTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Brand *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="form-input"
                  placeholder="Dell, HP, Lenovo..."
                  data-testid="device-brand-input"
                />
              </div>
              <div>
                <label className="form-label">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="form-input"
                  placeholder="Latitude 5520..."
                  data-testid="device-model-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Serial Number *</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="form-input font-mono"
                  data-testid="device-serial-input"
                />
              </div>
              <div>
                <label className="form-label">Asset Tag</label>
                <input
                  type="text"
                  value={formData.asset_tag}
                  onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                  className="form-input font-mono"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Purchase Date *</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="form-input"
                  data-testid="device-purchase-date-input"
                />
              </div>
              <div>
                <label className="form-label">Warranty End Date</label>
                <input
                  type="date"
                  value={formData.warranty_end_date}
                  onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                <option value="active">Active</option>
                <option value="retired">Retired</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0F62FE] hover:bg-[#0043CE] text-white" data-testid="device-submit-btn">
                {editingDevice ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Devices;
