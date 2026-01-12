import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { CompanyAuthProvider } from "./context/CompanyAuthContext";
import { EngineerAuthProvider } from "./context/EngineerAuthContext";

// Public Pages
import LandingPage from "./pages/public/LandingPage";
import WarrantyResult from "./pages/public/WarrantyResult";
import PublicDevicePage from "./pages/public/PublicDevicePage";
import SignupPage from "./pages/public/SignupPage";
import OrgWarrantyPage from "./pages/public/OrgWarrantyPage";
import OrgLoginPage from "./pages/org/OrgLoginPage";
import OrgDashboard from "./pages/org/OrgDashboard";
import OrgSettings from "./pages/org/OrgSettings";

// Org Admin Portal
import OrgAdminLayout from "./layouts/OrgAdminLayout";
import OrgAdminDashboard from "./pages/org/OrgAdminDashboard";
import OrgCompanies from "./pages/org/OrgCompanies";
import OrgSites from "./pages/org/OrgSites";
import OrgUsers from "./pages/org/OrgUsers";
import OrgDevices from "./pages/org/OrgDevices";
import OrgParts from "./pages/org/OrgParts";
import OrgServiceHistory from "./pages/org/OrgServiceHistory";
import OrgLicenses from "./pages/org/OrgLicenses";
import OrgAMCContracts from "./pages/org/OrgAMCContracts";
import OrgDeployments from "./pages/org/OrgDeployments";
import OrgSupplyProducts from "./pages/org/OrgSupplyProducts";
import OrgSupplyOrders from "./pages/org/OrgSupplyOrders";
import OrgBilling from "./pages/org/OrgBilling";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Companies from "./pages/admin/Companies";
import CompanyDetails from "./pages/admin/CompanyDetails";
import Users from "./pages/admin/Users";
import Devices from "./pages/admin/Devices";
import Parts from "./pages/admin/Parts";
import AMCManagement from "./pages/admin/AMCManagement";
import Settings from "./pages/admin/Settings";
import MasterData from "./pages/admin/MasterData";
import ServiceHistory from "./pages/admin/ServiceHistory";
import AMCContracts from "./pages/admin/AMCContracts";
import Sites from "./pages/admin/Sites";
import Deployments from "./pages/admin/Deployments";
import Licenses from "./pages/admin/Licenses";
import SupplyProducts from "./pages/admin/SupplyProducts";
import SupplyOrders from "./pages/admin/SupplyOrders";
import PlanManagement from "./pages/admin/PlanManagement";

// Company Portal Pages
import CompanyLayout from "./layouts/CompanyLayout";
import CompanyLogin from "./pages/company/CompanyLogin";
import CompanyRegister from "./pages/company/CompanyRegister";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyDevices from "./pages/company/CompanyDevices";
import CompanyDeviceDetails from "./pages/company/CompanyDeviceDetails";
import CompanyTickets from "./pages/company/CompanyTickets";
import CompanyTicketDetails from "./pages/company/CompanyTicketDetails";
import CompanyAMC from "./pages/company/CompanyAMC";
import CompanyDeployments from "./pages/company/CompanyDeployments";
import CompanyUsers from "./pages/company/CompanyUsers";
import CompanySites from "./pages/company/CompanySites";
import CompanyProfile from "./pages/company/CompanyProfile";
import CompanyWarranty from "./pages/company/CompanyWarranty";
import CompanyOfficeSupplies from "./pages/company/CompanyOfficeSupplies";

// Engineer Portal Pages
import EngineerLogin from "./pages/engineer/EngineerLogin";
import EngineerDashboard from "./pages/engineer/EngineerDashboard";
import EngineerVisitDetail from "./pages/engineer/EngineerVisitDetail";

