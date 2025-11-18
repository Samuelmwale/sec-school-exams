import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Student, ClassForm, Term, Sex, SubjectMarks } from "@/types/student";
import { SUBJECTS, roundMarks } from "@/lib/grading";
import { toast } from "sonner";
import { generateAcademicYears, getCurrentAcademicYear } from "@/lib/academic-years";

interface StudentFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">) => void;
  student?: Student;
}

export const StudentForm = ({ open, onClose, onSave, student }: StudentFormProps) => {
  const academicYears = generateAcademicYears();
  
  const [formData, setFormData] = useState({
    name: student?.name || "",
    sex: student?.sex || "M" as Sex,
    student_id: student?.student_id || "",
    classForm: student?.classForm || "Form1" as ClassForm,
    year: student?.year || getCurrentAcademicYear(),
    term: student?.term || "Term1" as Term,
    marks: student?.marks || {
      eng: "" as any, phy: "" as any, agr: "" as any, bio: "" as any,
      che: "" as any, chi: "" as any, geo: "" as any, mat: "" as any,
      soc: "" as any, his: "" as any, bk: "" as any,
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter student name");
      return;
    }

    const roundedMarks = roundMarks(formData.marks);
    onSave({ ...formData, marks: roundedMarks });
    onClose();
  };

  const handleMarkChange = (subject: keyof SubjectMarks, value: string) => {
    const marks = { ...formData.marks };
    if (value === "" || value === "AB" || value.toLowerCase() === "ab") {
      marks[subject] = "AB";
    } else {
      const num = parseFloat(value);
      marks[subject] = isNaN(num) ? "AB" : num;
    }
    setFormData({ ...formData, marks });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            Enter student details and marks. Leave empty or type "AB" for absent marks.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="name">Student Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>

          <div>
            <Label htmlFor="sex">Sex</Label>
            <Select value={formData.sex} onValueChange={(v) => setFormData({ ...formData, sex: v as Sex })}>
              <SelectTrigger id="sex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="classForm">Class</Label>
            <Select value={formData.classForm} onValueChange={(v) => setFormData({ ...formData, classForm: v as ClassForm })}>
              <SelectTrigger id="classForm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Form1">Form 1</SelectItem>
                <SelectItem value="Form2">Form 2</SelectItem>
                <SelectItem value="Form3">Form 3</SelectItem>
                <SelectItem value="Form4">Form 4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="year">Academic Year</Label>
            <Select value={formData.year} onValueChange={(v) => setFormData({ ...formData, year: v })}>
              <SelectTrigger id="year">
                <SelectValue />
              </SelectTrigger>
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
            <Label htmlFor="term">Term</Label>
            <Select value={formData.term} onValueChange={(v) => setFormData({ ...formData, term: v as Term })}>
              <SelectTrigger id="term">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term1">Term 1</SelectItem>
                <SelectItem value="Term2">Term 2</SelectItem>
                <SelectItem value="Term3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 border-t pt-4 mt-2">
            <h3 className="font-semibold mb-4">Subject Marks</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(SUBJECTS).map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="text"
                    value={formData.marks[key as keyof SubjectMarks] === "AB" ? "AB" : formData.marks[key as keyof SubjectMarks]}
                    onChange={(e) => handleMarkChange(key as keyof SubjectMarks, e.target.value)}
                    placeholder="0-100 or AB"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
