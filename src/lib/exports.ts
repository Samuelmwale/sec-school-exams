import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Student, SchoolSettings } from "@/types/student";
import { SUBJECTS, SubjectKey } from "./grading";

export const exportToExcel = (students: Student[], filename: string) => {
  const data = students.map((s) => {
    const row: any = {
      Name: s.name,
      Sex: s.sex,
      Class: s.classForm,
      Year: s.year,
      Term: s.term,
    };

    Object.entries(SUBJECTS).forEach(([key, label]) => {
      const subjectKey = key as SubjectKey;
      const mark = s.marks[subjectKey];
      row[label] = mark === "AB" ? "AB" : mark;
      row[`${label} Grade`] = s.grades[subjectKey].grade;
      row[`${label} Pos`] = s.grades[subjectKey].pos || "-";
    });

    row.Total = s.total;
    row.Average = s.average;
    row.Position = s.rank;
    row.Status = s.status;

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  XLSX.writeFile(wb, filename);
};

export const exportToPDF = (students: Student[], settings: SchoolSettings) => {
  const doc = new jsPDF();

  students.forEach((student, index) => {
    if (index > 0) doc.addPage();

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const schoolName = settings.schoolName;
    const textWidth = doc.getTextWidth(schoolName);
    doc.text(schoolName, (doc.internal.pageSize.width - textWidth) / 2, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const address = settings.schoolAddress;
    const addressWidth = doc.getTextWidth(address);
    doc.text(address, (doc.internal.pageSize.width - addressWidth) / 2, 22);

    // Student details - Show position next to sex
    doc.setFontSize(11);
    doc.text(`Name: ${student.name}`, 15, 35);
    doc.text(`Sex: ${student.sex === "M" ? "Male" : "Female"}    Position: ${student.rank}`, 15, 42);
    doc.text(`Class: ${student.classForm}`, 120, 35);
    doc.text(`Year: ${student.year}`, 120, 42);
    doc.text(`Term: ${student.term}`, 170, 35);

    // Results table
    const tableData = Object.entries(SUBJECTS).map(([key, label]) => {
      const subjectKey = key as SubjectKey;
      const mark = student.marks[subjectKey];
      const grade = student.grades[subjectKey];
      return [
        label,
        mark === "AB" ? "AB" : mark.toString(),
        grade.grade,
        grade.pos || "-",
        grade.remark,
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [["Subject", "Mark", "Grade", "Pos", "Remark"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [33, 97, 140], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 2 },
    });

    let yPos = (doc as any).lastAutoTable.finalY + 10;

    // Summary
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${student.total}`, 15, yPos);
    doc.text(`Average: ${student.average}`, 70, yPos);
    doc.text(`Position: ${student.rank}`, 120, yPos);
    doc.text(`Status: ${student.status}`, 170, yPos);
    
    yPos += 15;

    // Grading scale
    const isForm12 = student.classForm === "Form1" || student.classForm === "Form2";
    const gradingScale = isForm12
      ? "Grading Scale: A=90-100 (Excellent), B=80-89 (Very good), C=60-79 (Good), D=40-59 (Pass), F=0-39 (Fail)"
      : "Grading Scale: 1=85-100 (Distinction), 2=75-84 (Distinction), 3=70-74 (Strong Credit), 4=60-69 (Credit), 5=55-59 (Credit), 6=50-54 (Credit), 7=45-49 (Pass), 8=40-44 (Pass), 9=0-39 (Fail)";
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const splitScale = doc.splitTextToSize(gradingScale, 190);
    doc.text(splitScale, 15, yPos);
    yPos += splitScale.length * 5 + 5;

    // Remarks
    const formTeacherRemark = student.status === "PASS" ? "has passed" : "has Failed";
    const headTeacherRemark = student.status === "PASS" 
      ? "Congratulations for passing this Examinations, keep it up"
      : "I regret that you have Failed, you need to improve to pass next time";

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Form Teacher's Remark: ", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(formTeacherRemark, 75, yPos);
    
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Head Teacher's Remark: ", 15, yPos);
    doc.setFont("helvetica", "normal");
    const splitRemark = doc.splitTextToSize(headTeacherRemark, 130);
    doc.text(splitRemark, 75, yPos);
    
    yPos += splitRemark.length * 5 + 10;
    doc.text("Signature: ______________", 15, yPos);
  });

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

export const exportToWord = async (students: Student[], settings: SchoolSettings) => {
  const sections = students.map((student) => {
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Subject", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mark", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Grade", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pos", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Remark", bold: true })] })] }),
        ],
      }),
    ];

    Object.entries(SUBJECTS).forEach(([key, label]) => {
      const subjectKey = key as SubjectKey;
      const mark = student.marks[subjectKey];
      const grade = student.grades[subjectKey];

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(label)] }),
            new TableCell({ children: [new Paragraph(mark === "AB" ? "AB" : mark.toString())] }),
            new TableCell({ children: [new Paragraph(grade.grade)] }),
            new TableCell({ children: [new Paragraph(grade.pos ? grade.pos.toString() : "-")] }),
            new TableCell({ children: [new Paragraph(grade.remark)] }),
          ],
        })
      );
    });

    return {
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        new Paragraph({
          text: settings.schoolName,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          style: "Heading1",
        }),
        new Paragraph({
          text: settings.schoolAddress,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Name: ", bold: true }),
            new TextRun(student.name),
            new TextRun({ text: "     Sex: ", bold: true }),
            new TextRun(student.sex === "M" ? "Male" : "Female"),
            new TextRun({ text: "     Position: ", bold: true }),
            new TextRun(student.rank.toString()),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Class: ", bold: true }),
            new TextRun(student.classForm),
            new TextRun({ text: "     Year: ", bold: true }),
            new TextRun(student.year),
            new TextRun({ text: "     Term: ", bold: true }),
            new TextRun(student.term),
          ],
          spacing: { after: 200 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Total: ${student.total}     `, bold: true }),
            new TextRun({ text: `Average: ${student.average}     `, bold: true }),
            new TextRun({ text: `Position: ${student.rank}     `, bold: true }),
            new TextRun({ text: `Status: ${student.status}`, bold: true }),
          ],
          spacing: { before: 300, after: 200 },
        }),
        new Paragraph({
          text: student.classForm === "Form1" || student.classForm === "Form2"
            ? "Grading Scale: A=90-100 (Excellent), B=80-89 (Very good), C=60-79 (Good), D=40-59 (Pass), F=0-39 (Fail)"
            : "Grading Scale: 1=85-100 (Distinction), 2=75-84 (Distinction), 3=70-74 (Strong Credit), 4=60-69 (Credit), 5=55-59 (Credit), 6=50-54 (Credit), 7=45-49 (Pass), 8=40-44 (Pass), 9=0-39 (Fail)",
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Form Teacher's Remark: ", bold: true }),
            new TextRun(student.status === "PASS" ? "has passed" : "has Failed"),
          ],
          spacing: { after: 150 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Head Teacher's Remark: ", bold: true }),
            new TextRun(
              student.status === "PASS"
                ? "Congratulations for passing this Examinations, keep it up"
                : "I regret that you have Failed, you need to improve to pass next time"
            ),
          ],
          spacing: { after: 150 },
        }),
        new Paragraph({ text: "Signature: ______________" }),
      ],
    };
  });

  const doc = new Document({ sections });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

