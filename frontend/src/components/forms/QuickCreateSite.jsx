import { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * QuickCreateSite - Minimal form for inline site creation
 * 
 * Props:
 * - initialValue: Pre-fill the site name from search query
 * - companyId: Required - which company this site belongs to
 * - onSuccess: Callback with newly created site {id, name, ...}
 * - onCancel: Callback to close the form
 * - token: Auth token
 */
export const QuickCreateSite = ({ initialValue = "", companyId, onSuccess, onCancel, token }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialValue,
    site_type: "office",
    city: "",
    address: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Site name is required");
      return;
    }
    
    if (!companyId) {
      toast.error("Please select a company first");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/admin/sites/quick-create`,
        { ...formData, company_id: companyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Site created");
      onSuccess?.(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create site");
    } finally {
      setLoading(false);
    }
  };

  const siteTypes = [
    { value: "office", label: "Office" },
    { value: "warehouse", label: "Warehouse" },
    { value: "site_project", label: "Site/Project" },
    { value: "branch", label: "Branch" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="site-name">Site Name *</Label>
        <Input
          id="site-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Head Office - Mumbai"
          autoFocus
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="site-type">Site Type</Label>
          <select
            id="site-type"
            value={formData.site_type}
            onChange={(e) => setFormData({ ...formData, site_type: e.target.value })}
            className="form-select w-full"
          >
            {siteTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Mumbai"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="address">Address (Optional)</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Business Park, Andheri East"
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
            "Create Site"
          )}
        </Button>
      </div>
    </form>
  );
};

export default QuickCreateSite;
