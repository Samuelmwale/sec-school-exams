import { useNavigate } from "react-router-dom";
import { BarChart3, Users, FileText, Settings as SettingsIcon, AlertCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { storageHelper } from "@/lib/storage";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(storageHelper.getSettings());
  const [studentCount, setStudentCount] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const students = storageHelper.getStudents();
    setStudentCount(students.length);

    const settings = storageHelper.getSettings();
    const expired = settings.subscriptionExpiry ? Date.now() > settings.subscriptionExpiry : true;
    setIsExpired(expired);
  }, []);

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-primary mb-2">{settings.schoolName}</h1>
          <p className="text-muted-foreground">{settings.schoolAddress}</p>
          <div className="mt-4 inline-block bg-primary/10 rounded-lg px-6 py-3">
            <p className="text-lg font-semibold text-primary">Results Management System</p>
          </div>
        </div>

        {isExpired && (
          <Alert className="mb-6 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive font-semibold">
              Your subscription has expired. You can view existing data but cannot add, edit, or delete records. 
              Contact <strong>0880425220</strong> to reactivate.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{studentCount}</div>
              <p className="text-xs text-muted-foreground">Registered in system</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isExpired ? "text-destructive" : "text-secondary"}`}>
                {isExpired ? "Expired" : "Active"}
              </div>
              <p className="text-xs text-muted-foreground">Subscription status</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all hover-scale cursor-pointer" onClick={() => navigate("/admin")}>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Admin Panel</CardTitle>
              <CardDescription>
                Manage students, upload data, and view results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Go to Admin Panel
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all hover-scale cursor-pointer" onClick={() => navigate("/viewer")}>
            <CardHeader>
              <FileText className="h-12 w-12 text-secondary mb-4" />
              <CardTitle>Results Viewer</CardTitle>
              <CardDescription>
                View class results and student reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                View Results
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all hover-scale cursor-pointer" onClick={() => navigate("/fees-admin")}>
            <CardHeader>
              <DollarSign className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Fees Management</CardTitle>
              <CardDescription>
                Manage school fees, invoices, and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Manage Fees
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all hover-scale cursor-pointer" onClick={() => navigate("/settings")}>
            <CardHeader>
              <SettingsIcon className="h-12 w-12 text-accent mb-4" />
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure school details and subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Open Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all hover-scale cursor-pointer" onClick={() => navigate("/student-registration")}>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Student Portal</CardTitle>
              <CardDescription>
                Students can register and view their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Student Access
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