export const exportAllToZip = async (students: Student[], settings: SchoolSettings) => {
  const zip = new JSZip();

  // Add Excel file
  const excelData = students.map((s) => {
    const row: any = {
      Name: s.name,
      Sex: s.sex,
      Class: s.classForm,
      Year: s.year,
      Term: s.term,
    };

    Object.entries(SUBJECTS).forEach(([key, label]) => {
      const subjectKey = key as SubjectKey;
      const mark = s.marks[subjectKey];
      row[label] = mark === "AB" ? "AB" : mark;
      row[`${label} Grade`] = s.grades[subjectKey].grade;
      row[`${label} Pos`] = s.grades[subjectKey].pos || "-";
    });

    row.Total = s.total;
    row.Average = s.average;
    row.Position = s.rank;
    row.Status = s.status;

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  zip.file("results.xlsx", excelBuffer);

  // Add Word reports
  for (const student of students) {
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Subject", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mark", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Grade", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pos", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Remark", bold: true })] })] }),
        ],
      }),
    ];

    Object.entries(SUBJECTS).forEach(([key, label]) => {
      const subjectKey = key as SubjectKey;
      const mark = student.marks[subjectKey];
      const grade = student.grades[subjectKey];

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(label)] }),
            new TableCell({ children: [new Paragraph(mark === "AB" ? "AB" : mark.toString())] }),
            new TableCell({ children: [new Paragraph(grade.grade)] }),
            new TableCell({ children: [new Paragraph(grade.pos ? grade.pos.toString() : "-")] }),
            new TableCell({ children: [new Paragraph(grade.remark)] }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children: [
            new Paragraph({
              text: settings.schoolName,
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
              style: "Heading1",
            }),
            new Paragraph({
              text: settings.schoolAddress,
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Name: ", bold: true }),
                new TextRun(student.name),
                new TextRun({ text: "     Sex: ", bold: true }),
                new TextRun(student.sex === "M" ? "Male" : "Female"),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Class: ", bold: true }),
                new TextRun(student.classForm),
                new TextRun({ text: "     Year: ", bold: true }),
                new TextRun(student.year),
                new TextRun({ text: "     Term: ", bold: true }),
                new TextRun(student.term),
              ],
              spacing: { after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total: ${student.total}     `, bold: true }),
                new TextRun({ text: `Average: ${student.average}     `, bold: true }),
                new TextRun({ text: `Position: ${student.rank}     `, bold: true }),
                new TextRun({ text: `Status: ${student.status}`, bold: true }),
              ],
              spacing: { before: 300, after: 200 },
            }),
            new Paragraph({
              text: student.classForm === "Form1" || student.classForm === "Form2"
                ? "Grading Scale: A=90-100 (Excellent), B=80-89 (Very good), C=60-79 (Good), D=40-59 (Pass), F=0-39 (Fail)"
                : "Grading Scale: 1=85-100 (Distinction), 2=75-84 (Distinction), 3=70-74 (Strong Credit), 4=60-69 (Credit), 5=55-59 (Credit), 6=50-54 (Credit), 7=45-49 (Pass), 8=40-44 (Pass), 9=0-39 (Fail)",
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Form Teacher's Remark: ", bold: true }),
                new TextRun(student.status === "PASS" ? "has passed" : "has Failed"),
              ],
              spacing: { after: 150 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Head Teacher's Remark: ", bold: true }),
                new TextRun(
                  student.status === "PASS"
                    ? "Congratulations for passing this Examinations, keep it up"
                    : "I regret that you have Failed, you need to improve to pass next time"
                ),
              ],
              spacing: { after: 150 },
            }),
            new Paragraph({ text: "Signature: ______________" }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    zip.file(`reports/${student.name}_report.docx`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "school_reports.zip");
};
