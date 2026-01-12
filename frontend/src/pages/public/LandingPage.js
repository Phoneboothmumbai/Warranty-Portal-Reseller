import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Check, X, Shield, Zap, Users, Laptop, Bot, QrCode,
  ArrowRight, ChevronRight, Star, Building2, Headphones
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const LandingPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/api/plans`);
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (paise) => {
    if (paise === 0) return 'Free';
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
  };

  const features = [
    { icon: Laptop, title: 'Device Tracking', desc: 'Track all your IT assets in one place' },
    { icon: Shield, title: 'Warranty Management', desc: 'Never miss a warranty expiration' },
    { icon: Bot, title: 'AI Support Bot', desc: 'Instant troubleshooting with AI' },
    { icon: QrCode, title: 'QR Code Labels', desc: 'Scan devices for instant info' },
    { icon: Users, title: 'Multi-user Access', desc: 'Team collaboration built-in' },
    { icon: Headphones, title: 'Service Tickets', desc: 'Streamlined support workflow' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">AssetGuard</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900">Pricing</a>
              <Link to="/org/login" className="text-slate-600 hover:text-slate-900">Login</Link>
              <Button onClick={() => navigate('/signup')} className="bg-violet-600 hover:bg-violet-700">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            14-day free trial • No credit card required
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Manage IT Assets &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              Warranties Effortlessly
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Track devices, manage warranties, generate QR codes, and provide AI-powered support – all in one platform built for IT teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/signup')}
              className="bg-violet-600 hover:bg-violet-700 text-lg px-8 py-6"
            >
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-slate-900">10,000+</div>
              <div className="text-slate-500">Devices Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">500+</div>
              <div className="text-slate-500">Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">99.9%</div>
              <div className="text-slate-500">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to manage IT assets
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From device tracking to AI-powered support, we've got you covered.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl border border-slate-200 hover:border-violet-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Start free, upgrade when you need more
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-slate-200 rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-white text-slate-900 shadow' 
                    : 'text-slate-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'yearly' 
                    ? 'bg-white text-slate-900 shadow' 
                    : 'text-slate-600'
                }`}
              >
                Yearly <span className="text-emerald-600 ml-1">Save 17%</span>
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative p-8 rounded-2xl bg-white border-2 transition-all ${
                  plan.is_popular 
                    ? 'border-violet-500 shadow-xl scale-105' 
                    : 'border-slate-200 hover:border-violet-200'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-600 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.display_name}</h3>
                  <p className="text-slate-500 text-sm">{plan.description}</p>
                </div>
                
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-slate-900">
                    {formatPrice(plan[`price_${billingCycle}`])}
                  </span>
                  {plan[`price_${billingCycle}`] > 0 && (
                    <span className="text-slate-500">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span>{plan.features.max_devices === -1 ? 'Unlimited' : plan.features.max_devices} devices</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span>{plan.features.max_users === -1 ? 'Unlimited' : plan.features.max_users} users</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    {plan.features.ai_support_bot ? (
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={!plan.features.ai_support_bot ? 'text-slate-400' : ''}>
                      AI Support Bot
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    {plan.features.qr_codes ? (
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={!plan.features.qr_codes ? 'text-slate-400' : ''}>
                      QR Code Labels
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    {plan.features.priority_support ? (
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={!plan.features.priority_support ? 'text-slate-400' : ''}>
                      Priority Support
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    {plan.features.api_access ? (
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={!plan.features.api_access ? 'text-slate-400' : ''}>
                      API Access
                    </span>
                  </li>
                </ul>
                
                <Button 
                  onClick={() => navigate('/signup', { state: { plan: plan.id } })}
                  className={`w-full ${
                    plan.is_popular 
                      ? 'bg-violet-600 hover:bg-violet-700' 
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {plan.name === 'free' ? 'Get Started' : 'Start Free Trial'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to streamline your IT asset management?
          </h2>
          <p className="text-lg text-violet-100 mb-8">
            Join hundreds of companies already using AssetGuard to manage their devices and warranties.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/signup')}
            className="bg-white text-violet-600 hover:bg-violet-50 text-lg px-8 py-6"
          >
            Start Your Free Trial <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AssetGuard</span>
            </div>
            <div className="flex items-center gap-6 text-slate-400">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 AssetGuard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
