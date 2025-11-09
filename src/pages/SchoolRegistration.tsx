import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

const SchoolRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: "",
    centerNumber: "",
    divisionName: "",
    zoneName: "",
    districtName: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to register a school");
        navigate("/auth");
        return;
      }

      // Create school
      const { data: school, error: schoolError } = await supabase
        .from("schools" as any)
        .insert([{
          school_name: formData.schoolName,
          center_number: formData.centerNumber,
          division_name: formData.divisionName,
          zone_name: formData.zoneName,
          district_name: formData.districtName,
          address: formData.address,
          is_active: true,
          subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
        }])
        .select()
        .single() as any;

      if (schoolError) throw schoolError;

      // Update user profile with school_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ school_id: school.id } as any)
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Create admin role for this user
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([{
          user_id: user.id,
          role: "admin",
        }]);

      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }

      toast.success("School registered successfully! You get a 30-day free trial.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("This center number is already registered");
      } else {
        toast.error(error.message || "Failed to register school");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">School Registration</h1>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Register your school to start using the system. You'll get a 30-day free trial.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schoolName">School Name *</Label>
              <Input
                id="schoolName"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="Enter school name"
              />
            </div>
            <div>
              <Label htmlFor="centerNumber">Center Number *</Label>
              <Input
                id="centerNumber"
                required
                value={formData.centerNumber}
                onChange={(e) => setFormData({ ...formData, centerNumber: e.target.value })}
                placeholder="Enter center number"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="divisionName">Division Name *</Label>
              <Input
                id="divisionName"
                required
                value={formData.divisionName}
                onChange={(e) => setFormData({ ...formData, divisionName: e.target.value })}
                placeholder="Enter division"
              />
            </div>
            <div>
              <Label htmlFor="zoneName">Zone Name *</Label>
              <Input
                id="zoneName"
                required
                value={formData.zoneName}
                onChange={(e) => setFormData({ ...formData, zoneName: e.target.value })}
                placeholder="Enter zone"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="districtName">District Name *</Label>
            <Input
              id="districtName"
              required
              value={formData.districtName}
              onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
              placeholder="Enter district"
            />
          </div>

          <div>
            <Label htmlFor="address">School Address *</Label>
            <Input
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter complete address"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate("/")} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Registering..." : "Register School"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SchoolRegistration;
