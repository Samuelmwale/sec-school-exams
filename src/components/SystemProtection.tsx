import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSchool } from "@/hooks/useSchool";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, School, CreditCard } from "lucide-react";

interface SystemProtectionProps {
  children: ReactNode;
}

export const SystemProtection = ({ children }: SystemProtectionProps) => {
  const navigate = useNavigate();
  const { school, loading: schoolLoading } = useSchool();
  const { isActive, loading: subLoading } = useSubscription();

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
          <CardContent>
            <Button onClick={() => navigate("/school-registration")} className="w-full">
              Register School
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If subscription inactive, show blocked message
  if (!isActive) {
    return (
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
              Your school subscription has expired. Please contact support to reactivate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <p className="font-semibold">Contact Information</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Phone: <span className="font-semibold">0880425220</span>
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/settings")} className="w-full">
              Go to Settings
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};
