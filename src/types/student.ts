export type ClassForm = "Form1" | "Form2" | "Form3" | "Form4";
export type Term = "Term1" | "Term2" | "Term3";
export type Sex = "M" | "F";
export type Grade = "A" | "B" | "C" | "D" | "F" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "AB";

export interface SubjectMarks {
  eng: number | "AB"; // English
  phy: number | "AB"; // Physics
  agr: number | "AB"; // Agriculture
  bio: number | "AB"; // Biology
  che: number | "AB"; // Chemistry
  chi: number | "AB"; // Chichewa
  geo: number | "AB"; // Geography
  mat: number | "AB"; // Mathematics
  soc: number | "AB"; // Social Studies
  his: number | "AB"; // History
  bk: number | "AB";  // Bible Knowledge
}

export interface SubjectGrades {
  eng: { grade: Grade; pos: number; remark: string };
  phy: { grade: Grade; pos: number; remark: string };
  agr: { grade: Grade; pos: number; remark: string };
  bio: { grade: Grade; pos: number; remark: string };
  che: { grade: Grade; pos: number; remark: string };
  chi: { grade: Grade; pos: number; remark: string };
  geo: { grade: Grade; pos: number; remark: string };
  mat: { grade: Grade; pos: number; remark: string };
  soc: { grade: Grade; pos: number; remark: string };
  his: { grade: Grade; pos: number; remark: string };
  bk: { grade: Grade; pos: number; remark: string };
}

export interface Student {
  id: string;
  student_id?: string;
  name: string;
  sex: Sex;
  classForm: ClassForm;
  year: string;
  term: Term;
  marks: SubjectMarks;
  grades: SubjectGrades;
  total: number;
  average: number;
  rank: number;
  status: "PASS" | "FAIL";
}

export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  subscriptionDays: number;
  subscriptionExpiry: number | null;
  adminKey: string;
}

export interface FilterState {
  classForm: ClassForm | "all";
  year: string;
  term: Term | "all";
  searchQuery: string;
}
