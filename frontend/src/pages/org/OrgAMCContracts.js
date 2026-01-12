import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, FileText, MoreVertical, Building2, 
  Calendar, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrgAMCContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    company_id: '',
    amc_type: 'comprehensive',
    start_date: '',
    end_date: '',
    contract_value: '',
    coverage_includes: '',
    notes: ''
  });

  const token = localStorage.getItem('org_token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contractsRes, companiesRes] = await Promise.all([
        axios.get(`${API}/org/amc-contracts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/org/companies`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setContracts(contractsRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in required fields');
      return;
    }

    const submitData = { ...formData };
    if (submitData.contract_value) submitData.contract_value = parseFloat(submitData.contract_value);

    try {
      if (editingContract) {
        await axios.put(`${API}/org/amc-contracts/${editingContract.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Contract updated');
      } else {
        await axios.post(`${API}/org/amc-contracts`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Contract created');
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (contract) => {
    if (!window.confirm(`Delete "${contract.name}" contract?`)) return;

    try {
      await axios.delete(`${API}/org/amc-contracts/${contract.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Contract deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete contract');
    }
  };

  const openCreateModal = () => {
    setEditingContract(null);
    setFormData({
      name: '',
      company_id: '',
      amc_type: 'comprehensive',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      contract_value: '',
      coverage_includes: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (contract) => {
    setEditingContract(contract);
    setFormData({
      name: contract.name,
      company_id: contract.company_id || '',
      amc_type: contract.amc_type || 'comprehensive',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      contract_value: contract.contract_value || '',
      coverage_includes: contract.coverage_includes || '',
      notes: contract.notes || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingContract(null);
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

  const getStatus = (contract) => {
    if (!contract.end_date) return 'active';
    const days = getDaysUntilExpiry(contract.end_date);
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring';
    return 'active';
  };

  const filteredContracts = contracts.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="space-y-6" data-testid="org-amc-contracts-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AMC Contracts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage annual maintenance contracts</p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700" data-testid="add-amc-btn">
          <Plus className="h-4 w-4 mr-2" />
          Add Contract
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="amc-search-input"
          />
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No contracts found</h3>
            <p className="text-slate-500 mb-4">Add your first AMC contract</p>
            <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Contract
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Contract</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Period</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.map((contract) => {
                  const status = getStatus(contract);
                  const days = getDaysUntilExpiry(contract.end_date);
                  const company = companies.find(c => c.id === contract.company_id);
                  
                  return (
                    <tr key={contract.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{contract.name}</p>
                            {contract.contract_value && (
                              <p className="text-sm text-slate-500">₹{contract.contract_value.toLocaleString()}</p>
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
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full capitalize">
                          {contract.amc_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-slate-600">{formatDate(contract.start_date)}</p>
                          <p className="text-slate-400">to {formatDate(contract.end_date)}</p>
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
                              <DropdownMenuItem onClick={() => openEditModal(contract)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(contract)} className="text-red-600">
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
            <DialogTitle>{editingContract ? 'Edit Contract' : 'Add AMC Contract'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contract Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">AMC Type</label>
              <select
                value={formData.amc_type}
                onChange={(e) => setFormData({ ...formData, amc_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="non_comprehensive">Non-Comprehensive</option>
                <option value="labor_only">Labor Only</option>
              </select>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contract Value (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.contract_value}
                onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Includes</label>
              <textarea
                value={formData.coverage_includes}
                onChange={(e) => setFormData({ ...formData, coverage_includes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="List what's covered..."
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
                {editingContract ? 'Update' : 'Create'} Contract
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgAMCContracts;
