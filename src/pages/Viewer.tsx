import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storageHelper } from "@/lib/storage";
import { dbSync } from "@/lib/db-sync";
import { Student, ClassForm, Term } from "@/types/student";
import { SUBJECTS, SubjectKey } from "@/lib/grading";
import { SubjectStatistics } from "@/components/SubjectStatistics";
import { exportClassToPDF } from "@/lib/class-exports";
import { exportToExcel, exportToWord, exportAllToZip } from "@/lib/exports";
import { toast } from "sonner";

const Viewer = () => {
  const navigate = useNavigate();
  const [isSubscriptionValid, setIsSubscriptionValid] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({ classForm: "Form1" as ClassForm, year: "2024", term: "Term1" as Term });
  const [stats, setStats] = useState({ total: 0, boys: 0, girls: 0, passedBoys: 0, passedGirls: 0, failedBoys: 0, failedGirls: 0 });

  useEffect(() => {
    const settings = storageHelper.getSettings();
    const isExpired = !settings.subscriptionExpiry || Date.now() > settings.subscriptionExpiry;
    setIsSubscriptionValid(!isExpired);
    
    loadData();
  }, [filter]);

  useEffect(() => {
    // Filter students by search query
    if (searchQuery.trim()) {
      const filtered = students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const loadData = async () => {
    // Sync localStorage to database first
    await dbSync.syncToDatabase();
    
    // Load from database with sorting by total (descending)
    const allStudents = await dbSync.getStudents(filter.classForm, filter.year, filter.term);
    
    // Sort by total marks (highest first) and assign ranks
    const sorted = allStudents.sort((a, b) => b.total - a.total);
    sorted.forEach((s, index) => {
      s.rank = index + 1;
    });
    
    setStudents(sorted);
    setFilteredStudents(sorted);

    const total = sorted.length;
    const boys = sorted.filter((s) => s.sex === "M").length;
    const girls = sorted.filter((s) => s.sex === "F").length;
    const passedBoys = sorted.filter((s) => s.sex === "M" && s.status === "PASS").length;
    const passedGirls = sorted.filter((s) => s.sex === "F" && s.status === "PASS").length;
    const failedBoys = sorted.filter((s) => s.sex === "M" && s.status === "FAIL").length;
    const failedGirls = sorted.filter((s) => s.sex === "F" && s.status === "FAIL").length;

    setStats({ total, boys, girls, passedBoys, passedGirls, failedBoys, failedGirls });
  };

  const handleDownloadPDF = () => {
    const settings = storageHelper.getSettings();
    exportClassToPDF(filteredStudents, settings, filter.classForm, filter.year, filter.term);
    toast.success("PDF downloaded!");
  };

  const handleDownloadExcel = () => {
    exportToExcel(filteredStudents, `${filter.classForm}_${filter.term}_${filter.year}.xlsx`);
    toast.success("Excel downloaded!");
  };

  const handleDownloadWord = async () => {
    const settings = storageHelper.getSettings();
    await exportToWord(filteredStudents, settings);
    toast.success("Word document opened!");
  };

  const handleDownloadAll = async () => {
    const settings = storageHelper.getSettings();
    await exportAllToZip(filteredStudents, settings);
    toast.success("All files downloaded!");
  };


  return (
    <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>

        <h1 className="text-3xl font-bold text-primary mb-6">Results Viewer</h1>

        {!isSubscriptionValid && (
          <Card className="p-4 mb-6 border-destructive">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">Subscription Expired - View Only Mode</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Contact <strong>0880425220</strong> to reactivate your subscription.
            </p>
          </Card>
        )}

        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
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
              <Select value={filter.year} onValueChange={(v) => setFilter({ ...filter, year: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 17 }, (_, i) => 2024 + i).map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
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
              <Label>Search by Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search student..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleDownloadPDF} size="sm">
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button onClick={handleDownloadExcel} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button onClick={handleDownloadWord} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Word
            </Button>
            <Button onClick={handleDownloadAll} variant="secondary" size="sm">
              <Download className="mr-2 h-4 w-4" />
              All Formats
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card><CardHeader><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{stats.total}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Boys</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.boys}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Girls</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.girls}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Passed</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-secondary">{stats.passedBoys + stats.passedGirls}</p></CardContent></Card>
        </div>

        {students.length > 0 && (
          <div className="mb-6">
            <SubjectStatistics students={students} classForm={filter.classForm} />
          </div>
        )}

        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pos</TableHead>
                <TableHead>Name</TableHead>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-bold">{s.rank}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  {Object.keys(SUBJECTS).map((k) => {
                    const subjectKey = k as SubjectKey;
                    const mark = s.marks[subjectKey];
                    const grade = s.grades[subjectKey];
                    return (
                      <>
                        <TableCell key={`${k}-mark`} className="border-l">{mark === "AB" ? "AB" : mark}</TableCell>
                        <TableCell key={`${k}-grade`}>{grade.grade}</TableCell>
                        <TableCell key={`${k}-pos`}>{grade.pos || "-"}</TableCell>
                        <TableCell key={`${k}-rmk`} className="text-xs">{grade.remark}</TableCell>
                      </>
                    );
                  })}
                  <TableCell className="font-semibold">{s.total}</TableCell>
                  <TableCell><span className={s.status === "PASS" ? "text-secondary font-semibold" : "text-destructive"}>{s.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {filteredStudents.length === 0 && students.length > 0 && (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">No students found matching "{searchQuery}"</p>
          </Card>
        )}

        {students.length === 0 && (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">No students found for this class/year/term</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Viewer;
