import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, Laptop, Wrench, Shield, TrendingUp, 
  CheckCircle2, XCircle, Clock, AlertTriangle,
  Bell, MapPin, FileText, CreditCard
} from 'lucide-react';
import { Button } from '../../components/ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

const StatCard = ({ icon: Icon, label, value, subtext, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-50 text-red-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm" data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-semibold text-slate-900">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const WarrantyStatusCard = ({ icon: Icon, label, value, bgColor, iconBgColor }) => (
  <div className={`${bgColor} rounded-xl p-6`}>
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

const AlertCard = ({ title, items, icon: Icon, color, linkTo }) => {
  const colorClasses = {
    red: 'border-red-200 bg-red-50',
    orange: 'border-amber-200 bg-amber-50',
    yellow: 'border-yellow-200 bg-yellow-50',
  };
  const iconColors = {
    red: 'text-red-500',
    orange: 'text-amber-500',
    yellow: 'text-yellow-600',
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${iconColors[color]}`} />
        <span className="text-sm font-medium text-slate-900">{title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          color === 'red' ? 'bg-red-100 text-red-700' : 
          color === 'orange' ? 'bg-amber-100 text-amber-700' : 
          'bg-yellow-100 text-yellow-700'
        }`}>
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.slice(0, 3).map((item, idx) => (
          <Link 
            key={idx} 
            to={linkTo || `/org/admin/devices`}
            className="flex items-center justify-between text-sm hover:bg-white/50 rounded px-2 py-1 -mx-2"
          >
            <span className="text-slate-700 truncate">
              {item.brand} {item.model}
            </span>
            {item.days_remaining !== undefined && (
              <span className="text-xs text-slate-500 shrink-0 ml-2">
                {item.days_remaining} days
              </span>
            )}
          </Link>
        ))}
        {items.length > 3 && (
          <Link to={linkTo || '/org/admin/devices'} className="text-xs text-slate-500 hover:text-slate-700">
            +{items.length - 3} more
          </Link>
        )}
      </div>
    </div>
  );
};

const OrgAdminDashboard = () => {
  const { orgData } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [recentDevices, setRecentDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('orgToken');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchDashboard = async () => {
    try {
      const [statsRes, alertsRes, devicesRes] = await Promise.all([
        axios.get(`${API}/api/org/dashboard`, { headers: getAuthHeaders() }),
        axios.get(`${API}/api/org/dashboard/alerts`, { headers: getAuthHeaders() }).catch(() => ({ data: null })),
        axios.get(`${API}/api/org/devices?limit=5`, { headers: getAuthHeaders() }).catch(() => ({ data: { devices: [] } }))
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
      setRecentDevices(devicesRes.data?.devices || []);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const org = orgData?.organization;
  const plan = orgData?.plan;

  const totalAlerts = alerts ? (
    (alerts.warranty_expiring_7_days?.length || 0) +
    (alerts.warranty_expiring_15_days?.length || 0) +
    (alerts.amc_expiring_7_days?.length || 0) +
    (alerts.amc_expiring_15_days?.length || 0)
  ) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="org-admin-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your warranty and asset management</p>
        </div>
        <div className="flex items-center gap-3">
          {totalAlerts > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <Bell className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-700">{totalAlerts} alerts</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg">
            <CreditCard className="h-4 w-4 text-violet-500" />
            <span className="text-sm text-violet-700">{plan?.name || 'Free'} Plan</span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts && totalAlerts > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alerts & Notifications
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AlertCard 
              title="Warranty Expiring (≤7 days)" 
              items={alerts.warranty_expiring_7_days}
              icon={Clock}
              color="red"
            />
            <AlertCard 
              title="Warranty Expiring (8-15 days)" 
              items={alerts.warranty_expiring_15_days}
              icon={Clock}
              color="orange"
            />
            <AlertCard 
              title="AMC Expiring (≤7 days)" 
              items={alerts.amc_expiring_7_days}
              icon={Shield}
              color="red"
            />
            <AlertCard 
              title="AMC Expiring (8-15 days)" 
              items={alerts.amc_expiring_15_days}
              icon={Shield}
              color="orange"
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={MapPin} 
          label="Sites" 
          value={stats?.sites_count || 0}
          color="blue"
        />
        <StatCard 
          icon={Users} 
          label="Users" 
          value={stats?.users_count || 0}
          color="slate"
        />
        <StatCard 
          icon={Laptop} 
          label="Devices" 
          value={stats?.devices_count || 0}
          color="green"
        />
        <StatCard 
          icon={Wrench} 
          label="Parts Tracked" 
          value={stats?.parts_count || 0}
          color="orange"
        />
      </div>

      {/* Warranty Status Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Warranty Status</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <WarrantyStatusCard 
            icon={CheckCircle2}
            label="Active Warranties"
            value={stats?.active_warranties || 0}
            bgColor="bg-gradient-to-br from-emerald-50 to-green-100"
            iconBgColor="bg-emerald-500"
          />
          <WarrantyStatusCard 
            icon={XCircle}
            label="Expired Warranties"
            value={stats?.expired_warranties || 0}
            bgColor="bg-slate-50"
            iconBgColor="bg-slate-400"
          />
          <WarrantyStatusCard 
            icon={Shield}
            label="Active AMC"
            value={stats?.active_amc || 0}
            bgColor="bg-slate-50"
            iconBgColor="bg-blue-500"
          />
        </div>
      </div>

      {/* Recent Devices Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Devices</h2>
          <Link 
            to="/org/admin/devices"
            className="text-sm text-violet-600 hover:text-violet-700"
          >
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {recentDevices.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Laptop className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No devices added yet</p>
              <Link to="/org/admin/devices">
                <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
                  Add First Device
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDevices.map((device) => (
                <Link 
                  key={device.id}
                  to={`/org/admin/devices/${device.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Laptop className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {device.brand} {device.model}
                    </p>
                    <p className="text-sm text-slate-500">{device.serial_number}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    device.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {device.status || 'active'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            to="/org/admin/devices"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Laptop className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Add Device</p>
              <p className="text-xs text-slate-500">Register new asset</p>
            </div>
          </Link>
          <Link 
            to="/org/admin/users"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Add User</p>
              <p className="text-xs text-slate-500">Invite team member</p>
            </div>
          </Link>
          <Link 
            to="/org/admin/service-history"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Service Request</p>
              <p className="text-xs text-slate-500">Create new ticket</p>
            </div>
          </Link>
          <Link 
            to="/org/admin/supply-products"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Order Supplies</p>
              <p className="text-xs text-slate-500">Office & consumables</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrgAdminDashboard;
