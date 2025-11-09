import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordProtection } from "@/components/PasswordProtection";

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    id: "",
    schoolName: "",
    schoolAddress: "",
    subscriptionDays: 30,
    subscriptionExpiry: null as number | null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          schoolName: data.school_name,
          schoolAddress: data.school_address,
          subscriptionDays: data.subscription_days,
          subscriptionExpiry: data.subscription_expiry,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("school_settings")
        .update({
          school_name: settings.schoolName,
          school_address: settings.schoolAddress,
          subscription_days: settings.subscriptionDays,
          subscription_expiry: settings.subscriptionExpiry,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleSubscriptionChange = (days: string) => {
    const numDays = parseInt(days);
    const newExpiry = Date.now() + numDays * 24 * 60 * 60 * 1000;
    setSettings({ ...settings, subscriptionDays: numDays, subscriptionExpiry: newExpiry });
  };

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
          onClick={() => navigate("/")}
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
              <CardDescription>Update your school's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={settings.schoolName}
                  onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                  placeholder="Enter school name"
                />
              </div>
              <div>
                <Label htmlFor="schoolAddress">School Address</Label>
                <Input
                  id="schoolAddress"
                  value={settings.schoolAddress}
                  onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })}
                  placeholder="Enter school address"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>Configure subscription period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subscriptionPeriod">Subscription Period</Label>
                <Select
                  value={settings.subscriptionDays.toString()}
                  onValueChange={handleSubscriptionChange}
                >
                  <SelectTrigger id="subscriptionPeriod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="365">365 Days (1 Year)</SelectItem>
                    <SelectItem value="36500">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                For subscription or reactivation, contact: 0880425220
              </p>
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
