import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { ArrowLeft, Plus, Pencil, Trash2, FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storageHelper } from "@/lib/storage";
import { Student, ClassForm, Term } from "@/types/student";
import { processStudentData, SUBJECTS, SubjectKey } from "@/lib/grading";
import { StudentForm } from "@/components/StudentForm";
import { ExcelUploader } from "@/components/ExcelUploader";
import { exportToExcel, exportToPDF, exportToWord, exportAllToZip } from "@/lib/exports";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const [isSubscriptionValid, setIsSubscriptionValid] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | undefined>();
  const [filter, setFilter] = useState({ classForm: "Form1" as ClassForm, year: "2024", term: "Term1" as Term, search: "" });
  const [uploadMode, setUploadMode] = useState<"append" | "replace">("append");

  useEffect(() => {
    // Check subscription status but load data regardless
    const settings = storageHelper.getSettings();
    const isExpired = !settings.subscriptionExpiry || Date.now() > settings.subscriptionExpiry;
    setIsSubscriptionValid(!isExpired);
    
    // Always load data, even if subscription expired
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, filter]);

  const loadStudents = () => {
    const data = storageHelper.getStudents();
    setStudents(data);
  };

  const filterStudents = () => {
    let filtered = students.filter(
      (s) => s.classForm === filter.classForm && s.year === filter.year && s.term === filter.term
    );
    if (filter.search) {
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(filter.search.toLowerCase()));
    }
    setFilteredStudents(filtered);
  };

  const handleSave = (studentData: Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">) => {
    if (!isSubscriptionValid) {
      toast.error("Subscription expired. Contact 0880425220 to reactivate.");
      return;
    }
    let updatedStudents = [...students];
    if (editStudent) {
      updatedStudents = updatedStudents.map((s) => (s.id === editStudent.id ? { ...s, ...studentData } : s));
    } else {
      updatedStudents.push({ ...studentData, id: Date.now().toString() } as Student);
    }
    const processed = processStudentData(updatedStudents);
    storageHelper.saveStudents(processed);
    setStudents(processed);
    setShowForm(false);
    setEditStudent(undefined);
    toast.success(editStudent ? "Student updated" : "Student added");
  };

  const handleDelete = (id: string) => {
    if (!isSubscriptionValid) {
      toast.error("Subscription expired. Contact 0880425220 to reactivate.");
      return;
    }
    const updated = students.filter((s) => s.id !== id);
    const processed = processStudentData(updated);
    storageHelper.saveStudents(processed);
    setStudents(processed);
    toast.success("Student deleted");
  };

  const handleUpload = (uploadedStudents: Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">[]) => {
    if (!isSubscriptionValid) {
      toast.error("Subscription expired. Contact 0880425220 to reactivate.");
      return;
    }
    let updatedStudents = uploadMode === "replace" 
      ? students.filter((s) => !(s.classForm === filter.classForm && s.year === filter.year && s.term === filter.term))
      : [...students];
    
    uploadedStudents.forEach((s) => updatedStudents.push({ ...s, id: Date.now().toString() + Math.random() } as Student));
    const processed = processStudentData(updatedStudents);
    storageHelper.saveStudents(processed);
    setStudents(processed);
  };

  const settings = storageHelper.getSettings();


  return (
    <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>

        <h1 className="text-3xl font-bold text-primary mb-6">Admin Panel</h1>

        {!isSubscriptionValid && (
          <Card className="p-4 mb-6 border-destructive">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">Subscription Expired - View Only Mode</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              You can view existing data but cannot add, edit, or delete records. Contact <strong>0880425220</strong> to reactivate.
            </p>
          </Card>
        )}

        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Class</Label>
              <Select value={filter.classForm} onValueChange={(v) => setFilter({ ...filter, classForm: v as ClassForm })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Form1">Form 1</SelectItem>
                  <SelectItem value="Form2">Form 2</SelectItem>
                  <SelectItem value="Form3">Form 3</SelectItem>
                  <SelectItem value="Form4">Form 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Input value={filter.year} onChange={(e) => setFilter({ ...filter, year: e.target.value })} />
            </div>
            <div>
              <Label>Term</Label>
              <Select value={filter.term} onValueChange={(v) => setFilter({ ...filter, term: v as Term })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term1">Term 1</SelectItem>
                  <SelectItem value="Term2">Term 2</SelectItem>
                  <SelectItem value="Term3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <Input placeholder="Search by name..." value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
            </div>
          </div>

          <ExcelUploader onUpload={handleUpload} uploadMode={uploadMode} onModeChange={setUploadMode} classForm={filter.classForm} year={filter.year} term={filter.term} disabled={!isSubscriptionValid} />
        </Card>

        <div className="flex gap-2 mb-4">
          <Button onClick={() => { setEditStudent(undefined); setShowForm(true); }} disabled={!isSubscriptionValid}>
            <Plus className="mr-2 h-4 w-4" />Add Student
          </Button>
          <Button variant="secondary" onClick={() => exportToExcel(filteredStudents, `${filter.classForm}_${filter.year}_${filter.term}.xlsx`)}>
            <FileDown className="mr-2 h-4 w-4" />Excel
          </Button>
          <Button variant="secondary" onClick={() => exportToPDF(filteredStudents, settings)}>
            <FileText className="mr-2 h-4 w-4" />PDF
          </Button>
          <Button variant="secondary" onClick={() => exportToWord(filteredStudents, settings)}>Word</Button>
          <Button variant="secondary" onClick={() => exportAllToZip(filteredStudents, settings)}>ZIP</Button>
        </div>

        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sex</TableHead>
                {Object.keys(SUBJECTS).map((k) => (
                  <TableHead key={k} colSpan={3} className="text-center border-l">
                    <div>{SUBJECTS[k as SubjectKey]}</div>
                    <div className="flex text-xs font-normal text-muted-foreground">
                      <span className="flex-1">Mrk</span>
                      <span className="flex-1">Grd</span>
                      <span className="flex-1">Pos</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-bold">{s.rank}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.sex}</TableCell>
                  {Object.keys(SUBJECTS).map((k) => {
                    const subjectKey = k as SubjectKey;
                    const mark = s.marks[subjectKey];
                    const grade = s.grades[subjectKey];
                    return (
                      <>
                        <TableCell key={`${k}-mark`} className="border-l">{mark === "AB" ? "AB" : mark}</TableCell>
                        <TableCell key={`${k}-grade`}>{grade.grade}</TableCell>
                        <TableCell key={`${k}-pos`}>{grade.pos || "-"}</TableCell>
                      </>
                    );
                  })}
                  <TableCell className="font-semibold">{s.total}</TableCell>
                  <TableCell><span className={s.status === "PASS" ? "text-secondary font-semibold" : "text-destructive"}>{s.status}</span></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditStudent(s); setShowForm(true); }} disabled={!isSubscriptionValid}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} disabled={!isSubscriptionValid}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <StudentForm open={showForm} onClose={() => { setShowForm(false); setEditStudent(undefined); }} onSave={handleSave} student={editStudent} />
      </div>
    </div>
  );
};

export default Admin;
