import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, Search, History, Laptop, Calendar, User, DollarSign
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const SERVICE_TYPES = [
  { value: 'repair', label: 'Repair' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'installation', label: 'Installation' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'inspection', label: 'Inspection' },
];

const OrgServiceHistory = () => {
  const { orgData } = useOutletContext();
  const [history, setHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    device_id: '',
    service_type: 'repair',
    description: '',
    technician: '',
    cost: '',
    status: 'completed',
    notes: ''
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('orgToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchData();
  }, [filterDevice]);

  const fetchData = async () => {
    try {
      const params = filterDevice ? { device_id: filterDevice } : {};
      const [historyRes, devicesRes] = await Promise.all([
        axios.get(`${API}/api/org/service-history`, { params, headers: getAuthHeaders() }),
        axios.get(`${API}/api/org/devices`, { headers: getAuthHeaders() })
      ]);
      setHistory(historyRes.data || []);
      setDevices(devicesRes.data.devices || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.device_id || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await axios.post(`${API}/api/org/service-history`, {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : 0
      }, {
        headers: getAuthHeaders()
      });
      toast.success('Service entry created');
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const openCreateModal = () => {
    setFormData({
      device_id: filterDevice || '',
      service_type: 'repair',
      description: '',
      technician: '',
      cost: '',
      status: 'completed',
      notes: ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const getDeviceName = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? `${device.brand} ${device.model}` : 'Unknown Device';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredHistory = history.filter(entry => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.description?.toLowerCase().includes(q) ||
      entry.technician?.toLowerCase().includes(q) ||
      entry.service_type?.toLowerCase().includes(q)
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
    <div className="space-y-6" data-testid="org-service-history-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Service History</h1>
          <p className="text-slate-500">Track repairs, maintenance, and service records</p>
        </div>
        <Button onClick={openCreateModal} className="bg-violet-600 hover:bg-violet-700" data-testid="add-service-btn">
          <Plus className="h-4 w-4 mr-2" />
          Add Service Entry
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search service history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={filterDevice}
          onChange={(e) => setFilterDevice(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All Devices</option>
          {devices.map(device => (
            <option key={device.id} value={device.id}>{device.brand} {device.model}</option>
          ))}
        </select>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <History className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No service history found</p>
          <Button onClick={openCreateModal} className="mt-4 bg-violet-600 hover:bg-violet-700">
            Add First Service Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    entry.service_type === 'repair' ? 'bg-red-100' :
                    entry.service_type === 'maintenance' ? 'bg-blue-100' :
                    entry.service_type === 'upgrade' ? 'bg-green-100' :
                    'bg-slate-100'
                  }`}>
                    <History className={`h-5 w-5 ${
                      entry.service_type === 'repair' ? 'text-red-600' :
                      entry.service_type === 'maintenance' ? 'text-blue-600' :
                      entry.service_type === 'upgrade' ? 'text-green-600' :
                      'text-slate-600'
                    }`} />
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      entry.service_type === 'repair' ? 'bg-red-100 text-red-700' :
                      entry.service_type === 'maintenance' ? 'bg-blue-100 text-blue-700' :
                      entry.service_type === 'upgrade' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {entry.service_type}
                    </span>
                    <p className="font-medium text-slate-900 mt-1">{entry.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  entry.status === 'completed' ? 'bg-green-100 text-green-700' :
                  entry.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {entry.status}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Laptop className="h-4 w-4 text-slate-400" />
                  {getDeviceName(entry.device_id)}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(entry.created_at)}
                </div>
                {entry.technician && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-slate-400" />
                    {entry.technician}
                  </div>
                )}
                {entry.cost > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    ₹{entry.cost.toLocaleString()}
                  </div>
                )}
              </div>
              
              {entry.notes && (
                <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">{entry.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Service Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Device *</label>
              <select
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select Device</option>
                {devices.map(device => (
                  <option key={device.id} value={device.id}>{device.brand} {device.model} ({device.serial_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {SERVICE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Technician</label>
                <input
                  type="text"
                  value={formData.technician}
                  onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cost (₹)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                Create Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgServiceHistory;
