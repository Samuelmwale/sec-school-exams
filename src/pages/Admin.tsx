import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, FileDown, FileText, LogOut, LogIn, RefreshCw } from "lucide-react";
import { SystemProtection } from "@/components/SystemProtection";
import { PasswordProtection } from "@/components/PasswordProtection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storageHelper } from "@/lib/storage";
import { Student, ClassForm, Term } from "@/types/student";
import { processStudentData } from "@/lib/grading";
import { StudentForm } from "@/components/StudentForm";
import { ExcelUploader } from "@/components/ExcelUploader";
import { SubjectColumnHeader, AddSubjectButton } from "@/components/SubjectColumnHeader";
import { useSchoolSubjects } from "@/hooks/useSchoolSubjects";
import { exportToExcel, exportToPDF, exportToWord, exportAllToZip } from "@/lib/exports";
import { toast } from "sonner";
import { generateAcademicYears, getCurrentAcademicYear } from "@/lib/academic-years";
import { supabase } from "@/integrations/supabase/client";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { dbSync } from "@/lib/db-sync";

const Admin = () => {
  const navigate = useNavigate();
  const academicYears = generateAcademicYears();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | undefined>();
  const [filter, setFilter] = useState({ classForm: "Form1" as ClassForm, year: getCurrentAcademicYear(), term: "Term1" as Term, search: "" });
  const [uploadMode, setUploadMode] = useState<"append" | "replace">("append");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const {
    activeSubjects,
    addSubject,
    updateSubject,
    toggleSubject,
    deleteSubject,
    reorderSubjects,
    loading: subjectsLoading,
    reload: reloadSubjects,
  } = useSchoolSubjects();

  const handleLogout = async () => {
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("fees_admin_auth");
    localStorage.removeItem("viewer_auth");
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Idle timeout - auto logout after 10 minutes
  useIdleTimeout(() => {
    if (localStorage.getItem("admin_auth") === "true") {
      toast.info("Session expired due to inactivity");
      handleLogout();
    }
  }, 10);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) reloadSubjects();
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => reloadSubjects(), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [filter.classForm, filter.year, filter.term, user]);

  useEffect(() => {
    filterStudents();
  }, [students, filter.search]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Load from database (filtered by school via dbSync)
      const dbStudents = await dbSync.getStudents(filter.classForm, filter.year, filter.term);
      
      if (dbStudents.length > 0) {
        // Process to calculate ranks and positions
        const processed = processStudentData(dbStudents);
        setStudents(processed);
      } else {
        // Fallback to localStorage for offline support
        const localStudents = storageHelper.getStudents().filter(
          s => s.classForm === filter.classForm && s.year === filter.year && s.term === filter.term
        );
        setStudents(processStudentData(localStudents));
      }
    } catch (error) {
      console.error("Error loading students:", error);
      // Fallback to localStorage
      const localStudents = storageHelper.getStudents().filter(
        s => s.classForm === filter.classForm && s.year === filter.year && s.term === filter.term
      );
      setStudents(processStudentData(localStudents));
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    if (filter.search) {
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(filter.search.toLowerCase()));
    }
    setFilteredStudents(filtered);
  };

  const handleSave = async (studentData: Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">) => {
    try {
      // Generate student_id if not provided
      let studentId = (studentData as any).student_id || editStudent?.student_id;
      if (!studentId) {
        // Generate: YEAR-XXXX format
        const existingStudents = await dbSync.getStudents(studentData.classForm, studentData.year, studentData.term);
        const maxNum = existingStudents
          .map(s => {
            const match = s.student_id?.match(/-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .reduce((max, n) => Math.max(max, n), 0);
        studentId = `${studentData.year}-${String(maxNum + 1).padStart(4, "0")}`;
      }

      // Create full student object
      const newStudent: Student = {
        ...studentData,
        id: editStudent?.id || Date.now().toString(),
        student_id: studentId,
        grades: {} as any,
        total: 0,
        average: 0,
        rank: 0,
        status: "FAIL",
      };

      // Get all students for this class/year/term for proper ranking
      let allStudents = await dbSync.getStudents(studentData.classForm, studentData.year, studentData.term);
      
      if (editStudent) {
        // Update existing student
        allStudents = allStudents.map(s => s.id === editStudent.id ? newStudent : s);
      } else {
        // Add new student
        allStudents.push(newStudent);
      }

      // Process all students to recalculate ranks
      const processed = processStudentData(allStudents);
      
      // Find the processed version of our student
      const processedStudent = processed.find(s => s.id === newStudent.id);
      
      if (processedStudent) {
        // Save to database
        await dbSync.saveStudent(processedStudent);
        
        // Also save to localStorage for offline support
        const localStudents = storageHelper.getStudents();
        const updatedLocal = editStudent 
          ? localStudents.map(s => s.id === editStudent.id ? processedStudent : s)
          : [...localStudents, processedStudent];
        storageHelper.saveStudents(updatedLocal);

        toast.success(editStudent ? "Student updated successfully" : `Student added successfully with ID: ${studentId}`);
      } else {
        toast.error("Failed to process student data");
      }

      setShowForm(false);
      setEditStudent(undefined);
      
      // Reload to refresh rankings
      await loadStudents();
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error(error.message || "Failed to save student");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const studentToDelete = students.find(s => s.id === id);
      if (studentToDelete) {
        await dbSync.deleteStudent(id, studentToDelete.classForm, studentToDelete.year, studentToDelete.term);
      }
      
      // Also remove from localStorage
      const localStudents = storageHelper.getStudents().filter(s => s.id !== id);
      storageHelper.saveStudents(localStudents);
      
      toast.success("Student deleted");
      await loadStudents();
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast.error(error.message || "Failed to delete student");
    }
  };

  const handleUpload = async (uploadedStudents: Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">[]) => {
    try {
      setLoading(true);
      
      // If replace mode, clear existing students for this class/year/term
      if (uploadMode === "replace") {
        await dbSync.clearClass(filter.classForm, filter.year, filter.term);
      }

      // Get existing students (after potential clear)
      let allStudents = await dbSync.getStudents(filter.classForm, filter.year, filter.term);
      
      // Add new students
      const newStudents = uploadedStudents.map((s, index) => ({
        ...s,
        id: Date.now().toString() + "_" + index,
        grades: {} as any,
        total: 0,
        average: 0,
        rank: 0,
        status: "FAIL" as const,
      }));

      allStudents = [...allStudents, ...newStudents];

      // Process all for rankings
      const processed = processStudentData(allStudents);

      // Save all to database
      for (const student of processed) {
        await dbSync.saveStudent(student);
      }

      // Also update localStorage
      const localStudents = storageHelper.getStudents();
      const filteredLocal = uploadMode === "replace" 
        ? localStudents.filter(s => !(s.classForm === filter.classForm && s.year === filter.year && s.term === filter.term))
        : localStudents;
      storageHelper.saveStudents([...filteredLocal, ...processed]);

      toast.success(`${uploadedStudents.length} students uploaded successfully`);
      await loadStudents();
    } catch (error: any) {
      console.error("Error uploading students:", error);
      toast.error(error.message || "Failed to upload students");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveSubject = async (index: number, direction: "up" | "down") => {
    const newOrder = [...activeSubjects];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    await reorderSubjects(newOrder);
    toast.success("Subject order updated");
  };

  const settings = storageHelper.getSettings();

  // Get subjects for exports
  const exportSubjects = activeSubjects.map(s => ({ abbreviation: s.abbreviation, name: s.name }));

  return (
    <SystemProtection>
      <PasswordProtection
        requiredPassword="1111"
        title="Admin Panel Access"
        description="Enter password to access admin panel"
        storageKey="admin_auth"
      >
        <div className="min-h-screen bg-background pt-16 pb-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadStudents} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {user ? (
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                )}
              </div>
            </div>

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
                  <Label>Academic Year</Label>
                  <Select value={filter.year} onValueChange={(v) => setFilter({ ...filter, year: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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

              <ExcelUploader onUpload={handleUpload} uploadMode={uploadMode} onModeChange={setUploadMode} classForm={filter.classForm} year={filter.year} term={filter.term} disabled={loading} />
            </Card>

            <div className="flex flex-wrap gap-2 mb-4">
              <Button onClick={() => { setEditStudent(undefined); setShowForm(true); }} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />Add Student
              </Button>
              <AddSubjectButton onAdd={addSubject} />
              <Button variant="secondary" onClick={() => exportToExcel(filteredStudents, `${filter.classForm}_${filter.year}_${filter.term}.xlsx`, exportSubjects)}>
                <FileDown className="mr-2 h-4 w-4" />Excel
              </Button>
              <Button variant="secondary" onClick={() => exportToPDF(filteredStudents, settings, exportSubjects)}>
                <FileText className="mr-2 h-4 w-4" />PDF
              </Button>
              <Button variant="secondary" onClick={() => exportToWord(filteredStudents, settings, exportSubjects)}>Word</Button>
              <Button variant="secondary" onClick={() => exportAllToZip(filteredStudents, settings, exportSubjects)}>ZIP</Button>
            </div>

            {loading ? (
              <Card className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p>Loading students...</p>
              </Card>
            ) : (
              <Card className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Sex</TableHead>
                      {activeSubjects.map((subject, index) => (
                        <TableHead key={subject.id} colSpan={3} className="text-center border-l">
                          <SubjectColumnHeader
                            subject={subject}
                            onUpdate={updateSubject}
                            onToggle={toggleSubject}
                            onDelete={deleteSubject}
                            onMoveUp={() => handleMoveSubject(index, "up")}
                            onMoveDown={() => handleMoveSubject(index, "down")}
                            canMoveUp={index > 0}
                            canMoveDown={index < activeSubjects.length - 1}
                          />
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
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={activeSubjects.length * 3 + 6} className="text-center py-8 text-muted-foreground">
                          No students found. Add students manually or upload via Excel.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-bold">{s.rank}</TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.sex}</TableCell>
                          {activeSubjects.map((subject) => {
                            const subjectKey = subject.abbreviation;
                            const mark = s.marks[subjectKey as keyof typeof s.marks];
                            const grade = s.grades[subjectKey as keyof typeof s.grades];
                            return (
                              <React.Fragment key={subject.id}>
                                <TableCell className="border-l">{mark === "AB" ? "AB" : mark ?? "-"}</TableCell>
                                <TableCell>{grade?.grade ?? "-"}</TableCell>
                                <TableCell>{grade?.pos || "-"}</TableCell>
                              </React.Fragment>
                            );
                          })}
                          <TableCell className="font-semibold">{s.total}</TableCell>
                          <TableCell><span className={s.status === "PASS" ? "text-secondary font-semibold" : "text-destructive"}>{s.status}</span></TableCell>
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}

            <StudentForm open={showForm} onClose={() => { setShowForm(false); setEditStudent(undefined); }} onSave={handleSave} student={editStudent} />
          </div>
        </div>
      </PasswordProtection>
    </SystemProtection>
  );
};

export default Admin;