import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import { ClassForm, Term, Sex, SubjectMarks, Student } from "@/types/student";
import { roundMarks } from "@/lib/grading";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ExcelUploaderProps {
  onUpload: (students: Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">[]) => void;
  uploadMode: "append" | "replace";
  onModeChange: (mode: "append" | "replace") => void;
  classForm: ClassForm;
  year: string;
  term: Term;
  disabled?: boolean;
}

export const ExcelUploader = ({ onUpload, uploadMode, onModeChange, classForm, year, term, disabled = false }: ExcelUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcelData = (data: any[]): Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">[] => {
    const students: Omit<Student, "id" | "grades" | "total" | "average" | "rank" | "status">[] = [];

    if (data.length === 0) {
      console.log("No data rows found");
      return students;
    }

    console.log("Total rows:", data.length);
    console.log("First row:", data[0]);

    // Find the header row (might not be first row)
    let headerRowIndex = -1;
    let headerMap: any = {};

    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      if (!row) continue;

      const values = Array.isArray(row) ? row : Object.values(row);
      const keys = Array.isArray(row) ? values.map((_, idx) => idx.toString()) : Object.keys(row);
      
      // Check if this row has header-like values
      const hasName = values.some(v => {
        const str = String(v || "").toLowerCase().trim();
        return str.includes("name") || str === "student" || str === "fullname";
      });

      if (hasName) {
        headerRowIndex = i;
        
        // Map headers
        values.forEach((headerValue, index) => {
          const header = String(headerValue || "").toLowerCase().trim();
          const key = keys[index];
          
          if (header.includes("name") || header === "student" || header === "fullname") headerMap.name = key;
          if (header.includes("sex") || header.includes("gender") || header === "m/f") headerMap.sex = key;
          if (header.includes("english") || header === "eng") headerMap.eng = key;
          if (header.includes("physics") || header === "phy") headerMap.phy = key;
          if (header.includes("agriculture") || header.includes("agric") || header === "agr") headerMap.agr = key;
          if (header.includes("biology") || header === "bio") headerMap.bio = key;
          if (header.includes("chemistry") || header === "che") headerMap.che = key;
          if (header.includes("chichewa") || header === "chi") headerMap.chi = key;
          if (header.includes("geography") || header === "geo") headerMap.geo = key;
          if (header.includes("mathematics") || header.includes("math") || header === "mat" || header === "maths") headerMap.mat = key;
          if (header.includes("social") || header === "soc") headerMap.soc = key;
          if (header.includes("history") || header === "his") headerMap.his = key;
          if (header.includes("bible") || header.includes("b.k") || header === "bk") headerMap.bk = key;
        });
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.log("No header row found, trying first row as data");
      // If no headers found, assume first row is data and use column indices
      headerRowIndex = -1;
      const firstRow = data[0];
      const keys = Array.isArray(firstRow) ? Object.keys(firstRow).map(String) : Object.keys(firstRow);
      
      // Try to auto-detect columns by position (common formats)
      headerMap = {
        name: keys[0] || "0",
        sex: keys[1] || "1",
        eng: keys[2] || "2",
        mat: keys[3] || "3",
        chi: keys[4] || "4",
        phy: keys[5] || "5",
        che: keys[6] || "6",
        bio: keys[7] || "7",
        agr: keys[8] || "8",
        geo: keys[9] || "9",
        his: keys[10] || "10",
        soc: keys[11] || "11",
        bk: keys[12] || "12"
      };
    }

    console.log("Header map:", headerMap);
    console.log("Starting data from row:", headerRowIndex + 1);

    // Process data rows
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      // Get name
      const nameValue = row[headerMap.name];
      if (!nameValue) continue;

      const name = String(nameValue).trim();
      if (!name || name === "" || name === "null" || name === "undefined" || name.toLowerCase() === "name") continue;

      console.log(`Processing student: ${name}`);

      const sexValue = row[headerMap.sex] ? String(row[headerMap.sex]).trim().toUpperCase() : "M";
      const sex: Sex = sexValue.startsWith("F") || sexValue === "F" ? "F" : "M";

      const marks: SubjectMarks = {
        eng: parseMarks(row[headerMap.eng]),
        phy: parseMarks(row[headerMap.phy]),
        agr: parseMarks(row[headerMap.agr]),
        bio: parseMarks(row[headerMap.bio]),
        che: parseMarks(row[headerMap.che]),
        chi: parseMarks(row[headerMap.chi]),
        geo: parseMarks(row[headerMap.geo]),
        mat: parseMarks(row[headerMap.mat]),
        soc: parseMarks(row[headerMap.soc]),
        his: parseMarks(row[headerMap.his]),
        bk: parseMarks(row[headerMap.bk]),
      };

      const roundedMarks = roundMarks(marks);

      students.push({
        name,
        sex,
        student_id: "",
        classForm,
        year,
        term,
        marks: roundedMarks,
      });
    }

    console.log(`Parsed ${students.length} students`);
    return students;
  };

  const parseMarks = (value: any): number | "AB" => {
    if (value === null || value === undefined || value === "") return "AB";
    const str = String(value).toLowerCase().trim();
    if (str === "ab" || str === "absent") return "AB";
    const num = parseFloat(str);
    return isNaN(num) ? "AB" : num;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 0 });

        const students = parseExcelData(jsonData);
        if (students.length === 0) {
          toast.error("No valid student data found in file");
          return;
        }

        onUpload(students);
        toast.success(`Successfully uploaded ${students.length} student(s)`);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Failed to parse file. Please check the format.");
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label>Upload Mode</Label>
          <Select value={uploadMode} onValueChange={(v) => onModeChange(v as "append" | "replace")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="append">Append to existing data</SelectItem>
              <SelectItem value="replace">Replace existing data</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="pt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="secondary" disabled={disabled}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Excel/CSV
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Upload an Excel or CSV file with columns: Name, Sex (M/F), and subject marks (English, Physics, Agriculture, Biology, Chemistry, Chichewa, Geography, Mathematics, Social Studies, History, Bible Knowledge).
        The file will be uploaded for the selected Class, Year, and Term.
      </p>
    </div>
  );
};
