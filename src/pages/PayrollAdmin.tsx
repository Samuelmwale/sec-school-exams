import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users, DollarSign, Calendar, FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordProtection } from "@/components/PasswordProtection";
import { SystemProtection } from "@/components/SystemProtection";
import { format } from "date-fns";

interface Employee {
  id: string;
  employee_number: string;
  name: string;
  sex: string;
  phone_number: string | null;
  email: string | null;
  employee_type: 'full_time' | 'part_time' | 'probation';
  status: 'active' | 'probation' | 'suspended' | 'dismissed';
  department: string | null;
  position: string | null;
  date_hired: string;
  monthly_salary: number;
  bank_name: string | null;
  bank_account: string | null;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  bonus: number;
  deductions: number;
  gratuity: number;
  net_salary: number;
  status: 'pending' | 'approved' | 'paid';
  paid_at: string | null;
  employee?: Employee;
}

const PayrollAdmin = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    sex: "M",
    phone_number: "",
    email: "",
    employee_type: "full_time" as 'full_time' | 'part_time' | 'probation',
    status: "active" as 'active' | 'probation' | 'suspended' | 'dismissed',
    department: "",
    position: "",
    date_hired: format(new Date(), 'yyyy-MM-dd'),
    monthly_salary: 0,
    bank_name: "",
    bank_account: "",
  });

  const [payrollForm, setPayrollForm] = useState({
    employee_id: "",
    pay_period_start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    pay_period_end: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
    bonus: 0,
    deductions: 0,
    gratuity: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (profile?.school_id) {
        setSchoolId(profile.school_id);
        await Promise.all([
          loadEmployees(profile.school_id),
          loadPayroll(profile.school_id)
        ]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async (sId: string) => {
    const { data, error }: any = await supabase
      .from("employees" as any)
      .select("*")
      .eq("school_id", sId)
      .order("name");

    if (error) {
      console.error("Error loading employees:", error);
      return;
    }
    setEmployees((data || []) as Employee[]);
  };

  const loadPayroll = async (sId: string) => {
    const { data, error }: any = await supabase
      .from("payroll" as any)
      .select("*, employee:employees(*)")
      .eq("school_id", sId)
      .order("pay_period_end", { ascending: false });

    if (error) {
      console.error("Error loading payroll:", error);
      return;
    }
    setPayrollRecords((data || []) as PayrollRecord[]);
  };

  const handleSaveEmployee = async () => {
    if (!schoolId || !employeeForm.name) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (editEmployee) {
        const { error } = await supabase
          .from("employees" as any)
          .update({
            name: employeeForm.name,
            sex: employeeForm.sex,
            phone_number: employeeForm.phone_number || null,
            email: employeeForm.email || null,
            employee_type: employeeForm.employee_type,
            status: employeeForm.status,
            department: employeeForm.department || null,
            position: employeeForm.position || null,
            date_hired: employeeForm.date_hired,
            monthly_salary: employeeForm.monthly_salary,
            bank_name: employeeForm.bank_name || null,
            bank_account: employeeForm.bank_account || null,
          })
          .eq("id", editEmployee.id);

        if (error) throw error;
        toast.success("Employee updated successfully");
      } else {
        // Generate employee number
        const { data: empNum } = await supabase.rpc("generate_employee_number", { p_school_id: schoolId });

        const { error } = await supabase
          .from("employees" as any)
          .insert({
            school_id: schoolId,
            employee_number: empNum || `EMP-${Date.now()}`,
            name: employeeForm.name,
            sex: employeeForm.sex,
            phone_number: employeeForm.phone_number || null,
            email: employeeForm.email || null,
            employee_type: employeeForm.employee_type,
            status: employeeForm.status,
            department: employeeForm.department || null,
            position: employeeForm.position || null,
            date_hired: employeeForm.date_hired,
            monthly_salary: employeeForm.monthly_salary,
            bank_name: employeeForm.bank_name || null,
            bank_account: employeeForm.bank_account || null,
          });

        if (error) throw error;
        toast.success("Employee added successfully");
      }

      setShowEmployeeForm(false);
      setEditEmployee(null);
      resetEmployeeForm();
      await loadEmployees(schoolId);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save employee");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      const { error } = await supabase
        .from("employees" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Employee deleted");
      if (schoolId) await loadEmployees(schoolId);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete employee");
    }
  };

  const handleGeneratePayroll = async () => {
    if (!schoolId || !payrollForm.employee_id) {
      toast.error("Please select an employee");
      return;
    }

    try {
      const employee = employees.find(e => e.id === payrollForm.employee_id);
      if (!employee) return;

      const { error } = await supabase
        .from("payroll" as any)
        .insert({
          school_id: schoolId,
          employee_id: payrollForm.employee_id,
          pay_period_start: payrollForm.pay_period_start,
          pay_period_end: payrollForm.pay_period_end,
          basic_salary: employee.monthly_salary,
          bonus: payrollForm.bonus,
          deductions: payrollForm.deductions,
          gratuity: payrollForm.gratuity,
          status: "pending",
        });

      if (error) throw error;
      toast.success("Payroll record created");
      setShowPayrollForm(false);
      resetPayrollForm();
      await loadPayroll(schoolId);
    } catch (error: any) {
      toast.error(error.message || "Failed to create payroll");
    }
  };

  const handlePayrollStatusChange = async (id: string, status: 'pending' | 'approved' | 'paid') => {
    try {
      const updates: any = { status };
      if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("payroll" as any)
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      toast.success(`Payroll marked as ${status}`);
      if (schoolId) await loadPayroll(schoolId);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: "",
      sex: "M",
      phone_number: "",
      email: "",
      employee_type: "full_time",
      status: "active",
      department: "",
      position: "",
      date_hired: format(new Date(), 'yyyy-MM-dd'),
      monthly_salary: 0,
      bank_name: "",
      bank_account: "",
    });
  };

  const resetPayrollForm = () => {
    setPayrollForm({
      employee_id: "",
      pay_period_start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
      pay_period_end: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
      bonus: 0,
      deductions: 0,
      gratuity: 0,
    });
  };

  const openEditEmployee = (emp: Employee) => {
    setEditEmployee(emp);
    setEmployeeForm({
      name: emp.name,
      sex: emp.sex,
      phone_number: emp.phone_number || "",
      email: emp.email || "",
      employee_type: emp.employee_type,
      status: emp.status,
      department: emp.department || "",
      position: emp.position || "",
      date_hired: emp.date_hired,
      monthly_salary: emp.monthly_salary,
      bank_name: emp.bank_name || "",
      bank_account: emp.bank_account || "",
    });
    setShowEmployeeForm(true);
  };

  const totalPayroll = payrollRecords.filter(p => p.status === 'pending' || p.status === 'approved').reduce((sum, p) => sum + (p.net_salary || 0), 0);
  const activeEmployees = employees.filter(e => e.status === 'active').length;

  return (
    <SystemProtection>
      <PasswordProtection
        requiredPassword="1111"
        title="Payroll Access"
        description="Enter password to access payroll"
        storageKey="payroll_auth"
      >
        <div className="min-h-screen bg-background pt-16 pb-8">
          <div className="container mx-auto px-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard
            </Button>

            <h1 className="text-3xl font-bold text-primary mb-6">Payroll Management</h1>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employees.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pending Payroll</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {payrollRecords.filter(p => p.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Due</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    MK {totalPayroll.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="employees">
              <TabsList className="mb-4">
                <TabsTrigger value="employees">
                  <Users className="mr-2 h-4 w-4" />Employees
                </TabsTrigger>
                <TabsTrigger value="payroll">
                  <DollarSign className="mr-2 h-4 w-4" />Payroll
                </TabsTrigger>
              </TabsList>

              <TabsContent value="employees">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Employees</CardTitle>
                      <Button onClick={() => { resetEmployeeForm(); setEditEmployee(null); setShowEmployeeForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />Add Employee
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Salary</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-mono">{emp.employee_number}</TableCell>
                            <TableCell>{emp.name}</TableCell>
                            <TableCell>{emp.position || "-"}</TableCell>
                            <TableCell className="capitalize">{emp.employee_type.replace("_", " ")}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                emp.status === 'active' ? 'bg-green-100 text-green-800' :
                                emp.status === 'probation' ? 'bg-yellow-100 text-yellow-800' :
                                emp.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {emp.status}
                              </span>
                            </TableCell>
                            <TableCell>MK {emp.monthly_salary.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openEditEmployee(emp)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteEmployee(emp.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {employees.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              No employees found. Add your first employee.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payroll">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Payroll Records</CardTitle>
                      <Button onClick={() => { resetPayrollForm(); setShowPayrollForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />Generate Payroll
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Basic</TableHead>
                          <TableHead>Bonus</TableHead>
                          <TableHead>Deductions</TableHead>
                          <TableHead>Net Pay</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{(record.employee as any)?.name || "-"}</TableCell>
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
                              <Select value={record.status} onValueChange={(v) => handlePayrollStatusChange(record.id, v as any)}>
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                        {payrollRecords.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                              No payroll records. Generate payroll for employees.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Employee Form Dialog */}
            <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Sex</Label>
                    <Select value={employeeForm.sex} onValueChange={(v) => setEmployeeForm({ ...employeeForm, sex: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={employeeForm.phone_number} onChange={(e) => setEmployeeForm({ ...employeeForm, phone_number: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Employee Type</Label>
                    <Select value={employeeForm.employee_type} onValueChange={(v: any) => setEmployeeForm({ ...employeeForm, employee_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full-time</SelectItem>
                        <SelectItem value="part_time">Part-time</SelectItem>
                        <SelectItem value="probation">Probation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={employeeForm.status} onValueChange={(v: any) => setEmployeeForm({ ...employeeForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="probation">Probation</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input value={employeeForm.department} onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })} />
                  </div>
                  <div>
                    <Label>Position</Label>
                    <Input value={employeeForm.position} onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })} />
                  </div>
                  <div>
                    <Label>Date Hired</Label>
                    <Input type="date" value={employeeForm.date_hired} onChange={(e) => setEmployeeForm({ ...employeeForm, date_hired: e.target.value })} />
                  </div>
                  <div>
                    <Label>Monthly Salary (MK)</Label>
                    <Input type="number" value={employeeForm.monthly_salary} onChange={(e) => setEmployeeForm({ ...employeeForm, monthly_salary: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Bank Name</Label>
                    <Input value={employeeForm.bank_name} onChange={(e) => setEmployeeForm({ ...employeeForm, bank_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Bank Account</Label>
                    <Input value={employeeForm.bank_account} onChange={(e) => setEmployeeForm({ ...employeeForm, bank_account: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEmployeeForm(false)}>Cancel</Button>
                  <Button onClick={handleSaveEmployee}>Save Employee</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Payroll Form Dialog */}
            <Dialog open={showPayrollForm} onOpenChange={setShowPayrollForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Payroll</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Employee *</Label>
                    <Select value={payrollForm.employee_id} onValueChange={(v) => setPayrollForm({ ...payrollForm, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees.filter(e => e.status === 'active').map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} - MK {emp.monthly_salary.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Period Start</Label>
                      <Input type="date" value={payrollForm.pay_period_start} onChange={(e) => setPayrollForm({ ...payrollForm, pay_period_start: e.target.value })} />
                    </div>
                    <div>
                      <Label>Period End</Label>
                      <Input type="date" value={payrollForm.pay_period_end} onChange={(e) => setPayrollForm({ ...payrollForm, pay_period_end: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Bonus (MK)</Label>
                    <Input type="number" value={payrollForm.bonus} onChange={(e) => setPayrollForm({ ...payrollForm, bonus: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Deductions (MK)</Label>
                    <Input type="number" value={payrollForm.deductions} onChange={(e) => setPayrollForm({ ...payrollForm, deductions: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Gratuity (MK)</Label>
                    <Input type="number" value={payrollForm.gratuity} onChange={(e) => setPayrollForm({ ...payrollForm, gratuity: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPayrollForm(false)}>Cancel</Button>
                  <Button onClick={handleGeneratePayroll}>Generate</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </PasswordProtection>
    </SystemProtection>
  );
};

export default PayrollAdmin;
