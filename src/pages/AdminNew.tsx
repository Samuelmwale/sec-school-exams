import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Plus, Pencil, Trash2, FileDown, FileText, Search, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Student, ClassForm, Term } from "@/types/student";
import { processStudentData, SUBJECTS, SubjectKey } from "@/lib/grading";
import { StudentForm } from "@/components/StudentForm";
import { ExcelUploader } from "@/components/ExcelUploader";
import { SubjectStatistics } from "@/components/SubjectStatistics";
import { exportToExcel, exportToPDF, exportToWord, exportAllToZip } from "@/lib/exports";
import { storageHelper } from "@/lib/storage";
import { toast } from "sonner";
import { PasswordProtection } from "@/components/PasswordProtection";

const AdminNew = () => {
  const navigate = useNavigate();
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | undefined>();
  const [filter, setFilter] = useState({ 
    classForm: "Form1" as ClassForm, 
    year: new Date().getFullYear().toString(), 
    term: "Term1" as Term, 
    search: "" 
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pasteText, setPasteText] = useState("");

  useEffect(() => {
    loadStudents();
  }, [filter.classForm, filter.year, filter.term]);

  useEffect(() => {
    filterStudents();
  }, [students, filter.search]);

  const loadStudents = async () => {
    const { data, error }: any = await (supabase as any)
      .from("students")
      .select("*")
      .eq("class_form", filter.classForm)
      .eq("year", filter.year)
      .eq("term", filter.term);

    if (error) {
      toast.error("Failed to load students");
      console.error("Load error:", error);
      return;
    }

    if (!data || data.length === 0) {
      setStudents([]);
      return;
    }

    const mappedStudents = data.map(s => ({
      id: s.id,
      student_id: s.student_id,
      name: s.name,
      sex: s.sex as 'M' | 'F',
      classForm: s.class_form as ClassForm,
      year: s.year,
      term: s.term as Term,
      marks: s.marks as any,
      grades: s.grades as any,
      total: s.total,
      rank: s.rank || 0,
      status: s.status as 'PASS' | 'FAIL',
      average: s.total / Object.keys(s.marks || {}).length || 0,
    }));

    // Reprocess to recalculate based on best 6 subjects
    const reprocessed = processStudentData(mappedStudents);
    setStudents(reprocessed);
  };

  const filterStudents = () => {
    let filtered = students;
    if (filter.search) {
      filtered = filtered.filter((s) => 
        s.name.toLowerCase().includes(filter.search.toLowerCase())
      );
    }
    setFilteredStudents(filtered);
  };

  const handleSave = async (studentData: Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">) => {
    try {
      // Ensure marks are properly formatted with AB for empty values
      const cleanedData = {
        ...studentData,
        marks: Object.fromEntries(
          Object.entries(studentData.marks).map(([key, value]) => [
            key,
            value === null || value === undefined || value === "" || value === 0 ? "AB" : value
          ])
        )
      };

      const processed = processStudentData([{ 
        ...cleanedData, 
        id: Date.now().toString(),
        student_id: ''
      } as Student]);
      const studentToSave = processed[0];

      if (editStudent) {
        const { error } = await supabase
          .from("students")
          .update({
            name: studentToSave.name,
            sex: studentToSave.sex,
            class_form: studentToSave.classForm,
            year: studentToSave.year,
            term: studentToSave.term,
            marks: studentToSave.marks as any,
            grades: studentToSave.grades as any,
            total: studentToSave.total,
            rank: studentToSave.rank,
            status: studentToSave.status,
          } as any)
          .eq("id", editStudent.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        toast.success("Student updated successfully");
      } else {
        const { error, data } = await supabase
          .from("students")
          .insert([{
            name: studentToSave.name,
            sex: studentToSave.sex,
            student_id: '',
            class_form: studentToSave.classForm,
            year: studentToSave.year,
            term: studentToSave.term,
            marks: studentToSave.marks as any,
            grades: studentToSave.grades as any,
            total: studentToSave.total,
            rank: studentToSave.rank,
            status: studentToSave.status,
          } as any])
          .select();

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        console.log("Student inserted:", data);
        toast.success("Student added successfully");
      }

      await loadStudents();
      setShowForm(false);
      setEditStudent(undefined);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save student");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      console.log("Deleting student with id:", id);
      const { error, data } = await supabase
        .from("students")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }
      
      console.log("Delete successful:", data);
      toast.success("Student deleted successfully");
      await loadStudents();
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast.error(error.message || "Failed to delete student");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error("No students selected");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} student(s)?`)) return;

    try {
      const idsArray = Array.from(selectedIds);
      console.log("Bulk deleting students:", idsArray);
      
      const { error, data } = await supabase
        .from("students")
        .delete()
        .in("id", idsArray)
        .select();

      if (error) {
        console.error("Bulk delete error:", error);
        throw error;
      }
      
      console.log("Bulk delete successful:", data);
      toast.success(`${selectedIds.size} student(s) deleted successfully`);
      setSelectedIds(new Set());
      await loadStudents();
    } catch (error: any) {
      console.error("Bulk delete failed:", error);
      toast.error(error.message || "Failed to delete students");
    }
  };

  const handleClearClass = async () => {
    if (!confirm(`Are you sure you want to delete ALL students from ${filter.classForm} ${filter.year} ${filter.term}?`)) return;

    try {
      console.log("Clearing class:", filter.classForm, filter.year, filter.term);
      
      const { error, data } = await supabase
        .from("students")
        .delete()
        .eq("class_form", filter.classForm)
        .eq("year", filter.year)
        .eq("term", filter.term)
        .select();

      if (error) {
        console.error("Clear class error:", error);
        throw error;
      }
      
      console.log("Clear class successful:", data);
      toast.success(`Class cleared successfully (${data?.length || 0} students deleted)`);
      setSelectedIds(new Set());
      await loadStudents();
    } catch (error: any) {
      console.error("Clear class failed:", error);
      toast.error(error.message || "Failed to clear class");
    }
  };

  const handlePasteFromClipboard = () => {
    setShowPasteDialog(true);
    setPasteText("");
  };

  const processPastedData = async () => {
    try {
      const lines = pasteText.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        toast.error("No data to paste");
        return;
      }

      const studentsToAdd: any[] = [];
      const subjects = Object.keys(SUBJECTS);

      for (const line of lines) {
        const cells = line.split('\t');
        if (cells.length < 2) continue;

        const name = cells[0]?.trim();
        const sex = cells[1]?.trim().toUpperCase() as 'M' | 'F';
        
        if (!name || !sex) continue;

        const marks: any = {};
        subjects.forEach((subjectKey, idx) => {
          const value = cells[2 + idx]?.trim();
          marks[subjectKey] = value === "AB" || value === "" || value === "0" || !value ? "AB" : parseFloat(value) || "AB";
        });

        studentsToAdd.push({
          name,
          sex,
          student_id: '', // Let trigger generate
          classForm: filter.classForm,
          year: filter.year,
          term: filter.term,
          marks,
        });
      }

      if (studentsToAdd.length === 0) {
        toast.error("No valid student data found");
        return;
      }

      const processed = processStudentData(studentsToAdd.map(s => ({ ...s, id: "" })) as Student[]);
      
      let successCount = 0;
      
      for (const student of processed) {
        try {
          const { error, data } = await supabase.from("students").insert([{
            name: student.name,
            sex: student.sex,
            student_id: '',
            class_form: student.classForm,
            year: student.year,
            term: student.term,
            marks: student.marks as any,
            grades: student.grades as any,
            total: student.total,
            rank: student.rank,
            status: student.status,
          } as any]).select();
          
          if (error) {
            console.error("Error pasting student:", student.name, error);
          } else {
            console.log("Student pasted successfully:", data);
            successCount++;
          }
        } catch (err: any) {
          console.error("Error pasting student:", student.name, err);
        }
      }

      toast.success(`${successCount} student(s) added successfully`);
      setShowPasteDialog(false);
      setPasteText("");
      await loadStudents();
    } catch (error: any) {
      console.error("Paste error:", error);
      toast.error(error.message || "Failed to process pasted data");
    }
  };

  const handleUpload = async (uploadedStudents: Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">[]) => {
    try {
      const processed = processStudentData(uploadedStudents.map(s => ({ ...s, id: "" })) as Student[]);

      let successCount = 0;

      for (const student of processed) {
        try {
          const { error, data } = await supabase.from("students").insert([{
            name: student.name,
            sex: student.sex,
            student_id: '',
            class_form: student.classForm,
            year: student.year,
            term: student.term,
            marks: student.marks as any,
            grades: student.grades as any,
            total: student.total,
            rank: student.rank,
            status: student.status,
          } as any]).select();
          
          if (error) {
            console.error("Error uploading student:", student.name, error);
          } else {
            console.log("Student uploaded successfully:", data);
            successCount++;
          }
        } catch (err: any) {
          console.error("Error uploading student:", student.name, err);
        }
      }

      toast.success(`${successCount} student(s) uploaded successfully`);
      await loadStudents();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload students");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const settings = storageHelper.getSettings();

  return (
    <PasswordProtection
      requiredPassword="1111"
      title="Admin Panel Access"
      description="Enter password to access admin panel"
      storageKey="admin_auth"
    >
      <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>

        <h1 className="text-3xl font-bold text-primary mb-6">Admin Panel</h1>

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
              <Input 
                placeholder="Search by name..." 
                value={filter.search} 
                onChange={(e) => setFilter({ ...filter, search: e.target.value })} 
              />
            </div>
          </div>

          <ExcelUploader 
            onUpload={handleUpload} 
            uploadMode="append" 
            onModeChange={() => {}} 
            classForm={filter.classForm} 
            year={filter.year} 
            term={filter.term} 
            disabled={false}
          />
        </Card>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={() => { setEditStudent(undefined); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Student
          </Button>
          <Button variant="secondary" onClick={handlePasteFromClipboard}>
            <Copy className="mr-2 h-4 w-4" />Paste from Clipboard
          </Button>
          <Button variant="destructive" onClick={handleBulkDelete} disabled={selectedIds.size === 0}>
            <Trash2 className="mr-2 h-4 w-4" />Delete Selected ({selectedIds.size})
          </Button>
          <Button variant="destructive" onClick={handleClearClass}>
            <X className="mr-2 h-4 w-4" />Clear Class
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

        <Card className="overflow-x-auto mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sex</TableHead>
                {Object.keys(SUBJECTS).map((k) => (
                  <TableHead key={k} colSpan={4} className="text-center border-l">
                    <div>{SUBJECTS[k as SubjectKey]}</div>
                    <div className="flex text-xs font-normal text-muted-foreground">
                      <span className="flex-1">Mrk</span>
                      <span className="flex-1">Grd</span>
                      <span className="flex-1">Pos</span>
                      <span className="flex-1">Rmk</span>
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
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.has(s.id)}
                      onCheckedChange={() => toggleSelect(s.id)}
                    />
                  </TableCell>
                  <TableCell className="font-bold">{s.rank}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.student_id || 'N/A'}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.sex}</TableCell>
                  {Object.keys(SUBJECTS).map((k) => {
                    const subjectKey = k as SubjectKey;
                    const mark = s.marks[subjectKey];
                    const grade = s.grades[subjectKey];
                    return (
                      <React.Fragment key={k}>
                        <TableCell className="border-l">{mark === "AB" ? "AB" : mark}</TableCell>
                        <TableCell>{grade.grade}</TableCell>
                        <TableCell>{grade.pos || "-"}</TableCell>
                        <TableCell className="text-xs">{grade.remark}</TableCell>
                      </React.Fragment>
                    );
                  })}
                  <TableCell className="font-semibold">{s.total}</TableCell>
                  <TableCell>
                    <span className={s.status === "PASS" ? "text-secondary font-semibold" : "text-destructive"}>
                      {s.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditStudent(s); setShowForm(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <SubjectStatistics students={filteredStudents} classForm={filter.classForm} />

        <StudentForm 
          open={showForm} 
          onClose={() => { setShowForm(false); setEditStudent(undefined); }} 
          onSave={handleSave} 
          student={editStudent} 
        />

        {showPasteDialog && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Paste Student Data</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Paste data from Excel or Word. Format: Name [TAB] Sex [TAB] {Object.values(SUBJECTS).join(' [TAB] ')}
              </p>
              <textarea
                ref={pasteAreaRef}
                className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your data here..."
              />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowPasteDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={processPastedData} className="flex-1">
                  Process Data
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
    </PasswordProtection>
  );
};

export default AdminNew;
