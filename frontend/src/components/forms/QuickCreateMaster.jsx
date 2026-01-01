import { useState } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * QuickCreateMaster - Minimal form for inline master data creation
 * 
 * Props:
 * - initialValue: Pre-fill the name from search query
 * - masterType: Required - type of master (device_type, brand, part_type, etc.)
 * - masterLabel: Display label for the master type (e.g., "Brand", "Device Type")
 * - onSuccess: Callback with newly created item {id, name, ...}
 * - onCancel: Callback to close the form
 * - token: Auth token
 */
export const QuickCreateMaster = ({ 
  initialValue = "", 
  masterType, 
  masterLabel = "Item",
  onSuccess, 
  onCancel, 
  token 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialValue,
    code: "",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: masterType,
        name: formData.name,
        code: formData.code || formData.name.toUpperCase().replace(/\s+/g, '_'),
        description: formData.description,
        is_active: true,
      };
      
      const response = await axios.post(
        `${API}/admin/masters/quick-create`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${masterLabel} created`);
      onSuccess?.(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to create ${masterLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="master-name">{masterLabel} Name *</Label>
        <Input
          id="master-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={`Enter ${masterLabel.toLowerCase()} name`}
          autoFocus
        />
      </div>
      
      <div>
        <Label htmlFor="master-code">Code (Optional)</Label>
        <Input
          id="master-code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="Auto-generated if empty"
          className="font-mono"
        />
      </div>
      
      <div>
        <Label htmlFor="master-description">Description (Optional)</Label>
        <Input
          id="master-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={`Brief description of this ${masterLabel.toLowerCase()}`}
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
            `Create ${masterLabel}`
          )}
        </Button>
      </div>
    </form>
  );
};

export default QuickCreateMaster;
