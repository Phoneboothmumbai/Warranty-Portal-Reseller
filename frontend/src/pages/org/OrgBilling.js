import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, CheckCircle, AlertCircle, Clock, Calendar, 
  Zap, Users, Laptop, Shield, ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrgBilling = () => {
  const [orgData, setOrgData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('org_token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgRes, plansRes] = await Promise.all([
        axios.get(`${API}/org/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/plans`)
      ]);
      setOrgData(orgRes.data);
      setPlans(plansRes.data?.plans || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getCurrentPlan = () => {
    if (!orgData) return null;
    return plans.find(p => p.id === orgData.organization?.plan_id) || plans[0];
  };

  const handleUpgrade = async (planId) => {
    toast.info('Razorpay integration coming soon! Contact support for plan changes.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const org = orgData?.organization;

  return (
    <div className="space-y-6" data-testid="org-billing-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your subscription and billing</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Plan</p>
              <h2 className="text-2xl font-bold mt-1">{currentPlan?.display_name || 'Free'}</h2>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          {org?.subscription_status === 'trialing' && org?.trial_ends_at && (
            <div className="mt-4 flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg inline-flex">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Trial ends {formatDate(org.trial_ends_at)}</span>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Users</p>
                <p className="font-semibold text-slate-900">
                  {currentPlan?.features?.max_users === -1 ? 'Unlimited' : currentPlan?.features?.max_users || 5}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Laptop className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Devices</p>
                <p className="font-semibold text-slate-900">
                  {currentPlan?.features?.max_devices === -1 ? 'Unlimited' : currentPlan?.features?.max_devices || 50}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-semibold text-slate-900 capitalize">
                  {org?.subscription_status || 'Active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Plan Features</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'QR Code Generation', enabled: currentPlan?.features?.qr_codes },
            { label: 'AI Support Bot', enabled: currentPlan?.features?.ai_bot },
            { label: 'API Access', enabled: currentPlan?.features?.api_access },
            { label: 'Ticketing Integration', enabled: currentPlan?.features?.osticket_integration },
            { label: 'Custom Reports', enabled: currentPlan?.features?.custom_reports },
            { label: 'Priority Support', enabled: currentPlan?.features?.priority_support }
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              {feature.enabled ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-slate-300" />
              )}
              <span className={feature.enabled ? 'text-slate-900' : 'text-slate-400'}>
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Available Plans</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.filter(p => p.is_active).map((plan) => {
            const isCurrentPlan = plan.id === org?.plan_id;
            return (
              <div 
                key={plan.id} 
                className={`p-4 rounded-xl border-2 ${
                  isCurrentPlan 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{plan.display_name}</h4>
                    {plan.is_popular && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  {isCurrentPlan && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-slate-900">
                    ₹{plan.price_monthly || 0}
                  </span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{plan.description}</p>
                {!isCurrentPlan && plan.price_monthly > 0 && (
                  <Button 
                    onClick={() => handleUpgrade(plan.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Upgrade
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {isCurrentPlan && (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                )}
                {!isCurrentPlan && plan.price_monthly === 0 && (
                  <Button variant="outline" className="w-full" disabled>
                    Free Plan
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Payment History</h3>
        </div>
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No payments yet</p>
          <p className="text-sm text-slate-400 mt-1">Payment history will appear here once you upgrade</p>
        </div>
      </div>
    </div>
  );
};

export default OrgBilling;
