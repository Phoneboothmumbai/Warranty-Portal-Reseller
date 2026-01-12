import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, Wrench, MoreVertical, Laptop
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const OrgParts = () => {
  const { orgData } = useOutletContext();
  const [parts, setParts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  
  const [formData, setFormData] = useState({
    device_id: '',
    part_name: '',
    part_number: '',
    serial_number: '',
    brand: '',
    warranty_end: '',
    status: 'installed',
    notes: ''
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('orgToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [partsRes, devicesRes] = await Promise.all([
        axios.get(`${API}/api/org/parts`, { headers: getAuthHeaders() }),
        axios.get(`${API}/api/org/devices`, { headers: getAuthHeaders() })
      ]);
      setParts(partsRes.data || []);
      setDevices(devicesRes.data.devices || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.part_name) {
      toast.error('Please enter part name');
      return;
    }

    try {
      if (editingPart) {
        await axios.put(`${API}/api/org/parts/${editingPart.id}`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Part updated');
      } else {
        await axios.post(`${API}/api/org/parts`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Part created');
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (part) => {
    if (!window.confirm(`Delete "${part.part_name}"?`)) return;
    
    try {
      await axios.delete(`${API}/api/org/parts/${part.id}`, {
        headers: getAuthHeaders()
      });
      toast.success('Part deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete part');
    }
  };

  const openCreateModal = () => {
    setEditingPart(null);
    setFormData({
      device_id: '',
      part_name: '',
      part_number: '',
      serial_number: '',
      brand: '',
      warranty_end: '',
      status: 'installed',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (part) => {
    setEditingPart(part);
    setFormData({
      device_id: part.device_id || '',
      part_name: part.part_name || '',
      part_number: part.part_number || '',
      serial_number: part.serial_number || '',
      brand: part.brand || '',
      warranty_end: part.warranty_end || '',
      status: part.status || 'installed',
      notes: part.notes || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPart(null);
  };

  const getDeviceName = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? `${device.brand} ${device.model}` : '-';
  };

  const filteredParts = parts.filter(part => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      part.part_name?.toLowerCase().includes(q) ||
      part.part_number?.toLowerCase().includes(q) ||
      part.brand?.toLowerCase().includes(q)
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
    <div className="space-y-6" data-testid="org-parts-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Parts</h1>
          <p className="text-slate-500">Track device components and spare parts</p>
        </div>
        <Button onClick={openCreateModal} className="bg-violet-600 hover:bg-violet-700" data-testid="add-part-btn">
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search parts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Parts Table */}
      {filteredParts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Wrench className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No parts found</p>
          <Button onClick={openCreateModal} className="mt-4 bg-violet-600 hover:bg-violet-700">
            Add Your First Part
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Part</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Device</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Part Number</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{part.part_name}</p>
                        {part.brand && <p className="text-sm text-slate-500">{part.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{getDeviceName(part.device_id)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">{part.part_number || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      part.status === 'installed' ? 'bg-green-100 text-green-700' :
                      part.status === 'spare' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {part.status}
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
                        <DropdownMenuItem onClick={() => openEditModal(part)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(part)} className="text-red-600">
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
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPart ? 'Edit Part' : 'Add New Part'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Part Name *</label>
              <input
                type="text"
                value={formData.part_name}
                onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Device</label>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Part Number</label>
                <input
                  type="text"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="installed">Installed</option>
                  <option value="spare">Spare</option>
                  <option value="defective">Defective</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Warranty End</label>
              <input
                type="date"
                value={formData.warranty_end}
                onChange={(e) => setFormData({ ...formData, warranty_end: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                {editingPart ? 'Update' : 'Create'} Part
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgParts;
