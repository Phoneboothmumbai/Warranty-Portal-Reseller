import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, ShoppingCart, MoreVertical, Building2, 
  Calendar, Package, CheckCircle, Clock, Truck
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrgSupplyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const [formData, setFormData] = useState({
    company_id: '',
    product_id: '',
    quantity: 1,
    status: 'pending',
    delivery_date: '',
    notes: ''
  });

  const token = localStorage.getItem('org_token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, companiesRes, productsRes] = await Promise.all([
        axios.get(`${API}/org/supply-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/org/companies`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/org/supply-products`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setOrders(ordersRes.data || []);
      setCompanies(companiesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.quantity) {
      toast.error('Please select a product and quantity');
      return;
    }

    const submitData = { ...formData };
    submitData.quantity = parseInt(submitData.quantity) || 1;

    try {
      if (editingOrder) {
        await axios.put(`${API}/org/supply-orders/${editingOrder.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Order updated');
      } else {
        await axios.post(`${API}/org/supply-orders`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Order created');
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm('Delete this order?')) return;

    try {
      await axios.delete(`${API}/org/supply-orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const openCreateModal = () => {
    setEditingOrder(null);
    setFormData({
      company_id: '',
      product_id: '',
      quantity: 1,
      status: 'pending',
      delivery_date: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setFormData({
      company_id: order.company_id || '',
      product_id: order.product_id || '',
      quantity: order.quantity || 1,
      status: order.status || 'pending',
      delivery_date: order.delivery_date || '',
      notes: order.notes || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOrder(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredOrders = orders.filter(o => {
    const product = products.find(p => p.id === o.product_id);
    return product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           o.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const statusColors = {
    pending: 'bg-amber-50 text-amber-600',
    approved: 'bg-blue-50 text-blue-600',
    ordered: 'bg-indigo-50 text-indigo-600',
    shipped: 'bg-purple-50 text-purple-600',
    delivered: 'bg-emerald-50 text-emerald-600',
    cancelled: 'bg-red-50 text-red-600'
  };

  const StatusIcon = ({ status }) => {
    const icons = { 
      pending: Clock, 
      approved: CheckCircle, 
      ordered: Package, 
      shipped: Truck, 
      delivered: CheckCircle,
      cancelled: Clock 
    };
    const Icon = icons[status] || Clock;
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
    <div className="space-y-6" data-testid="org-supply-orders-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Office Supplies - Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Manage supply orders</p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700" data-testid="add-order-btn">
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-500 mb-4">Create your first supply order</p>
            <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Order #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Delivery</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const product = products.find(p => p.id === order.product_id);
                  const company = companies.find(c => c.id === order.company_id);
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-teal-600" />
                          </div>
                          <span className="font-mono text-sm text-slate-900">{order.order_number || order.id?.slice(0,8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-900">{product?.name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{company?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">{order.quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{formatDate(order.delivery_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.pending}`}>
                          <StatusIcon status={order.status} />
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
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
                              <DropdownMenuItem onClick={() => openEditModal(order)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(order)} className="text-red-600">
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
            <DialogTitle>{editingOrder ? 'Edit Order' : 'New Supply Order'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Select Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.unit_price ? `(₹${p.unit_price})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="ordered">Ordered</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery</label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                {editingOrder ? 'Update' : 'Create'} Order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgSupplyOrders;
