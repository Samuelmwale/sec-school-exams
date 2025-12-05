import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeesManagement } from "@/components/FeesManagement";
import { PaymentManagement } from "@/components/PaymentManagement";
import { AnnouncementManagement } from "@/components/AnnouncementManagement";
import { PasswordProtection } from "@/components/PasswordProtection";
import { SystemProtection } from "@/components/SystemProtection";

const FeesAdmin = () => {
  const navigate = useNavigate();

  return (
    <SystemProtection>
      <PasswordProtection
        requiredPassword="1122"
        title="Fees Management Access"
        description="Enter password to access fees management"
        storageKey="fees_admin_auth"
      >
        <div className="min-h-screen bg-background pt-16 pb-8">
          <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-primary mb-6">Fees Management</h1>

          <Tabs defaultValue="fees" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="fees">School Fees</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
            </TabsList>

            <TabsContent value="fees" className="mt-6">
              <FeesManagement />
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <PaymentManagement />
            </TabsContent>

            <TabsContent value="announcements" className="mt-6">
              <AnnouncementManagement />
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </PasswordProtection>
    </SystemProtection>
  );
};

export default FeesAdmin;
