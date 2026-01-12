import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowRight, Loader2, Check, Building2, User, Mail, Lock, Phone, Globe, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPlan = location.state?.plan || 'plan_free';
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [subdomainError, setSubdomainError] = useState('');
  const [formData, setFormData] = useState({
    organization_name: '',
    subdomain: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    owner_phone: '',
    industry: '',
    company_size: ''
  });

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Professional Services',
    'Government',
    'Other'
  ];

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' }
  ];

  // Generate slug from organization name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Debounced subdomain check
  const checkSubdomain = useCallback(async (subdomain) => {
    if (!subdomain || subdomain.length < 4) {
      setSubdomainAvailable(null);
      setSubdomainError(subdomain.length > 0 ? 'Subdomain must be at least 4 characters' : '');
      return;
    }

    setSubdomainChecking(true);
    setSubdomainError('');
    
    try {
      const response = await axios.get(`${API}/api/check-subdomain/${subdomain}`);
      setSubdomainAvailable(response.data.available);
      if (!response.data.available) {
        setSubdomainError(response.data.reason || 'Subdomain not available');
      }
    } catch (error) {
      setSubdomainAvailable(false);
      setSubdomainError('Error checking subdomain');
    } finally {
      setSubdomainChecking(false);
    }
  }, []);

  // Debounce effect for subdomain check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.subdomain) {
        checkSubdomain(formData.subdomain);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.subdomain, checkSubdomain]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'organization_name') {
      // Auto-generate subdomain from org name if subdomain is empty or was auto-generated
      const newSlug = generateSlug(value);
      setFormData({ 
        ...formData, 
        [name]: value,
        subdomain: formData.subdomain === generateSlug(formData.organization_name) ? newSlug : formData.subdomain || newSlug
      });
    } else if (name === 'subdomain') {
      // Clean subdomain input
      const cleanedSubdomain = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData({ ...formData, [name]: cleanedSubdomain });
      setSubdomainAvailable(null);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateStep1 = () => {
    if (!formData.organization_name.trim()) {
      toast.error('Please enter organization name');
      return false;
    }
    if (!formData.subdomain || formData.subdomain.length < 4) {
      toast.error('Please choose a valid subdomain (at least 4 characters)');
      return false;
    }
    if (subdomainAvailable === false) {
      toast.error('Please choose an available subdomain');
      return false;
    }
    if (!formData.industry) {
      toast.error('Please select an industry');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.owner_name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!formData.owner_email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.owner_email)) {
      toast.error('Please enter a valid email');
      return false;
    }
    if (formData.owner_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    // Final subdomain check
    if (subdomainAvailable !== true) {
      toast.error('Please wait for subdomain availability check');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/api/signup`, {
        organization_name: formData.organization_name,
        subdomain: formData.subdomain,
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        owner_password: formData.owner_password,
        owner_phone: formData.owner_phone,
        industry: formData.industry,
        company_size: formData.company_size
      });
      
      // Store token and redirect
      localStorage.setItem('orgToken', response.data.access_token);
      localStorage.setItem('orgUser', JSON.stringify(response.data.user));
      localStorage.setItem('organization', JSON.stringify(response.data.organization));
      
      toast.success('Account created successfully!');
      
      // Redirect to org dashboard
      navigate('/org/dashboard');
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create account';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">AssetGuard</span>
          </Link>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 1 ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className={`flex-1 h-1 rounded ${step > 1 ? 'bg-violet-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 2 ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              2
            </div>
          </div>

          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your organization</h1>
              <p className="text-slate-500 mb-8">Tell us about your company</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Organization Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="organization_name"
                      value={formData.organization_name}
                      onChange={handleChange}
                      placeholder="Acme Corporation"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      data-testid="org-name-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Choose Your Subdomain *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleChange}
                      placeholder="your-company"
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
                        subdomainError ? 'border-red-300 bg-red-50' : 
                        subdomainAvailable === true ? 'border-green-300 bg-green-50' : 
                        'border-slate-200'
                      }`}
                      data-testid="subdomain-input"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {subdomainChecking && <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />}
                      {!subdomainChecking && subdomainAvailable === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {!subdomainChecking && subdomainAvailable === false && <X className="h-5 w-5 text-red-500" />}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {formData.subdomain ? `${formData.subdomain}.assetguard.com` : 'your-company.assetguard.com'}
                    </span>
                    {subdomainError && <span className="text-xs text-red-500">{subdomainError}</span>}
                    {subdomainAvailable === true && <span className="text-xs text-green-600">Available!</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Industry *
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select industry</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Size
                  </label>
                  <select
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select size</option>
                    {companySizes.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>

                <Button 
                  onClick={handleNext}
                  className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-lg mt-6"
                >
                  Continue <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h1>
              <p className="text-slate-500 mb-8">You'll be the admin for {formData.organization_name}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="owner_name"
                      value={formData.owner_name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      name="owner_email"
                      value={formData.owner_email}
                      onChange={handleChange}
                      placeholder="john@acme.com"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      name="owner_phone"
                      value={formData.owner_phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      name="owner_password"
                      value={formData.owner_password}
                      onChange={handleChange}
                      placeholder="Min 8 characters"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 py-6"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 py-6"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>Create Account</>
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{' '}
            <Link to="/org/login" className="text-violet-600 hover:text-violet-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-violet-600 to-indigo-600 p-12 items-center justify-center">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">Start your 14-day free trial</h2>
          <p className="text-violet-100 mb-8">
            Get full access to all Pro features during your trial. No credit card required.
          </p>
          
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span>Track up to 100 devices</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span>AI-powered support bot</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span>QR code asset labels</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span>Service ticket management</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span>Priority email support</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
