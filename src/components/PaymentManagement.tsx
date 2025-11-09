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
import { DollarSign } from "lucide-react";
import { CLASS_FORMS } from "@/lib/grading";

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

export const PaymentManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchReg, setSearchReg] = useState("");

  useEffect(() => {
    loadInvoices();
  }, [selectedClass, selectedStatus]);

  const loadInvoices = async () => {
    let query = supabase
      .from("student_invoices")
      .select("*")
      .order("due_date", { ascending: true });

    if (selectedClass !== "all") {
      query = query.eq("class_form", selectedClass);
    }

    if (selectedStatus !== "all") {
      query = query.eq("status", selectedStatus);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load invoices");
      return;
    }

    setInvoices(data || []);
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    const { error: paymentError } = await supabase.from("payments").insert({
      invoice_id: invoice.id,
      registration_number: invoice.registration_number,
      amount: invoice.amount,
      payment_method: "manual",
      paid_by: "admin",
    });

    if (paymentError) {
      toast.error("Failed to record payment");
      return;
    }

    const { error: updateError } = await supabase
      .from("student_invoices")
      .update({ status: "paid" })
      .eq("id", invoice.id);

    if (updateError) {
      toast.error("Failed to update invoice");
    } else {
      toast.success("Payment recorded successfully");
      loadInvoices();
    }
  };

  const filteredInvoices = searchReg
    ? invoices.filter((inv) =>
        inv.registration_number.toLowerCase().includes(searchReg.toLowerCase())
      )
    : invoices;

  const paidCount = filteredInvoices.filter((inv) => inv.status === "paid").length;
  const unpaidCount = filteredInvoices.filter((inv) => inv.status === "pending").length;
  const totalPaid = filteredInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const totalBalance = filteredInvoices
    .filter((inv) => inv.status === "pending")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const totalAmount = totalPaid + totalBalance;
  
  // Count unique students who have paid
  const studentsPaid = new Set(
    filteredInvoices.filter((inv) => inv.status === "paid").map((inv) => inv.registration_number)
  ).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Students Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{studentsPaid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MWK {totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">MWK {totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">MWK {totalBalance.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Not Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unpaidCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Search Registration Number</Label>
              <Input
                placeholder="Search..."
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
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg Number</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Installment</TableHead>
                <TableHead>Amount (MWK)</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.registration_number}
                  </TableCell>
                  <TableCell>{invoice.class_form}</TableCell>
                  <TableCell>{invoice.term} {invoice.year}</TableCell>
                  <TableCell>{invoice.installment_number}</TableCell>
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
                  <TableCell>
                    {invoice.status === "pending" || invoice.status === "overdue" ? (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(invoice)}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Clear Payment
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Cleared</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
