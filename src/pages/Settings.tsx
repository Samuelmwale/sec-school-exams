import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Key, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordProtection } from "@/components/PasswordProtection";

const Settings = () => {
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [licenseCode, setLicenseCode] = useState("");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (!profile?.school_id) {
        toast.error("No school associated with your account");
        navigate("/school-registration");
        return;
      }

      // Get school details
      const { data: schoolData, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", profile.school_id)
        .single();

      if (error) throw error;
      setSchool(schoolData);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!school) return;

      const { error } = await supabase
        .from("schools")
        .update({
          school_name: school.school_name,
          center_number: school.center_number,
          division_name: school.division_name,
          zone_name: school.zone_name,
          district_name: school.district_name,
          address: school.address,
        })
        .eq("id", school.id);

      if (error) throw error;

      toast.success("School information saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const activateLicense = async () => {
    if (!licenseCode.trim()) {
      toast.error("Please enter a license code");
      return;
    }

    if (!school?.id) {
      toast.error("School not found");
      return;
    }

    setActivating(true);
    try {
      const { data, error } = await supabase
        .rpc("activate_license" as any, {
          p_code: licenseCode.trim().toUpperCase(),
          p_school_id: school.id,
        });

      if (error) throw error;

      if (data) {
        toast.success("License activated successfully! Your subscription has been renewed.");
        setLicenseCode("");
        fetchSettings();
        // Reload the page to update subscription status everywhere
        window.location.reload();
      } else {
        toast.error("Invalid or already used license code");
      }
    } catch (error) {
      console.error("Error activating license:", error);
      toast.error("Failed to activate license code");
    } finally {
      setActivating(false);
    }
  };

  const isExpired = school?.subscription_expiry 
    ? new Date(school.subscription_expiry) < new Date() 
    : true;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <PasswordProtection
      requiredPassword="2233"
      title="Settings Access"
      description="Enter password to access settings"
      storageKey="settings_auth"
    >
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-8">Admin Settings</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>Update your school's basic information displayed throughout the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input
                    id="schoolName"
                    value={school?.school_name || ""}
                    onChange={(e) => setSchool({ ...school, school_name: e.target.value })}
                    placeholder="Enter school name"
                  />
                </div>
                <div>
                  <Label htmlFor="centerNumber">Center Number</Label>
                  <Input
                    id="centerNumber"
                    value={school?.center_number || ""}
                    onChange={(e) => setSchool({ ...school, center_number: e.target.value })}
                    placeholder="Enter center number"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="divisionName">Division</Label>
                  <Input
                    id="divisionName"
                    value={school?.division_name || ""}
                    onChange={(e) => setSchool({ ...school, division_name: e.target.value })}
                    placeholder="Enter division"
                  />
                </div>
                <div>
                  <Label htmlFor="zoneName">Zone</Label>
                  <Input
                    id="zoneName"
                    value={school?.zone_name || ""}
                    onChange={(e) => setSchool({ ...school, zone_name: e.target.value })}
                    placeholder="Enter zone"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="districtName">District</Label>
                  <Input
                    id="districtName"
                    value={school?.district_name || ""}
                    onChange={(e) => setSchool({ ...school, district_name: e.target.value })}
                    placeholder="Enter district"
                  />
                </div>
                <div>
                  <Label htmlFor="address">School Address</Label>
                  <Input
                    id="address"
                    value={school?.address || ""}
                    onChange={(e) => setSchool({ ...school, address: e.target.value })}
                    placeholder="Enter school address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription>
                {school?.subscription_expiry 
                  ? isExpired 
                    ? `Expired on: ${new Date(school.subscription_expiry).toLocaleDateString()}`
                    : `Active until: ${new Date(school.subscription_expiry).toLocaleDateString()}`
                  : "No active subscription"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* License Code Activation */}
              <div className="space-y-3">
                <Label>Activate License Code</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter license code (e.g., XXXX-XXXX-XXXX-XXXX)"
                    value={licenseCode}
                    onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  <Button onClick={activateLicense} disabled={activating}>
                    {activating ? (
                      "Activating..."
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 bg-muted rounded-lg mt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Need a License Code?
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Contact Mr Mwale for subscription activation or renewal:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-semibold">0991656504</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-semibold">0880425220</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Send your school name and preferred subscription package to receive a license code.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
        </div>
      </div>
    </PasswordProtection>
  );
};

export default Settings;
