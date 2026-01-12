import { useState, useEffect } from 'react';
import { 
  CreditCard, Plus, Edit2, Trash2, Check, X, Loader2,
  DollarSign, Users, Laptop, Bot, QrCode, Star
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const PlanManagement = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    is_popular: false,
    is_active: true,
    sort_order: 1,
    features: {
      max_devices: 10,
      max_users: 2,
      max_companies: 1,
      ai_support_bot: false,
      qr_codes: true,
      api_access: false,
      custom_branding: false,
      priority_support: false,
      white_label: false,
      export_reports: false,
      osticket_integration: false,
      engineer_portal: false
    }
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/api/admin/plans`, {
        headers: getAuthHeaders()
      });
      setPlans(response.data.plans || []);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        display_name: plan.display_name,
        description: plan.description || '',
        price_monthly: plan.price_monthly || 0,
        price_yearly: plan.price_yearly || 0,
        is_popular: plan.is_popular || false,
        is_active: plan.is_active !== false,
        sort_order: plan.sort_order || 1,
        features: {
          max_devices: plan.features?.max_devices ?? 10,
          max_users: plan.features?.max_users ?? 2,
          max_companies: plan.features?.max_companies ?? 1,
          ai_support_bot: plan.features?.ai_support_bot ?? false,
          qr_codes: plan.features?.qr_codes ?? true,
          api_access: plan.features?.api_access ?? false,
          custom_branding: plan.features?.custom_branding ?? false,
          priority_support: plan.features?.priority_support ?? false,
          white_label: plan.features?.white_label ?? false,
          export_reports: plan.features?.export_reports ?? false,
          osticket_integration: plan.features?.osticket_integration ?? false,
          engineer_portal: plan.features?.engineer_portal ?? false
        }
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        price_monthly: 0,
        price_yearly: 0,
        is_popular: false,
        is_active: true,
        sort_order: plans.length + 1,
        features: {
          max_devices: 10,
          max_users: 2,
          max_companies: 1,
          ai_support_bot: false,
          qr_codes: true,
          api_access: false,
          custom_branding: false,
          priority_support: false,
          white_label: false,
          export_reports: false,
          osticket_integration: false,
          engineer_portal: false
        }
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('features.')) {
      const featureKey = name.split('.')[1];
      setFormData({
        ...formData,
        features: {
          ...formData.features,
          [featureKey]: type === 'checkbox' ? checked : 
                        type === 'number' ? parseInt(value) || 0 : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : 
                type === 'number' ? parseInt(value) || 0 : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.display_name) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        id: editingPlan?.id || `plan_${formData.name.toLowerCase().replace(/\s+/g, '_')}`
      };

      if (editingPlan) {
        await axios.put(`${API}/api/admin/plans/${editingPlan.id}`, payload, {
          headers: getAuthHeaders()
        });
        toast.success('Plan updated successfully');
      } else {
        await axios.post(`${API}/api/admin/plans`, payload, {
          headers: getAuthHeaders()
        });
        toast.success('Plan created successfully');
      }
      
      fetchPlans();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await axios.patch(`${API}/api/admin/plans/${plan.id}/toggle`, {}, {
        headers: getAuthHeaders()
      });
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'}`);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to update plan');
    }
  };

  const formatPrice = (paise) => {
    if (paise === 0) return 'Free';
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plan Management</h1>
          <p className="text-slate-500">Manage subscription plans and pricing</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="bg-violet-600 hover:bg-violet-700"
          data-testid="add-plan-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`bg-white rounded-xl border-2 p-6 relative ${
              plan.is_popular ? 'border-violet-500 shadow-lg' : 'border-slate-200'
            } ${!plan.is_active ? 'opacity-60' : ''}`}
          >
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                Popular
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-violet-600" />
                <h3 className="font-bold text-slate-900">{plan.display_name}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenModal(plan)}
                  className="p-1 text-slate-400 hover:text-violet-600"
                  data-testid={`edit-plan-${plan.name}`}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(plan)}
                  className={`p-1 ${plan.is_active ? 'text-green-500' : 'text-slate-400'}`}
                  data-testid={`toggle-plan-${plan.name}`}
                >
                  {plan.is_active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-4">{plan.description}</p>

            <div className="mb-4">
              <div className="text-2xl font-bold text-slate-900">
                {formatPrice(plan.price_monthly)}
                {plan.price_monthly > 0 && <span className="text-sm font-normal text-slate-500">/mo</span>}
              </div>
              {plan.price_yearly > 0 && (
                <div className="text-sm text-slate-500">
                  or {formatPrice(plan.price_yearly)}/year
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Laptop className="h-4 w-4 text-slate-400" />
                <span>{plan.features?.max_devices === -1 ? 'Unlimited' : plan.features?.max_devices} devices</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span>{plan.features?.max_users === -1 ? 'Unlimited' : plan.features?.max_users} users</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className={`h-4 w-4 ${plan.features?.ai_support_bot ? 'text-green-500' : 'text-slate-300'}`} />
                <span className={plan.features?.ai_support_bot ? '' : 'text-slate-400'}>AI Support Bot</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className={`h-4 w-4 ${plan.features?.priority_support ? 'text-yellow-500' : 'text-slate-300'}`} />
                <span className={plan.features?.priority_support ? '' : 'text-slate-400'}>Priority Support</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Plan Name (ID) *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., pro"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    disabled={!!editingPlan}
                    data-testid="plan-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    placeholder="e.g., Pro"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    data-testid="plan-display-name-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Brief description of the plan"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  data-testid="plan-description-input"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Monthly Price (in paise)
                  </label>
                  <input
                    type="number"
                    name="price_monthly"
                    value={formData.price_monthly}
                    onChange={handleChange}
                    placeholder="99900 = ₹999"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    data-testid="plan-price-monthly-input"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.price_monthly > 0 ? `₹${(formData.price_monthly / 100).toFixed(2)}` : 'Free'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Yearly Price (in paise)
                  </label>
                  <input
                    type="number"
                    name="price_yearly"
                    value={formData.price_yearly}
                    onChange={handleChange}
                    placeholder="999900 = ₹9,999"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    data-testid="plan-price-yearly-input"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.price_yearly > 0 ? `₹${(formData.price_yearly / 100).toFixed(2)}` : 'Free'}
                  </p>
                </div>
              </div>

              {/* Limits */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Limits</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Max Devices
                    </label>
                    <input
                      type="number"
                      name="features.max_devices"
                      value={formData.features.max_devices}
                      onChange={handleChange}
                      placeholder="-1 for unlimited"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      data-testid="plan-max-devices-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Max Users
                    </label>
                    <input
                      type="number"
                      name="features.max_users"
                      value={formData.features.max_users}
                      onChange={handleChange}
                      placeholder="-1 for unlimited"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      data-testid="plan-max-users-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Max Companies
                    </label>
                    <input
                      type="number"
                      name="features.max_companies"
                      value={formData.features.max_companies}
                      onChange={handleChange}
                      placeholder="-1 for unlimited"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      data-testid="plan-max-companies-input"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'ai_support_bot', label: 'AI Support Bot' },
                    { key: 'qr_codes', label: 'QR Code Labels' },
                    { key: 'api_access', label: 'API Access' },
                    { key: 'custom_branding', label: 'Custom Branding' },
                    { key: 'priority_support', label: 'Priority Support' },
                    { key: 'white_label', label: 'White Label' },
                    { key: 'export_reports', label: 'Export Reports' },
                    { key: 'osticket_integration', label: 'Ticketing Integration' },
                    { key: 'engineer_portal', label: 'Engineer Portal' },
                  ].map((feature) => (
                    <label key={feature.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`features.${feature.key}`}
                        checked={formData.features[feature.key]}
                        onChange={handleChange}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        data-testid={`plan-feature-${feature.key}`}
                      />
                      <span className="text-sm text-slate-700">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_popular"
                    checked={formData.is_popular}
                    onChange={handleChange}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    data-testid="plan-is-popular"
                  />
                  <span className="text-sm text-slate-700">Mark as Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    data-testid="plan-is-active"
                  />
                  <span className="text-sm text-slate-700">Active</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-700">Sort Order:</label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleChange}
                    className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm"
                    data-testid="plan-sort-order"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-700"
                  data-testid="save-plan-btn"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;
