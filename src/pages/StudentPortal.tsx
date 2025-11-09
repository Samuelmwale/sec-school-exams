import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUBJECTS, SubjectKey, CLASS_FORMS, TERMS } from "@/lib/grading";
import { exportToPDF, exportToWord } from "@/lib/exports";
import { storageHelper } from "@/lib/storage";
import { Student } from "@/types/student";
import { Download, FileText, LogOut, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  amount: number;
  installment_number: number;
  due_date: string;
  status: string;
  term: string;
  year: string;
}

const StudentPortal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [studentRecords, setStudentRecords] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check sessionStorage for student registration
      const storedRegistration = sessionStorage.getItem("student_registration");
      
      if (!storedRegistration) {
        navigate("/student-registration");
        return;
      }

      const regData = JSON.parse(storedRegistration);
      setRegistration(regData);
      setUser({ id: regData.id });

      // Get student records
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('name', regData.name)
        .eq('sex', regData.sex)
        .order('year', { ascending: false })
        .order('term', { ascending: false });

      if (students) {
        const mappedStudents = students.map(s => ({
          id: s.student_id,
          name: s.name,
          sex: s.sex as 'M' | 'F',
          classForm: s.class_form as any,
          year: s.year,
          term: s.term as any,
          marks: s.marks as any,
          grades: s.grades as any,
          total: s.total,
          rank: s.rank || 0,
          status: s.status as 'PASS' | 'FAIL',
          average: s.total / Object.keys(s.marks || {}).length || 0,
        }));
        setStudentRecords(mappedStudents);
      }

      // Get invoices and set up real-time subscription
      const loadInvoices = async () => {
        const { data: invoicesData } = await supabase
          .from('student_invoices')
          .select('*')
          .eq('registration_number', regData.registration_number)
          .order('due_date', { ascending: true });

        if (invoicesData) {
          setInvoices(invoicesData);
        }
      };

      await loadInvoices();

      // Subscribe to invoice changes for real-time updates
      const invoiceSubscription = supabase
        .channel('student-invoices-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'student_invoices',
            filter: `registration_number=eq.${regData.registration_number}`
          },
          () => {
            loadInvoices();
          }
        )
        .subscribe();

      return () => {
        invoiceSubscription.unsubscribe();
      };
    } catch (error) {
      console.error('Auth error:', error);
      toast.error("Failed to load your data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("student_registration");
    navigate("/student-registration");
  };


  const handleDownloadPDF = () => {
    const recordsToExport = getFilteredRecords();
    if (recordsToExport.length > 0) {
      const settings = storageHelper.getSettings();
      exportToPDF(recordsToExport, settings);
      toast.success("PDF downloaded successfully!");
    }
  };

  const handleDownloadWord = async () => {
    const recordsToExport = getFilteredRecords();
    if (recordsToExport.length > 0) {
      const settings = storageHelper.getSettings();
      await exportToWord(recordsToExport, settings);
      toast.success("Word document opened!");
    }
  };

  const getFilteredRecords = () => {
    let filtered = studentRecords;

    if (selectedClass && selectedClass !== "all") {
      filtered = filtered.filter(r => r.classForm === selectedClass);
    }
    if (selectedYear && selectedYear !== "all") {
      filtered = filtered.filter(r => r.year === selectedYear);
    }
    if (selectedTerm && selectedTerm !== "all") {
      filtered = filtered.filter(r => r.term === selectedTerm);
    }

    return filtered;
  };

  const totalFees = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidFees = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingFees = totalFees - paidFees;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const filteredRecords = getFilteredRecords();
  const hasUnpaidInvoices = invoices.some(inv => inv.status === 'pending' || inv.status === 'overdue');

  return (
    <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Student Portal</h1>
            <p className="text-muted-foreground">
              {registration?.name} - {registration?.registration_number}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Fee Payment Alert - Show if unpaid invoices exist */}
        {hasUnpaidInvoices && (
          <Card className="mb-6 border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Fee Payment Required - Results Access Restricted
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                You have outstanding fees that need to be cleared. Your invoice details are shown below. 
                Please contact the fees office with your registration number and invoice numbers for payment clearance.
              </p>
              <div className="space-y-2">
                {invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                    <div>
                      <p className="font-semibold">Invoice: #{invoice.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.term} {invoice.year} - Installment {invoice.installment_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">MWK {Number(invoice.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-semibold">
                  Total Outstanding: MWK {pendingFees.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fees Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {totalFees.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                MWK {paidFees.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                MWK {pendingFees.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={pendingFees === 0 ? "default" : "destructive"}>
                {pendingFees === 0 ? "Cleared" : "Outstanding"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Invoices */}
        {invoices.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Installment</TableHead>
                    <TableHead>Amount (MWK)</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.term} {invoice.year}</TableCell>
                      <TableCell>Installment {invoice.installment_number}</TableCell>
                      <TableCell>{invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === "paid"
                              ? "default"
                              : invoice.status === "overdue"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Results Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>View Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Classes" />
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
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {Array.from(new Set(studentRecords.map(r => r.year))).map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Terms" />
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

              <div className="flex gap-2 ml-auto">
                <Button onClick={handleDownloadPDF} disabled={filteredRecords.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handleDownloadWord} disabled={filteredRecords.length === 0}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download Word
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results - Block if fees not cleared */}
        {hasUnpaidInvoices ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Results Access Blocked</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Please clear your outstanding fees to access your academic results. 
                  Contact the fees office with your invoice numbers shown above.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No results found for the selected filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredRecords.map((record, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle>
                  {record.classForm} - {record.term} {record.year}
                </CardTitle>
                <div className="flex gap-4 text-sm">
                  <span>Total: <strong>{record.total}</strong></span>
                  <span>Position: <strong>{record.rank}</strong></span>
                  <span className={record.status === "PASS" ? "text-secondary font-semibold" : "text-destructive font-semibold"}>
                    Status: {record.status}
                  </span>
                </div>
              </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Mark</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Remark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(SUBJECTS).map(([key, name]) => {
                        const subjectKey = key as SubjectKey;
                        const mark = record.marks[subjectKey];
                        const grade = record.grades[subjectKey];
                        return (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{name}</TableCell>
                            <TableCell>{mark === "AB" ? "AB" : mark}</TableCell>
                            <TableCell>{grade.grade}</TableCell>
                            <TableCell>{grade.pos || "-"}</TableCell>
                            <TableCell>{grade.remark}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortal;
