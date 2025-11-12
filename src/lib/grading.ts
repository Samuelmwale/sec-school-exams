import { Student, SubjectMarks, SubjectGrades, Grade, ClassForm, Term } from "@/types/student";

export const CLASS_FORMS = ["Form1", "Form2", "Form3", "Form4"] as const;
export const TERMS = ["Term1", "Term2", "Term3"] as const;

export const SUBJECTS = {
  eng: "English",
  phy: "Physics",
  agr: "Agriculture",
  bio: "Biology",
  che: "Chemistry",
  chi: "Chichewa",
  geo: "Geography",
  mat: "Mathematics",
  soc: "Social Studies",
  his: "History",
  bk: "Bible Knowledge",
} as const;

export type SubjectKey = keyof typeof SUBJECTS;

const PASS_MARK = 40;

// Forms 1-2 grading (A=90-100, B=80-89, C=60-79, D=40-59, F=0-39)
const gradeForm12 = (mark: number | "AB"): { grade: Grade; remark: string } => {
  if (mark === "AB") return { grade: "AB" as Grade, remark: "Absent" };
  if (mark >= 90) return { grade: "A", remark: "Excellent" };
  if (mark >= 80) return { grade: "B", remark: "Very good" };
  if (mark >= 60) return { grade: "C", remark: "Good" };
  if (mark >= 40) return { grade: "D", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
};

// Forms 3-4 grading
const gradeForm34 = (mark: number | "AB"): { grade: Grade; remark: string } => {
  if (mark === "AB") return { grade: "AB" as Grade, remark: "Absent" };
  if (mark >= 85) return { grade: "1", remark: "Distinction" };
  if (mark >= 75) return { grade: "2", remark: "Distinction" };
  if (mark >= 70) return { grade: "3", remark: "Strong Credit" };
  if (mark >= 60) return { grade: "4", remark: "Credit" };
  if (mark >= 55) return { grade: "5", remark: "Credit" };
  if (mark >= 50) return { grade: "6", remark: "Credit" };
  if (mark >= 45) return { grade: "7", remark: "Pass" };
  if (mark >= 40) return { grade: "8", remark: "Pass" };
  return { grade: "9", remark: "Fail" };
};

export const calculateGrades = (
  marks: SubjectMarks,
  classForm: ClassForm
): SubjectGrades => {
  const isForm12 = classForm === "Form1" || classForm === "Form2";
  const gradeFunc = isForm12 ? gradeForm12 : gradeForm34;

  const grades: any = {};
  Object.keys(SUBJECTS).forEach((subject) => {
    const subjectKey = subject as SubjectKey;
    const mark = marks[subjectKey];
    const { grade, remark } = gradeFunc(mark);
    grades[subjectKey] = { grade, pos: 0, remark };
  });

  return grades as SubjectGrades;
};

export const calculateTotal = (marks: SubjectMarks): number => {
  // Get all valid numeric marks
  const validMarks = Object.entries(marks)
    .filter(([_, mark]) => mark !== "AB" && typeof mark === "number")
    .map(([subject, mark]) => ({ subject, mark: mark as number }))
    .sort((a, b) => b.mark - a.mark); // Sort descending by mark
  
  // Check if English is in the valid marks
  const englishEntry = validMarks.find(entry => entry.subject === "eng");
  
  if (englishEntry) {
    // English is compulsory, include it + best 5 others (excluding English)
    const othersExcludingEnglish = validMarks.filter(entry => entry.subject !== "eng");
    const best5Others = othersExcludingEnglish.slice(0, 5);
    return englishEntry.mark + best5Others.reduce((sum, entry) => sum + entry.mark, 0);
  } else {
    // If English is absent, take best 6 from remaining subjects
    const best6 = validMarks.slice(0, 6);
    return best6.reduce((sum, entry) => sum + entry.mark, 0);
  }
};

export const calculateBest6PassCount = (marks: SubjectMarks): number => {
  const validMarks = Object.entries(marks)
    .filter(([_, mark]) => mark !== "AB" && typeof mark === "number")
    .map(([subject, mark]) => ({ subject, mark: mark as number }))
    .sort((a, b) => b.mark - a.mark);

  const englishEntry = validMarks.find(entry => entry.subject === "eng");

  let selected: { subject: string; mark: number }[] = [];
  if (englishEntry) {
    const others = validMarks.filter(entry => entry.subject !== "eng");
    selected = [englishEntry, ...others.slice(0, 5)];
  } else {
    selected = validMarks.slice(0, 6);
  }

  return selected.filter(entry => entry.mark >= PASS_MARK).length;
};

export const calculateAverage = (marks: SubjectMarks): number => {
  const values = Object.values(marks).filter((m) => m !== "AB");
  if (values.length === 0) return 0;
  const total = values.reduce((sum, m) => sum + (typeof m === "number" ? m : 0), 0);
  return Math.round(total / values.length);
};

export const determineStatus = (marks: SubjectMarks): "PASS" | "FAIL" => {
  let passedCount = 0;
  let englishPassed = false;

  Object.entries(marks).forEach(([subject, mark]) => {
    if (mark !== "AB" && typeof mark === "number" && mark >= PASS_MARK) {
      passedCount++;
      if (subject === "eng") englishPassed = true;
    }
  });

  return passedCount >= 6 && englishPassed ? "PASS" : "FAIL";
};

export const calculateRanks = (students: Student[]): Student[] => {
  // Recalculate totals and pass metrics for all students
  const studentsWithMetrics = students.map(s => ({
    ...s,
    total: calculateTotal(s.marks),
    _passCount: calculateBest6PassCount(s.marks),
    _englishPassed: (typeof s.marks.eng === 'number') && s.marks.eng >= PASS_MARK,
  }));
  
  // Sort: English passed first, then by pass count (best 6 incl. English), then by total
  const sorted = [...studentsWithMetrics].sort((a, b) => {
    if (a._englishPassed !== b._englishPassed) return Number(b._englishPassed) - Number(a._englishPassed);
    if (a._passCount !== b._passCount) return b._passCount - a._passCount;
    return b.total - a.total;
  });

  // Dense ranking based on the same metrics
  let currentRank = 1;
  let prev = { _englishPassed: undefined as any, _passCount: -1, total: -1 };

  sorted.forEach((student, index) => {
    if (student._englishPassed !== prev._englishPassed || student._passCount !== prev._passCount || student.total !== prev.total) {
      currentRank = index + 1;
      prev = { _englishPassed: student._englishPassed, _passCount: student._passCount, total: student.total };
    }
    student.rank = currentRank;
    // Clean up temporary fields if necessary
    delete (student as any)._passCount;
    delete (student as any)._englishPassed;
  });

  return sorted as Student[];
};

export const calculateSubjectPositions = (students: Student[]): Student[] => {
  const subjects = Object.keys(SUBJECTS) as SubjectKey[];

  subjects.forEach((subject) => {
    // Get all students with valid marks for this subject
    const withMarks = students
      .map((s, idx) => ({
        student: s,
        mark: s.marks[subject],
        originalIndex: idx,
      }))
      .filter((item) => item.mark !== "AB")
      .sort((a, b) => {
        const markA = typeof a.mark === "number" ? a.mark : 0;
        const markB = typeof b.mark === "number" ? b.mark : 0;
        return markB - markA;
      });

    // Assign positions
    let currentPos = 1;
    let previousMark = -1;

    withMarks.forEach((item, index) => {
      const mark = typeof item.mark === "number" ? item.mark : 0;
      if (mark !== previousMark) {
        currentPos = index + 1;
        previousMark = mark;
      }
      item.student.grades[subject].pos = currentPos;
    });

    // Set position to 0 for absent students
    students.forEach((s) => {
      if (s.marks[subject] === "AB") {
        s.grades[subject].pos = 0;
      }
    });
  });

  return students;
};

export const processStudentData = (students: Student[]): Student[] => {
  // Calculate grades, totals, averages, status for each student
  const processed = students.map((student) => ({
    ...student,
    grades: calculateGrades(student.marks, student.classForm),
    total: calculateTotal(student.marks),
    average: calculateAverage(student.marks),
    status: determineStatus(student.marks),
  }));

  // Calculate ranks
  let ranked = calculateRanks(processed);

  // Calculate subject positions
  ranked = calculateSubjectPositions(ranked);

  return ranked;
};

export const roundMarks = (marks: SubjectMarks): SubjectMarks => {
  const rounded: any = {};
  Object.entries(marks).forEach(([key, value]) => {
    // Convert empty, null, undefined, empty string, or "AB" to "AB"
    if (value === "AB" || value === null || value === undefined || value === "" || value === 0) {
      rounded[key] = "AB";
    } else {
      rounded[key] = Math.round(Number(value));
    }
  });
  return rounded as SubjectMarks;
};
