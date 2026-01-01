import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Shield, MoreVertical, Laptop, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AMCManagement = () => {
  const { token } = useAuth();
  const [amcList, setAmcList] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAMC, setEditingAMC] = useState(null);
  const [formData, setFormData] = useState({
    device_id: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [amcRes, devicesRes] = await Promise.all([
        axios.get(`${API}/admin/amc`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/devices`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAmcList(amcRes.data);
      setDevices(devicesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.device_id || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in required fields');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      if (editingAMC) {
        await axios.put(`${API}/admin/amc/${editingAMC.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('AMC updated');
      } else {
        await axios.post(`${API}/admin/amc`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('AMC created');
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (amc) => {
    if (!window.confirm(`Delete AMC for this device?`)) return;
    
    try {
      await axios.delete(`${API}/admin/amc/${amc.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('AMC deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete AMC');
    }
  };

  const openCreateModal = () => {
    setEditingAMC(null);
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
    setFormData({
      device_id: '',
      start_date: today,
      end_date: nextYear,
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (amc) => {
    setEditingAMC(amc);
    setFormData({
      device_id: amc.device_id,
      start_date: amc.start_date,
      end_date: amc.end_date,
      notes: amc.notes || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAMC(null);
  };

  const getDeviceInfo = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? `${device.brand} ${device.model} (${device.serial_number})` : 'Unknown';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isAMCActive = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) >= new Date();
  };

  // Get devices without AMC for the dropdown
  const devicesWithoutAMC = devices.filter(d => 
    !amcList.some(a => a.device_id === d.id) || (editingAMC && editingAMC.device_id === d.id)
  );

  const filteredAMC = amcList.filter(amc => {
    const device = devices.find(d => d.id === amc.device_id);
    const deviceStr = device ? `${device.brand} ${device.model} ${device.serial_number}` : '';
    return deviceStr.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F62FE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="amc-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">AMC Management</h1>
          <p className="text-slate-500 mt-1">Manage Annual Maintenance Contracts</p>
        </div>
        <Button 
          onClick={openCreateModal}
          className="bg-[#0F62FE] hover:bg-[#0043CE] text-white"
          data-testid="add-amc-btn"
          disabled={devicesWithoutAMC.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add AMC
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by device..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input pl-11"
          data-testid="search-amc"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {filteredAMC.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-modern">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAMC.map((amc) => (
                  <tr key={amc.id} data-testid={`amc-row-${amc.id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{getDeviceInfo(amc.device_id)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <p>{formatDate(amc.start_date)}</p>
                        <p className="text-slate-500">to {formatDate(amc.end_date)}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {isAMCActive(amc.end_date) ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="badge-active">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-slate-400" />
                            <span className="badge-expired">Expired</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-slate-500 truncate max-w-[200px] block">
                        {amc.notes || '-'}
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
                          <DropdownMenuItem onClick={() => openEditModal(amc)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(amc)}
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
            <Shield className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">No AMC records found</p>
            {devicesWithoutAMC.length > 0 ? (
              <Button onClick={openCreateModal} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add your first AMC
              </Button>
            ) : (
              <p className="text-sm text-slate-400">Add devices first to create AMC records</p>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAMC ? 'Edit AMC' : 'Add AMC'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="form-label">Device *</label>
              <select
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                className="form-select"
                data-testid="amc-device-select"
                disabled={editingAMC}
              >
                <option value="">Select Device</option>
                {devicesWithoutAMC.map(d => (
                  <option key={d.id} value={d.id}>{d.brand} {d.model} ({d.serial_number})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="form-input"
                  data-testid="amc-start-date-input"
                />
              </div>
              <div>
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="form-input"
                  data-testid="amc-end-date-input"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input"
                rows={3}
                placeholder="Contract details, renewal notes..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0F62FE] hover:bg-[#0043CE] text-white" data-testid="amc-submit-btn">
                {editingAMC ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AMCManagement;
