import { useNavigate } from "react-router-dom";
import { BarChart3, Users, FileText, Settings as SettingsIcon, AlertCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { SchoolHeader } from "@/components/SchoolHeader";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [studentCount, setStudentCount] = useState(0);
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [passedMale, setPassedMale] = useState(0);
  const [passedFemale, setPassedFemale] = useState(0);
  const [failedMale, setFailedMale] = useState(0);
  const [failedFemale, setFailedFemale] = useState(0);
  const { isActive, expiryDate, loading: subscriptionLoading } = useSubscription();
  const [school, setSchool] = useState<any>(null);
  const [junior, setJunior] = useState({ total: 0, male: 0, female: 0, passedMale: 0, passedFemale: 0, failedMale: 0, failedFemale: 0 });
  const [senior, setSenior] = useState({ total: 0, male: 0, female: 0, passedMale: 0, passedFemale: 0, failedMale: 0, failedFemale: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's school
      const { data: profile } = await supabase
        .from("profiles" as any)
        .select("school_id")
        .eq("id", user.id)
        .single() as any;

      if (profile?.school_id) {
        const { data: schoolData } = await supabase
          .from("schools" as any)
          .select("*")
          .eq("id", profile.school_id)
          .single() as any;

        setSchool(schoolData);

        // Repair missing school_id on existing student records (one-time fix)
        await supabase
          .from('students' as any)
          .update({ school_id: profile.school_id })
          .is('school_id', null);

        // Get all students for this school
        const { data: students } = await supabase
          .from('students' as any)
          .select('sex, status, class_form')
          .eq('school_id', profile.school_id) as any;

        if (students) {
          setStudentCount(students.length);
          
          const males = students.filter((s: any) => s.sex === 'M');
          const females = students.filter((s: any) => s.sex === 'F');
          setMaleCount(males.length);
          setFemaleCount(females.length);
          
          setPassedMale(males.filter((s: any) => s.status === 'PASS').length);
          setPassedFemale(females.filter((s: any) => s.status === 'PASS').length);
          setFailedMale(males.filter((s: any) => s.status === 'FAIL').length);
          setFailedFemale(females.filter((s: any) => s.status === 'FAIL').length);

          const juniors = students.filter((s: any) => s.class_form === 'Form1' || s.class_form === 'Form2');
          const seniors = students.filter((s: any) => s.class_form === 'Form3' || s.class_form === 'Form4');

          const calc = (arr: any[]) => {
            const m = arr.filter((s: any) => s.sex === 'M');
            const f = arr.filter((s: any) => s.sex === 'F');
            return {
              total: arr.length,
              male: m.length,
              female: f.length,
              passedMale: m.filter((s: any) => s.status === 'PASS').length,
              passedFemale: f.filter((s: any) => s.status === 'PASS').length,
              failedMale: m.filter((s: any) => s.status === 'FAIL').length,
              failedFemale: f.filter((s: any) => s.status === 'FAIL').length,
            }
          }

          setJunior(calc(juniors));
          setSenior(calc(seniors));
        }
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SchoolHeader />
      <div className="container mx-auto px-4 py-8">
        {!subscriptionLoading && !isActive && (
          <Alert className="mb-6 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive font-semibold">
              Your school subscription has expired. You can view existing data but cannot add, edit, or delete records. 
              Contact support to reactivate.
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
              <p className="text-xs text-muted-foreground">
                Male: {maleCount} | Female: {femaleCount}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed Students</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {passedMale + passedFemale}
              </div>
              <p className="text-xs text-muted-foreground">
                Male: {passedMale} | Female: {passedFemale}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Students</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {failedMale + failedFemale}
              </div>
              <p className="text-xs text-muted-foreground">
                Male: {failedMale} | Female: {failedFemale}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${!isActive ? "text-destructive" : "text-secondary"}`}>
                {isActive ? "Active" : "Expired"}
              </div>
              <p className="text-xs text-muted-foreground">Status</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Junior Section (Form 1-2)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-primary">Total: {junior.total}</div>
              <p className="text-xs text-muted-foreground">Male: {junior.male} | Female: {junior.female}</p>
              <p className="text-xs text-muted-foreground mt-2">Passed - Male: {junior.passedMale} | Female: {junior.passedFemale}</p>
              <p className="text-xs text-muted-foreground">Failed - Male: {junior.failedMale} | Female: {junior.failedFemale}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Senior Section (Form 3-4)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-secondary">Total: {senior.total}</div>
              <p className="text-xs text-muted-foreground">Male: {senior.male} | Female: {senior.female}</p>
              <p className="text-xs text-muted-foreground mt-2">Passed - Male: {senior.passedMale} | Female: {senior.passedFemale}</p>
              <p className="text-xs text-muted-foreground">Failed - Male: {senior.failedMale} | Female: {senior.failedFemale}</p>
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
              <Button className="w-full" disabled={!isActive}>
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
              <Button className="w-full" disabled={!isActive}>
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
                Students can login and view their results
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
