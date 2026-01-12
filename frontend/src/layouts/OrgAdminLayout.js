import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Laptop, Wrench, Settings, LogOut, Shield, 
  Menu, X, ChevronRight, History, FileText, MapPin, Package, Key, 
  ShoppingBag, ClipboardList, Link2, CreditCard, Building2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const navItems = [
  { path: '/org/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/org/admin/sites', label: 'Sites', icon: MapPin },
  { path: '/org/admin/users', label: 'Users', icon: Users },
  { path: '/org/admin/devices', label: 'Devices', icon: Laptop },
  { path: '/org/admin/deployments', label: 'Deployments', icon: Package },
  { path: '/org/admin/parts', label: 'Parts', icon: Wrench },
  { path: '/org/admin/licenses', label: 'Licenses', icon: Key },
  { path: '/org/admin/service-history', label: 'Service History', icon: History },
  { path: '/org/admin/amc-contracts', label: 'AMC Contracts', icon: FileText },
  { type: 'divider', label: 'Office Supplies' },
  { path: '/org/admin/supply-products', label: 'Products', icon: ShoppingBag },
  { path: '/org/admin/supply-orders', label: 'Orders', icon: ClipboardList },
  { type: 'divider', label: 'Settings' },
  { path: '/org/admin/integrations', label: 'Integrations', icon: Link2 },
  { path: '/org/admin/billing', label: 'Billing', icon: CreditCard },
  { path: '/org/admin/settings', label: 'Settings', icon: Settings },
];

const OrgAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('orgToken');
    if (!token) {
      navigate('/org/login');
      return;
    }

    try {
      const response = await axios.get(`${API}/api/org/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrgData(response.data);
      setUser(response.data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('orgToken');
        localStorage.removeItem('orgUser');
        localStorage.removeItem('organization');
        navigate('/org/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('orgToken');
    localStorage.removeItem('orgUser');
    localStorage.removeItem('organization');
    navigate('/org/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!orgData) {
    return null;
  }

  const org = orgData.organization;
  const currentPage = navItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-slate-900">{currentPage}</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-testid="mobile-menu-btn"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo & Org Name */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 truncate max-w-[140px]">{org?.name || 'Organization'}</h1>
                <p className="text-xs text-slate-500">Admin Portal</p>
              </div>
            </div>
            <div className="mt-3 px-2 py-1 bg-violet-50 rounded text-xs text-violet-600 font-medium truncate">
              {org?.slug}.assetguard.com
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item, index) => {
              if (item.type === 'divider') {
                return (
                  <div key={index} className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {item.label}
                    </p>
                  </div>
                );
              }

              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-violet-50 text-violet-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-violet-600">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between bg-white border-b border-slate-100 px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Portal</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">{currentPage}</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              View Public Portal
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <Outlet context={{ orgData, user, refreshAuth: checkAuth }} />
        </div>
      </main>
    </div>
  );
};

export default OrgAdminLayout;
