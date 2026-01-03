import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, DollarSign, TrendingUp, TrendingDown, FileText, Pencil, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordProtection } from "@/components/PasswordProtection";
import { SystemProtection } from "@/components/SystemProtection";
import { format } from "date-fns";

interface IncomeRecord {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  received_date: string;
  payment_method: string | null;
  reference_number: string | null;
  category?: { name: string };
}

interface ExpenseRecord {
  id: string;
  amount: number;
  vendor: string | null;
  description: string;
  expense_date: string;
  payment_method: string | null;
  receipt_number: string | null;
  category?: { name: string };
}

interface FinancialDocument {
  id: string;
  document_type: 'invoice' | 'receipt' | 'quotation';
  document_number: string;
  client_name: string;
  client_address: string | null;
  items: any[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

const FinanceAdmin = () => {
  const navigate = useNavigate();
  const [income, setIncome] = useState<IncomeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [incomeForm, setIncomeForm] = useState({
    amount: 0,
    source: "",
    description: "",
    received_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: "cash",
    reference_number: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: 0,
    vendor: "",
    description: "",
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: "cash",
    receipt_number: "",
  });

  const [documentForm, setDocumentForm] = useState({
    document_type: "invoice" as 'invoice' | 'receipt' | 'quotation',
    client_name: "",
    client_address: "",
    items: [{ description: "", quantity: 1, unit_price: 0 }],
    tax_amount: 0,
    due_date: "",
    notes: "",
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
          loadIncome(profile.school_id),
          loadExpenses(profile.school_id),
          loadDocuments(profile.school_id)
        ]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadIncome = async (sId: string) => {
    const { data, error }: any = await supabase
      .from("income_records" as any)
      .select("*")
      .eq("school_id", sId)
      .order("received_date", { ascending: false });

    if (!error) setIncome((data || []) as IncomeRecord[]);
  };

  const loadExpenses = async (sId: string) => {
    const { data, error }: any = await supabase
      .from("expense_records" as any)
      .select("*")
      .eq("school_id", sId)
      .order("expense_date", { ascending: false });

    if (!error) setExpenses((data || []) as ExpenseRecord[]);
  };

  const loadDocuments = async (sId: string) => {
    const { data, error }: any = await supabase
      .from("financial_documents" as any)
      .select("*")
      .eq("school_id", sId)
      .order("created_at", { ascending: false });

    if (!error) setDocuments((data || []) as FinancialDocument[]);
  };

  const handleSaveIncome = async () => {
    if (!schoolId || !incomeForm.source || incomeForm.amount <= 0) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("income_records" as any)
        .insert({
          school_id: schoolId,
          amount: incomeForm.amount,
          source: incomeForm.source,
          description: incomeForm.description || null,
          received_date: incomeForm.received_date,
          payment_method: incomeForm.payment_method,
          reference_number: incomeForm.reference_number || null,
        });

      if (error) throw error;
      toast.success("Income recorded");
      setShowIncomeForm(false);
      resetIncomeForm();
      await loadIncome(schoolId);
    } catch (error: any) {
      toast.error(error.message || "Failed to save income");
    }
  };

  const handleSaveExpense = async () => {
    if (!schoolId || !expenseForm.description || expenseForm.amount <= 0) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("expense_records" as any)
        .insert({
          school_id: schoolId,
          amount: expenseForm.amount,
          vendor: expenseForm.vendor || null,
          description: expenseForm.description,
          expense_date: expenseForm.expense_date,
          payment_method: expenseForm.payment_method,
          receipt_number: expenseForm.receipt_number || null,
        });

      if (error) throw error;
      toast.success("Expense recorded");
      setShowExpenseForm(false);
      resetExpenseForm();
      await loadExpenses(schoolId);
    } catch (error: any) {
      toast.error(error.message || "Failed to save expense");
    }
  };

  const handleSaveDocument = async () => {
    if (!schoolId || !documentForm.client_name) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const { data: docNum } = await supabase.rpc("generate_document_number", { 
        p_school_id: schoolId, 
        p_doc_type: documentForm.document_type 
      });

      const subtotal = documentForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const total = subtotal + documentForm.tax_amount;

      const { error } = await supabase
        .from("financial_documents" as any)
        .insert({
          school_id: schoolId,
          document_type: documentForm.document_type,
          document_number: docNum || `DOC-${Date.now()}`,
          client_name: documentForm.client_name,
          client_address: documentForm.client_address || null,
          items: documentForm.items,
          subtotal,
          tax_amount: documentForm.tax_amount,
          total_amount: total,
          due_date: documentForm.due_date || null,
          notes: documentForm.notes || null,
          status: 'draft',
        });

      if (error) throw error;
      toast.success("Document created");
      setShowDocumentForm(false);
      resetDocumentForm();
      await loadDocuments(schoolId);
    } catch (error: any) {
      toast.error(error.message || "Failed to create document");
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!confirm("Delete this income record?")) return;
    try {
      await supabase.from("income_records" as any).delete().eq("id", id);
      toast.success("Deleted");
      if (schoolId) await loadIncome(schoolId);
    } catch (error: any) {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Delete this expense record?")) return;
    try {
      await supabase.from("expense_records" as any).delete().eq("id", id);
      toast.success("Deleted");
      if (schoolId) await loadExpenses(schoolId);
    } catch (error: any) {
      toast.error("Failed to delete");
    }
  };

  const resetIncomeForm = () => {
    setIncomeForm({
      amount: 0,
      source: "",
      description: "",
      received_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: "cash",
      reference_number: "",
    });
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      amount: 0,
      vendor: "",
      description: "",
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: "cash",
      receipt_number: "",
    });
  };

  const resetDocumentForm = () => {
    setDocumentForm({
      document_type: "invoice",
      client_name: "",
      client_address: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
      tax_amount: 0,
      due_date: "",
      notes: "",
    });
  };

  const addDocumentItem = () => {
    setDocumentForm({
      ...documentForm,
      items: [...documentForm.items, { description: "", quantity: 1, unit_price: 0 }]
    });
  };

  const updateDocumentItem = (index: number, field: string, value: any) => {
    const items = [...documentForm.items];
    items[index] = { ...items[index], [field]: value };
    setDocumentForm({ ...documentForm, items });
  };

  const removeDocumentItem = (index: number) => {
    setDocumentForm({
      ...documentForm,
      items: documentForm.items.filter((_, i) => i !== index)
    });
  };

  const totalIncome = income.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, r) => sum + r.amount, 0);
  const balance = totalIncome - totalExpenses;

  return (
    <SystemProtection>
      <PasswordProtection
        requiredPassword="1111"
        title="Finance Access"
        description="Enter password to access finance"
        storageKey="finance_auth"
      >
        <div className="min-h-screen bg-background pt-16 pb-8">
          <div className="container mx-auto px-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard
            </Button>

            <h1 className="text-3xl font-bold text-primary mb-6">Financial Management</h1>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />Total Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">MK {totalIncome.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />Total Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">MK {totalExpenses.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    MK {balance.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documents.length}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="income">
              <TabsList className="mb-4">
                <TabsTrigger value="income">
                  <TrendingUp className="mr-2 h-4 w-4" />Income
                </TabsTrigger>
                <TabsTrigger value="expenses">
                  <TrendingDown className="mr-2 h-4 w-4" />Expenses
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="mr-2 h-4 w-4" />Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="income">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Income Records</CardTitle>
                      <Button onClick={() => { resetIncomeForm(); setShowIncomeForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />Add Income
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {income.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{format(new Date(record.received_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="font-medium">{record.source}</TableCell>
                            <TableCell>{record.description || "-"}</TableCell>
                            <TableCell className="capitalize">{record.payment_method}</TableCell>
                            <TableCell className="text-green-600 font-bold">MK {record.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteIncome(record.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {income.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No income records found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Expense Records</CardTitle>
                      <Button onClick={() => { resetExpenseForm(); setShowExpenseForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />Add Expense
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{format(new Date(record.expense_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="font-medium">{record.description}</TableCell>
                            <TableCell>{record.vendor || "-"}</TableCell>
                            <TableCell className="capitalize">{record.payment_method}</TableCell>
                            <TableCell className="text-red-600 font-bold">MK {record.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(record.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {expenses.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No expense records found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Financial Documents</CardTitle>
                      <Button onClick={() => { resetDocumentForm(); setShowDocumentForm(true); }}>
                        <Plus className="mr-2 h-4 w-4" />Create Document
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Number</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-mono">{doc.document_number}</TableCell>
                            <TableCell className="capitalize">{doc.document_type}</TableCell>
                            <TableCell>{doc.client_name}</TableCell>
                            <TableCell className="font-bold">MK {doc.total_amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                doc.status === 'paid' ? 'bg-green-100 text-green-800' :
                                doc.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                doc.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {doc.status}
                              </span>
                            </TableCell>
                            <TableCell>{format(new Date(doc.created_at), 'MMM d, yyyy')}</TableCell>
                          </TableRow>
                        ))}
                        {documents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No documents found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Income Form Dialog */}
            <Dialog open={showIncomeForm} onOpenChange={setShowIncomeForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Income</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Amount (MK) *</Label>
                    <Input type="number" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Source *</Label>
                    <Input value={incomeForm.source} onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })} placeholder="e.g., School Fees, Donations" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={incomeForm.received_date} onChange={(e) => setIncomeForm({ ...incomeForm, received_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={incomeForm.payment_method} onValueChange={(v) => setIncomeForm({ ...incomeForm, payment_method: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="mobile">Mobile Money</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Reference #</Label>
                    <Input value={incomeForm.reference_number} onChange={(e) => setIncomeForm({ ...incomeForm, reference_number: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowIncomeForm(false)}>Cancel</Button>
                  <Button onClick={handleSaveIncome}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Expense Form Dialog */}
            <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Amount (MK) *</Label>
                    <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Textarea value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="What was this expense for?" />
                  </div>
                  <div>
                    <Label>Vendor</Label>
                    <Input value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} placeholder="Who was paid?" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={expenseForm.payment_method} onValueChange={(v) => setExpenseForm({ ...expenseForm, payment_method: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="mobile">Mobile Money</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Receipt #</Label>
                    <Input value={expenseForm.receipt_number} onChange={(e) => setExpenseForm({ ...expenseForm, receipt_number: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowExpenseForm(false)}>Cancel</Button>
                  <Button onClick={handleSaveExpense}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Document Form Dialog */}
            <Dialog open={showDocumentForm} onOpenChange={setShowDocumentForm}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Document Type</Label>
                      <Select value={documentForm.document_type} onValueChange={(v: any) => setDocumentForm({ ...documentForm, document_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="invoice">Invoice</SelectItem>
                          <SelectItem value="receipt">Receipt</SelectItem>
                          <SelectItem value="quotation">Quotation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input type="date" value={documentForm.due_date} onChange={(e) => setDocumentForm({ ...documentForm, due_date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Client Name *</Label>
                    <Input value={documentForm.client_name} onChange={(e) => setDocumentForm({ ...documentForm, client_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Client Address</Label>
                    <Textarea value={documentForm.client_address} onChange={(e) => setDocumentForm({ ...documentForm, client_address: e.target.value })} />
                  </div>
                  
                  <div>
                    <Label>Items</Label>
                    {documentForm.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 mt-2">
                        <Input 
                          placeholder="Description" 
                          value={item.description} 
                          onChange={(e) => updateDocumentItem(idx, 'description', e.target.value)} 
                          className="flex-1"
                        />
                        <Input 
                          type="number" 
                          placeholder="Qty" 
                          value={item.quantity} 
                          onChange={(e) => updateDocumentItem(idx, 'quantity', parseInt(e.target.value) || 1)} 
                          className="w-20"
                        />
                        <Input 
                          type="number" 
                          placeholder="Price" 
                          value={item.unit_price} 
                          onChange={(e) => updateDocumentItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} 
                          className="w-28"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeDocumentItem(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addDocumentItem} className="mt-2">
                      <Plus className="mr-2 h-4 w-4" />Add Item
                    </Button>
                  </div>

                  <div>
                    <Label>Tax Amount (MK)</Label>
                    <Input type="number" value={documentForm.tax_amount} onChange={(e) => setDocumentForm({ ...documentForm, tax_amount: parseFloat(e.target.value) || 0 })} />
                  </div>

                  <div className="bg-muted p-4 rounded">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>MK {documentForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>MK {documentForm.tax_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>MK {(documentForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) + documentForm.tax_amount).toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea value={documentForm.notes} onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDocumentForm(false)}>Cancel</Button>
                  <Button onClick={handleSaveDocument}>Create Document</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </PasswordProtection>
    </SystemProtection>
  );
};

export default FinanceAdmin;
