import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchool } from "@/hooks/useSchool";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AlertCircle, School, Key, Phone, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemProtectionProps {
  children: ReactNode;
}

export const SystemProtection = ({ children }: SystemProtectionProps) => {
  const navigate = useNavigate();
  const { school, loading: schoolLoading, refetch } = useSchool();
  const { isActive, loading: subLoading, refetch: refetchSub } = useSubscription();
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [licenseCode, setLicenseCode] = useState("");
  const [activating, setActivating] = useState(false);

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
        setShowLicenseDialog(false);
        // Reload to update subscription status
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

  if (schoolLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no school registered, redirect to school registration
  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <School className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">School Registration Required</CardTitle>
            <CardDescription>
              Please register your school to access the system features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate("/school-registration")} className="w-full">
              Register School
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If subscription inactive, show blocked message with license activation
  if (!isActive) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border-destructive">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Subscription Expired</CardTitle>
              <CardDescription>
                Your school subscription has expired. System features are blocked until reactivation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Contact Mr Mwale for Reactivation:
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-semibold">0991656504</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-semibold">0880425220</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Send your school name and preferred subscription package to receive a license code.
                </p>
              </div>
              <Button onClick={() => setShowLicenseDialog(true)} className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Enter License Code
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* License Activation Dialog */}
        <Dialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activate License Code</DialogTitle>
              <DialogDescription>
                Enter the license code you received from Mr Mwale to reactivate your subscription.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="license">License Code</Label>
                <Input
                  id="license"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                  className="font-mono text-center text-lg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLicenseDialog(false)}>
                Cancel
              </Button>
              <Button onClick={activateLicense} disabled={activating}>
                {activating ? "Activating..." : "Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};
