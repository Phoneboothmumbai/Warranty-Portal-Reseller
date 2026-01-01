import { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * QuickCreateUser - Minimal form for inline user creation
 * 
 * Props:
 * - initialValue: Pre-fill the user name from search query
 * - companyId: Required - which company this user belongs to
 * - onSuccess: Callback with newly created user {id, name, ...}
 * - onCancel: Callback to close the form
 * - token: Auth token
 */
export const QuickCreateUser = ({ initialValue = "", companyId, onSuccess, onCancel, token }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialValue,
    email: "",
    phone: "",
    department: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }
    
    if (!companyId) {
      toast.error("Please select a company first");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/admin/users/quick-create`,
        { ...formData, company_id: companyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User created");
      onSuccess?.(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="user-name">Full Name *</Label>
        <Input
          id="user-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Doe"
          autoFocus
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="user-email">Email *</Label>
          <Input
            id="user-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@company.com"
          />
        </div>
        <div>
          <Label htmlFor="user-phone">Phone</Label>
          <Input
            id="user-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="department">Department (Optional)</Label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          placeholder="IT, Finance, HR, etc."
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
            "Create User"
          )}
        </Button>
      </div>
    </form>
  );
};

export default QuickCreateUser;
