import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, Users, Laptop, Wrench, Shield, TrendingUp, 
  TrendingDown, CheckCircle2, XCircle, Clock, AlertTriangle,
  Calendar, History, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, label, value, subtext, trend, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card-elevated" data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}>
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
      {trend !== undefined && (
        <div className={`mt-4 flex items-center gap-1 text-sm ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
  );
};

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

  if (items.length === 0) return null;

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
            to={linkTo || `/admin/devices`}
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
          <Link to={linkTo || '/admin/devices'} className="text-xs text-slate-500 hover:text-slate-700">
            +{items.length - 3} more
          </Link>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        axios.get(`${API}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/dashboard/alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: null }))
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const totalAlerts = alerts ? (
    (alerts.warranty_expiring_7_days?.length || 0) +
    (alerts.warranty_expiring_15_days?.length || 0) +
    (alerts.amc_expiring_7_days?.length || 0) +
    (alerts.amc_expiring_15_days?.length || 0) +
    (alerts.devices_in_repair?.length || 0) +
    (alerts.devices_lost?.length || 0)
  ) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F62FE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your warranty and asset management</p>
        </div>
        {totalAlerts > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <Bell className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-700">{totalAlerts} alerts need attention</span>
          </div>
        )}
      </div>

      {/* Alerts Section */}
      {alerts && totalAlerts > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alerts & Notifications
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AlertCard 
              title="Warranty Expiring (≤7 days)" 
              items={alerts.warranty_expiring_7_days || []}
              icon={Clock}
              color="red"
            />
            <AlertCard 
              title="Warranty Expiring (8-15 days)" 
              items={alerts.warranty_expiring_15_days || []}
              icon={Clock}
              color="orange"
            />
            <AlertCard 
              title="Warranty Expiring (16-30 days)" 
              items={alerts.warranty_expiring_30_days || []}
              icon={Clock}
              color="yellow"
            />
            <AlertCard 
              title="AMC Expiring (≤7 days)" 
              items={alerts.amc_expiring_7_days || []}
              icon={Shield}
              color="red"
            />
            <AlertCard 
              title="AMC Expiring (8-15 days)" 
              items={alerts.amc_expiring_15_days || []}
              icon={Shield}
              color="orange"
            />
            <AlertCard 
              title="Devices In Repair" 
              items={alerts.devices_in_repair || []}
              icon={Wrench}
              color="orange"
            />
            {alerts.devices_lost?.length > 0 && (
              <AlertCard 
                title="Devices Lost" 
                items={alerts.devices_lost || []}
                icon={XCircle}
                color="red"
              />
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Building2} 
          label="Companies" 
          value={stats?.companies_count || 0}
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

      {/* Warranty Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-elevated">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Warranty Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-slate-900">Active Warranties</span>
              </div>
              <span className="text-2xl font-semibold text-emerald-600" data-testid="active-warranties">
                {stats?.active_warranties || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-slate-500" />
                <span className="font-medium text-slate-900">Expired Warranties</span>
              </div>
              <span className="text-2xl font-semibold text-slate-600" data-testid="expired-warranties">
                {stats?.expired_warranties || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-slate-900">Active AMC</span>
              </div>
              <span className="text-2xl font-semibold text-blue-600" data-testid="active-amc">
                {stats?.active_amc || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Devices */}
        <div className="card-elevated">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Devices</h3>
          {stats?.recent_devices && stats.recent_devices.length > 0 ? (
            <div className="space-y-3" data-testid="recent-devices-list">
              {stats.recent_devices.map((device, index) => (
                <div 
                  key={device.id || index} 
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Laptop className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {device.brand} {device.model}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {device.serial_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      device.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Laptop className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No devices added yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-elevated">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link 
            to="/admin/companies" 
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Building2 className="h-5 w-5 text-slate-400 mb-2 group-hover:text-[#0F62FE]" />
            <p className="text-sm font-medium text-slate-900">Add Company</p>
            <p className="text-xs text-slate-500">Register customer</p>
          </Link>
          <Link 
            to="/admin/devices" 
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Laptop className="h-5 w-5 text-slate-400 mb-2 group-hover:text-[#0F62FE]" />
            <p className="text-sm font-medium text-slate-900">Add Device</p>
            <p className="text-xs text-slate-500">Register asset</p>
          </Link>
          <Link 
            to="/admin/service-history" 
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <History className="h-5 w-5 text-slate-400 mb-2 group-hover:text-[#0F62FE]" />
            <p className="text-sm font-medium text-slate-900">Add Service</p>
            <p className="text-xs text-slate-500">Log repair/service</p>
          </Link>
          <Link 
            to="/admin/parts" 
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Wrench className="h-5 w-5 text-slate-400 mb-2 group-hover:text-[#0F62FE]" />
            <p className="text-sm font-medium text-slate-900">Add Part</p>
            <p className="text-xs text-slate-500">Track replacement</p>
          </Link>
          <Link 
            to="/admin/amc" 
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Shield className="h-5 w-5 text-slate-400 mb-2 group-hover:text-[#0F62FE]" />
            <p className="text-sm font-medium text-slate-900">Add AMC</p>
            <p className="text-xs text-slate-500">Service contract</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
