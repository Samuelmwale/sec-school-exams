import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { CLASS_FORMS, TERMS } from "@/lib/grading";

interface SchoolFee {
  id: string;
  class_form: string;
  year: string;
  term: string;
  total_amount: number;
  installments: number;
}

export const FeesManagement = () => {
  const [fees, setFees] = useState<SchoolFee[]>([]);
  const [classForm, setClassForm] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState("");
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState("2");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    const { data, error } = await supabase
      .from("school_fees")
      .select("*")
      .order("year", { ascending: false })
      .order("term");

    if (error) {
      toast.error("Failed to load fees");
      return;
    }

    setFees(data || []);
  };

  const handleAddFee = async () => {
    if (!classForm || !year || !term || !amount) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("school_fees").insert({
      class_form: classForm,
      year,
      term,
      total_amount: parseFloat(amount),
      installments: parseInt(installments),
    });

    if (error) {
      toast.error("Failed to add fee: " + error.message);
    } else {
      toast.success("Fee added and invoices created!");
      setClassForm("");
      setAmount("");
      loadFees();
    }
    setLoading(false);
  };

  const handleDeleteFee = async (id: string) => {
    const { error } = await supabase.from("school_fees").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete fee");
    } else {
      toast.success("Fee deleted");
      loadFees();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add School Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Class</Label>
              <Select value={classForm} onValueChange={setClassForm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
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
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
              />
            </div>

            <div>
              <Label>Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Total Amount (MWK)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150000"
              />
            </div>

            <div>
              <Label>Installments</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleAddFee} disabled={loading} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Fee
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>School Fees List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Total Amount (MWK)</TableHead>
                <TableHead>Installments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.class_form}</TableCell>
                  <TableCell>{fee.year}</TableCell>
                  <TableCell>{fee.term}</TableCell>
                  <TableCell>{fee.total_amount.toLocaleString()}</TableCell>
                  <TableCell>{fee.installments}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFee(fee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
