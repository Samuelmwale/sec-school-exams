import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Lock, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useSchool } from "@/hooks/useSchool";
import { useNavigate } from "react-router-dom";

interface PasswordProtectionProps {
  children: React.ReactNode;
  requiredPassword: string;
  title: string;
  description: string;
  storageKey: string;
}

export const PasswordProtection = ({
  children,
  requiredPassword,
  title,
  description,
  storageKey,
}: PasswordProtectionProps) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isActive, loading: subLoading } = useSubscription();
  const { school, loading: schoolLoading } = useSchool();

  // Password must be entered on every attempt - no localStorage persistence

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check subscription before allowing access
    if (!isActive) {
      toast.error("Subscription expired. Please contact support to reactivate.");
      return;
    }
    
    if (password === requiredPassword) {
      setIsAuthenticated(true);
      toast.success("Access granted");
    } else {
      toast.error("Incorrect password");
      setPassword("");
    }
  };

  // Show loading while checking subscription
  if (subLoading || schoolLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If subscription expired, block access even if password was previously authenticated
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
              Your school subscription has expired. System features are blocked until reactivation.
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

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            <Button type="submit" className="w-full">
              Access
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
