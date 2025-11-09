import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Student, SchoolSettings, ClassForm, Term } from "@/types/student";
import { SUBJECTS, SubjectKey } from "./grading";

export const exportClassToPDF = (students: Student[], settings: SchoolSettings, classForm: ClassForm, year: string, term: Term) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const isForm12 = classForm === "Form1" || classForm === "Form2";

  // Header with updated font sizes
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(settings.schoolName, pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(18);
  doc.text(settings.schoolAddress, pageWidth / 2, 23, { align: "center" });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 26, pageWidth - 20, 26);
  
  doc.setFontSize(16);
  doc.text(`${year} ${classForm.replace("Form", "FORM ")} END OF ${term.replace("Term", "TERM ")} EXAMINATION RESULTS`, pageWidth / 2, 33, { align: "center" });
  
  // Add total students count
  doc.setFontSize(10);
  doc.text(`Total Students: ${students.length}`, 14, 36);
  
  // Rest of content at font 12
  doc.setFontSize(12);

  // Table with Mrk, Grd, Pos, Rmk columns per subject
  const headers = ["Pos", "Name", ...Object.values(SUBJECTS).flatMap((s) => ["", s, "", "", ""]), "Total", "Status"];
  const subHeaders = ["", "", ...Object.values(SUBJECTS).flatMap(() => ["Mrk", "Grd", "Pos", "Rmk"]), "", ""];
  
  const data = students.map((s) => {
    const passedSubjectsCount = Object.keys(SUBJECTS).filter((k) => {
      const key = k as SubjectKey;
      const grade = s.grades[key].grade;
      if (isForm12) {
        return ["A", "B", "C", "D"].includes(grade);
      } else {
        return ["1", "2", "3", "4", "5", "6", "7", "8"].includes(grade);
      }
    }).length;

    const englishGrade = s.grades.eng?.grade || "";
    const passedEnglish = isForm12
      ? ["A", "B", "C", "D"].includes(englishGrade)
      : ["1", "2", "3", "4", "5", "6", "7", "8"].includes(englishGrade);

    return [
      s.rank,
      s.name,
      ...Object.keys(SUBJECTS).flatMap((k) => {
        const key = k as SubjectKey;
        const mark = s.marks[key];
        const grade = s.grades[key].grade;
        const pos = s.grades[key].pos || "-";
        let remark = "";
        
        if (isForm12) {
          if (grade === "A") remark = "Excellent";
          else if (grade === "B") remark = "Good";
          else if (grade === "C") remark = "Average";
          else if (grade === "D") remark = "Fair";
          else if (grade === "F") remark = "Fail";
        } else {
          if (["1", "2"].includes(grade)) remark = "Distinction";
          else if (["3", "4"].includes(grade)) remark = "Strong Credit";
          else if (["5", "6"].includes(grade)) remark = "Credit";
          else if (["7", "8"].includes(grade)) remark = "Pass";
          else if (grade === "9") remark = "Fail";
        }
        
        return [mark === "AB" ? "AB" : mark, grade, pos, remark];
      }),
      s.total,
      s.status,
    ];
  });

  (doc as any).autoTable({
    head: [headers, subHeaders],
    body: data,
    startY: 38,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: { 0: { halign: 'center' }, 1: { fontStyle: 'bold' } },
  });

  // Add grading scale at the bottom
  const finalY = (doc as any).lastAutoTable.finalY || 38;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Grading Scale:", 14, finalY + 10);
  doc.setFont("helvetica", "normal");
  
  if (isForm12) {
    doc.text("A = 90-100 (Excellent)  |  B = 80-89 (Good)  |  C = 60-79 (Average)  |  D = 40-59 (Fair)  |  F = 0-39 (Fail)", 14, finalY + 16);
  } else {
    doc.text("1 = 85-100 (Distinction)  |  2 = 75-84 (Distinction)  |  3 = 70-74 (Strong Credit)  |  4 = 60-69 (Strong Credit)", 14, finalY + 16);
    doc.text("5 = 55-59 (Credit)  |  6 = 50-54 (Credit)  |  7 = 45-49 (Pass)  |  8 = 40-44 (Pass)  |  9 = 0-39 (Fail)", 14, finalY + 22);
  }

  doc.save(`${classForm}_${term}_${year}_results.pdf`);
};