// Placeholder component for pages under development
const PlaceholderPage = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
    <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
    <p className="text-slate-500">This feature is coming soon!</p>
  </div>
);

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CompanyAuthProvider>
          <EngineerAuthProvider>
            <BrowserRouter>
              <div className="noise-bg min-h-screen">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/warranty/:serialNumber" element={<WarrantyResult />} />
                  <Route path="/device/:identifier" element={<PublicDevicePage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  
                  {/* Public Org Warranty Page - for tenant subdomains */}
                  <Route path="/org/:slug/warranty" element={<OrgWarrantyPage />} />
                  
                  <Route path="/org/login" element={<OrgLoginPage />} />
                  <Route path="/org/dashboard" element={<Navigate to="/org/admin/dashboard" replace />} />
                  <Route path="/org/settings" element={<Navigate to="/org/admin/integrations" replace />} />
                  
                  {/* Org Admin Portal Routes */}
                  <Route path="/org/admin" element={<OrgAdminLayout />}>
                    <Route index element={<Navigate to="/org/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<OrgAdminDashboard />} />
                    <Route path="companies" element={<OrgCompanies />} />
                    <Route path="sites" element={<OrgSites />} />
                    <Route path="users" element={<OrgUsers />} />
                    <Route path="devices" element={<OrgDevices />} />
                    <Route path="deployments" element={<OrgDeployments />} />
                    <Route path="parts" element={<OrgParts />} />
                    <Route path="licenses" element={<OrgLicenses />} />
                    <Route path="service-history" element={<OrgServiceHistory />} />
                    <Route path="amc-contracts" element={<OrgAMCContracts />} />
                    <Route path="supply-products" element={<OrgSupplyProducts />} />
                    <Route path="supply-orders" element={<OrgSupplyOrders />} />
                    <Route path="integrations" element={<OrgSettings />} />
                    <Route path="billing" element={<OrgBilling />} />
                    <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                  </Route>
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/setup" element={<AdminSetup />} />
                  
                  {/* Protected Admin Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="companies" element={<Companies />} />
                    <Route path="companies/:companyId" element={<CompanyDetails />} />
                    <Route path="users" element={<Users />} />
                    <Route path="devices" element={<Devices />} />
                    <Route path="parts" element={<Parts />} />
                    <Route path="amc" element={<AMCManagement />} />
                    <Route path="amc-contracts" element={<AMCContracts />} />
                    <Route path="sites" element={<Sites />} />
                    <Route path="deployments" element={<Deployments />} />
                    <Route path="licenses" element={<Licenses />} />
                    <Route path="service-history" element={<ServiceHistory />} />
                    <Route path="supply-products" element={<SupplyProducts />} />
                    <Route path="supply-orders" element={<SupplyOrders />} />
                    <Route path="plans" element={<PlanManagement />} />
                    <Route path="master-data" element={<MasterData />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* Company Portal Routes */}
                  <Route path="/company/login" element={<CompanyLogin />} />
                  <Route path="/company/register" element={<CompanyRegister />} />
                  
                  {/* Protected Company Routes */}
                  <Route path="/company" element={<CompanyLayout />}>
                    <Route index element={<Navigate to="/company/dashboard" replace />} />
                    <Route path="dashboard" element={<CompanyDashboard />} />
                    <Route path="devices" element={<CompanyDevices />} />
                    <Route path="devices/:deviceId" element={<CompanyDeviceDetails />} />
                    <Route path="warranty" element={<CompanyWarranty />} />
                    <Route path="amc" element={<CompanyAMC />} />
                    <Route path="tickets" element={<CompanyTickets />} />
                    <Route path="tickets/:ticketId" element={<CompanyTicketDetails />} />
                    <Route path="deployments" element={<CompanyDeployments />} />
                    <Route path="users" element={<CompanyUsers />} />
                    <Route path="sites" element={<CompanySites />} />
                    <Route path="office-supplies" element={<CompanyOfficeSupplies />} />
                    <Route path="profile" element={<CompanyProfile />} />
                  </Route>

                  {/* Engineer Portal Routes */}
                  <Route path="/engineer" element={<EngineerLogin />} />
                  <Route path="/engineer/dashboard" element={<EngineerDashboard />} />
                  <Route path="/engineer/visit/:visitId" element={<EngineerVisitDetail />} />
                </Routes>
              </div>
              <Toaster position="top-right" richColors />
            </BrowserRouter>
          </EngineerAuthProvider>
        </CompanyAuthProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
