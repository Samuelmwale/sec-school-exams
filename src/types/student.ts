export type ClassForm = "Form1" | "Form2" | "Form3" | "Form4";
export type Term = "Term1" | "Term2" | "Term3";
export type Sex = "M" | "F";
export type Grade = "A" | "B" | "C" | "D" | "F" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "AB";

// Dynamic subject marks - can hold any subject abbreviation as key
export interface SubjectMarks {
  [key: string]: number | "AB";
}

// Dynamic subject grades - can hold any subject abbreviation as key
export interface SubjectGrades {
  [key: string]: { grade: Grade; pos: number; remark: string };
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