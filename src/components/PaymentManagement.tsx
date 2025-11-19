import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";
import { CLASS_FORMS, TERMS } from "@/lib/grading";
import { generateAcademicYears, getCurrentAcademicYear } from "@/lib/academic-years";

interface StudentRegistration {
  id: string;
  registration_number: string;
  name: string;
  class_form: string;
  year: string;
}

interface Invoice {
  id: string;
  registration_number: string;
  class_form: string;
  year: string;
  term: string;
  amount: number;
  installment_number: number;
  due_date: string;
  status: string;
}

interface StudentPaymentStatus {
  registration: StudentRegistration;
  invoices: Invoice[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  hasPendingPayments: boolean;
}

export const PaymentManagement = () => {
  const [students, setStudents] = useState<StudentPaymentStatus[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentAcademicYear());
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [searchReg, setSearchReg] = useState("");
  const [loading, setLoading] = useState(false);

  const academicYears = generateAcademicYears();

  useEffect(() => {
    loadStudentsWithPayments();
  }, [selectedClass, selectedYear, selectedTerm]);

  const loadStudentsWithPayments = async () => {
    setLoading(true);
    try {
      // Load all registered students
      let studentQuery = supabase
        .from("student_registrations")
        .select("*")
        .order("class_form")
        .order("registration_number");

      if (selectedClass !== "all") {
        studentQuery = studentQuery.eq("class_form", selectedClass);
      }
      if (selectedYear !== "all") {
        studentQuery = studentQuery.eq("year", selectedYear);
      }

      const { data: registrations, error: regError } = await studentQuery;

      if (regError) {
        toast.error("Failed to load students");
        setLoading(false);
        return;
      }

      // Load all invoices
      let invoiceQuery = supabase
        .from("student_invoices")
        .select("*");

      if (selectedYear !== "all") {
        invoiceQuery = invoiceQuery.eq("year", selectedYear);
      }
      if (selectedTerm !== "all") {
        invoiceQuery = invoiceQuery.eq("term", selectedTerm);
      }

      const { data: invoices, error: invError } = await invoiceQuery;

      if (invError) {
        toast.error("Failed to load invoices");
        setLoading(false);
        return;
      }

      // Combine students with their invoices
      const studentsWithPayments: StudentPaymentStatus[] = (registrations || []).map((reg: any) => {
        const studentInvoices = (invoices || []).filter(
          (inv: any) => inv.registration_number === reg.registration_number
        );

        const totalAmount = studentInvoices.reduce((sum, inv: any) => sum + inv.amount, 0);
        const paidAmount = studentInvoices
          .filter((inv: any) => inv.status === "paid")
          .reduce((sum, inv: any) => sum + inv.amount, 0);
        const pendingAmount = totalAmount - paidAmount;
        const hasPendingPayments = studentInvoices.some(
          (inv: any) => inv.status === "pending" || inv.status === "overdue"
        );

        return {
          registration: reg,
          invoices: studentInvoices,
          totalAmount,
          paidAmount,
          pendingAmount,
          hasPendingPayments,
        };
      });

      setStudents(studentsWithPayments);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllPayments = async (student: StudentPaymentStatus) => {
    const pendingInvoices = student.invoices.filter(
      (inv) => inv.status === "pending" || inv.status === "overdue"
    );

    if (pendingInvoices.length === 0) {
      toast.error("No pending payments to clear");
      return;
    }

    try {
      // Create payment records
      for (const invoice of pendingInvoices) {
        await supabase.from("payments").insert({
          invoice_id: invoice.id,
          registration_number: invoice.registration_number,
          amount: invoice.amount,
          payment_method: "manual",
          paid_by: "admin",
        });

        // Update invoice status
        await supabase
          .from("student_invoices")
          .update({
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice.id);
      }

      toast.success(
        `✓ All payments cleared for ${student.registration.name}. Student notified in portal.`
      );
      loadStudentsWithPayments();
    } catch (error) {
      console.error("Error clearing payments:", error);
      toast.error("Failed to clear payments");
    }
  };

  const filteredStudents = searchReg
    ? students.filter((s) =>
        s.registration.registration_number.toLowerCase().includes(searchReg.toLowerCase()) ||
        s.registration.name.toLowerCase().includes(searchReg.toLowerCase())
      )
    : students;

  const totalStudents = filteredStudents.length;
  const studentsPaid = filteredStudents.filter((s) => !s.hasPendingPayments && s.totalAmount > 0).length;
  const studentsUnpaid = filteredStudents.filter((s) => s.hasPendingPayments).length;
  const studentsNoInvoices = filteredStudents.filter((s) => s.invoices.length === 0).length;
  const totalPaid = filteredStudents.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalPending = filteredStudents.reduce((sum, s) => sum + s.pendingAmount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fully Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{studentsPaid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">With Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{studentsUnpaid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">No Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{studentsNoInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              MWK {totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              MWK {totalPending.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Payment Status - All Registered Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Search Student</Label>
              <Input
                placeholder="Search by name or registration number..."
                value={searchReg}
                onChange={(e) => setSearchReg(e.target.value)}
              />
            </div>

            <div>
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {CLASS_FORMS.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Total (MWK)</TableHead>
                <TableHead>Paid (MWK)</TableHead>
                <TableHead>Pending (MWK)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.registration.id}>
                    <TableCell className="font-medium">
                      {student.registration.registration_number}
                    </TableCell>
                    <TableCell>{student.registration.name}</TableCell>
                    <TableCell>{student.registration.class_form}</TableCell>
                    <TableCell>{student.registration.year}</TableCell>
                    <TableCell>{student.invoices.length}</TableCell>
                    <TableCell>{student.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">
                      {student.paidAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {student.pendingAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {student.invoices.length === 0 ? (
                        <Badge variant="secondary">No Invoices</Badge>
                      ) : !student.hasPendingPayments && student.totalAmount > 0 ? (
                        <Badge variant="default">Fully Paid</Badge>
                      ) : (
                        <Badge variant="destructive">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.hasPendingPayments ? (
                        <Button
                          size="sm"
                          onClick={() => handleClearAllPayments(student)}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Clear All
                        </Button>
                      ) : student.invoices.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Create fees first
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          ✓ Cleared
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
