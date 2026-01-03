import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Calendar, DollarSign, BookOpen, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths } from "date-fns";

interface TeacherData {
  id: string;
  employee_number: string;
  name: string;
  position: string | null;
  status: string;
  date_hired: string;
  monthly_salary: number;
}

interface WorklogEntry {
  id: string;
  work_date: string;
  subject_name: string;
  class_form: string;
  periods_taught: number;
}

interface PayrollEntry {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  bonus: number;
  deductions: number;
  net_salary: number;
  status: string;
  paid_at: string | null;
}

const TeacherPortal = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [worklog, setWorklog] = useState<WorklogEntry[]>([]);
  const [payroll, setPayroll] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  // Check for stored session
  useEffect(() => {
    const storedTeacher = sessionStorage.getItem("teacher_session");
    if (storedTeacher) {
      const data = JSON.parse(storedTeacher);
      setTeacher(data);
      setIsLoggedIn(true);
      loadTeacherData(data.id);
    }
  }, []);

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      // Check teacher credentials
      const { data: credentials, error }: any = await supabase
        .from("teacher_credentials" as any)
        .select("*")
        .eq("username", loginForm.username)
        .maybeSingle();

      if (error || !credentials) {
        toast.error("Invalid username or password");
        setLoading(false);
        return;
      }

      // Simple password check (in production, use proper hashing)
      if (credentials.password_hash !== loginForm.password) {
        toast.error("Invalid username or password");
        setLoading(false);
        return;
      }

      // Get employee data
      const { data: employeeData }: any = await supabase
        .from("employees" as any)
        .select("*")
        .eq("id", credentials.employee_id)
        .single();

      if (!employeeData) {
        toast.error("Employee record not found");
        setLoading(false);
        return;
      }

      setTeacher(employeeData as TeacherData);
      setIsLoggedIn(true);
      sessionStorage.setItem("teacher_session", JSON.stringify(employeeData));

      // Update last login
      await supabase
        .from("teacher_credentials" as any)
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", credentials.id);

      await loadTeacherData(employeeData.id);
      toast.success(`Welcome, ${employeeData.name}!`);
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherData = async (employeeId: string) => {
    try {
      // Load worklog
      const { data: worklogData }: any = await supabase
        .from("teacher_worklog" as any)
        .select("*")
        .eq("employee_id", employeeId)
        .order("work_date", { ascending: false });

      setWorklog((worklogData || []) as WorklogEntry[]);

      // Load payroll
      const { data: payrollData }: any = await supabase
        .from("payroll" as any)
        .select("*")
        .eq("employee_id", employeeId)
        .order("pay_period_end", { ascending: false });

      setPayroll((payrollData || []) as PayrollEntry[]);
    } catch (error) {
      console.error("Error loading teacher data:", error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("teacher_session");
    setIsLoggedIn(false);
    setTeacher(null);
    setWorklog([]);
    setPayroll([]);
    setLoginForm({ username: "", password: "" });
    toast.success("Logged out successfully");
  };

  // Calculate period stats
  const now = new Date();
  const todayPeriods = worklog
    .filter(w => w.work_date === format(now, 'yyyy-MM-dd'))
    .reduce((sum, w) => sum + w.periods_taught, 0);

  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const weekPeriods = worklog
    .filter(w => {
      const date = new Date(w.work_date);
      return date >= weekStart && date <= weekEnd;
    })
    .reduce((sum, w) => sum + w.periods_taught, 0);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthPeriods = worklog
    .filter(w => {
      const date = new Date(w.work_date);
      return date >= monthStart && date <= monthEnd;
    })
    .reduce((sum, w) => sum + w.periods_taught, 0);

  const threeMonthsStart = startOfMonth(subMonths(now, 2));
  const threeMonthPeriods = worklog
    .filter(w => {
      const date = new Date(w.work_date);
      return date >= threeMonthsStart && date <= monthEnd;
    })
    .reduce((sum, w) => sum + w.periods_taught, 0);

  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  const yearPeriods = worklog
    .filter(w => {
      const date = new Date(w.work_date);
      return date >= yearStart && date <= yearEnd;
    })
    .reduce((sum, w) => sum + w.periods_taught, 0);

  const totalEarnings = payroll.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.net_salary, 0);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <User className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Teacher Portal</CardTitle>
            <CardDescription>Login to view your periods and salary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input 
                  value={loginForm.username} 
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input 
                  type="password"
                  value={loginForm.password} 
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Teacher Portal</h1>
            <p className="text-muted-foreground">Welcome, {teacher?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />Logout
          </Button>
        </div>

        {/* Teacher Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground">Employee #</Label>
                <p className="font-mono font-medium">{teacher?.employee_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Position</Label>
                <p className="font-medium">{teacher?.position || "Teacher"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <span className={`px-2 py-1 rounded text-xs ${
                  teacher?.status === 'active' ? 'bg-green-100 text-green-800' :
                  teacher?.status === 'probation' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {teacher?.status}
                </span>
              </div>
              <div>
                <Label className="text-muted-foreground">Date Hired</Label>
                <p className="font-medium">{teacher?.date_hired ? format(new Date(teacher.date_hired), 'MMM d, yyyy') : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayPeriods} periods</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{weekPeriods} periods</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{monthPeriods} periods</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">3 Months</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{threeMonthPeriods} periods</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">This Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{yearPeriods} periods</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="worklog">
          <TabsList className="mb-4">
            <TabsTrigger value="worklog">
              <BookOpen className="mr-2 h-4 w-4" />Periods Taught
            </TabsTrigger>
            <TabsTrigger value="salary">
              <DollarSign className="mr-2 h-4 w-4" />Salary History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="worklog">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Log</CardTitle>
                <CardDescription>Your recorded teaching periods</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Periods</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {worklog.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.work_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{entry.subject_name}</TableCell>
                        <TableCell>{entry.class_form}</TableCell>
                        <TableCell className="font-bold">{entry.periods_taught}</TableCell>
                      </TableRow>
                    ))}
                    {worklog.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No teaching records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Salary History</CardTitle>
                    <CardDescription>Your payment records</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold text-green-600">MK {totalEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Basic</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payroll.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(new Date(record.pay_period_start), 'MMM d')} - {format(new Date(record.pay_period_end), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>MK {record.basic_salary.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">+{record.bonus.toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">-{record.deductions.toLocaleString()}</TableCell>
                        <TableCell className="font-bold">MK {record.net_salary.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            record.status === 'paid' ? 'bg-green-100 text-green-800' :
                            record.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.paid_at ? format(new Date(record.paid_at), 'MMM d, yyyy') : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {payroll.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No salary records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherPortal;
