import { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * QuickCreateCompany - Minimal form for inline company creation
 * 
 * Props:
 * - initialValue: Pre-fill the company name from search query
 * - onSuccess: Callback with newly created company {id, name, ...}
 * - onCancel: Callback to close the form
 * - token: Auth token
 */
export const QuickCreateCompany = ({ initialValue = "", onSuccess, onCancel, token }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialValue,
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    gst_number: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact_name || !formData.contact_email || !formData.contact_phone) {
      toast.error("Please fill required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/admin/companies/quick-create`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Company created");
      onSuccess?.(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="company-name">Company Name *</Label>
        <Input
          id="company-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Acme Corporation"
          autoFocus
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="contact-name">Contact Name *</Label>
          <Input
            id="contact-name"
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone *</Label>
          <Input
            id="contact-phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="contact-email">Email *</Label>
        <Input
          id="contact-email"
          type="email"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          placeholder="contact@company.com"
        />
      </div>
      
      <div>
        <Label htmlFor="gst-number">GST Number (Optional)</Label>
        <Input
          id="gst-number"
          value={formData.gst_number}
          onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
          placeholder="29ABCDE1234F1Z5"
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#0F62FE] hover:bg-[#0043CE]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Company"
          )}
        </Button>
      </div>
    </form>
  );
};

export default QuickCreateCompany;
