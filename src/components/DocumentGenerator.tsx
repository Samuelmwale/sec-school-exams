import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

interface Invoice {
  id: string;
  registration_number: string;
  class_form: string;
  year: string;
  term: string;
  amount: number;
  installment_number: number;
  due_date: string;
  status: string;
}

interface StudentPaymentData {
  registration_number: string;
  name: string;
  class_form: string;
  year: string;
  invoices: Invoice[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

interface SchoolInfo {
  school_name: string;
  center_number: string;
  address: string;
  district_name?: string;
  zone_name?: string;
  division_name?: string;
}

interface DocumentGeneratorProps {
  student: StudentPaymentData;
  school: SchoolInfo;
  documentType: "receipt" | "invoice";
  onClose: () => void;
}

type PaperSize = "A4" | "A5" | "Letter" | "Legal" | "Receipt80mm";

const PAPER_SIZES: Record<PaperSize, { width: number; height: number; label: string }> = {
  A4: { width: 210, height: 297, label: "A4 (210 × 297 mm)" },
  A5: { width: 148, height: 210, label: "A5 (148 × 210 mm)" },
  Letter: { width: 216, height: 279, label: "Letter (8.5 × 11 in)" },
  Legal: { width: 216, height: 356, label: "Legal (8.5 × 14 in)" },
  Receipt80mm: { width: 80, height: 297, label: "Receipt (80mm thermal)" },
};

export const DocumentGenerator = ({ student, school, documentType, onClose }: DocumentGeneratorProps) => {
  const [paperSize, setPaperSize] = useState<PaperSize>("A4");
  const [format, setFormat] = useState<"pdf" | "word">("pdf");

  const generatePDF = () => {
    const size = PAPER_SIZES[paperSize];
    const isReceipt = paperSize === "Receipt80mm";
    const doc = new jsPDF({
      orientation: size.width > size.height ? "landscape" : "portrait",
      unit: "mm",
      format: [size.width, size.height],
    });

    const margin = isReceipt ? 3 : 15;
    const pageWidth = size.width - margin * 2;
    const fontSize = isReceipt ? 7 : 11;

    // Header
    doc.setFontSize(isReceipt ? 9 : 16);
    doc.setFont("helvetica", "bold");
    doc.text(school.school_name, size.width / 2, margin + 5, { align: "center" });

    doc.setFontSize(isReceipt ? 6 : 10);
    doc.setFont("helvetica", "normal");
    doc.text(school.address, size.width / 2, margin + (isReceipt ? 9 : 12), { align: "center" });
    
    if (school.district_name) {
      doc.text(`${school.district_name} - ${school.division_name || ""}`, size.width / 2, margin + (isReceipt ? 13 : 18), { align: "center" });
    }

    // Document title
    doc.setFontSize(isReceipt ? 8 : 14);
    doc.setFont("helvetica", "bold");
    const title = documentType === "receipt" ? "PAYMENT RECEIPT" : "FEE INVOICE";
    doc.text(title, size.width / 2, margin + (isReceipt ? 20 : 28), { align: "center" });

    // Document number and date
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    const docNumber = `${documentType === "receipt" ? "RCP" : "INV"}-${Date.now().toString().slice(-8)}`;
    doc.text(`Document No: ${docNumber}`, margin, margin + (isReceipt ? 26 : 38));
    doc.text(`Date: ${new Date().toLocaleDateString()}`, size.width - margin - (isReceipt ? 25 : 40), margin + (isReceipt ? 26 : 38));

    // Student info
    let yPos = margin + (isReceipt ? 32 : 48);
    doc.setFont("helvetica", "bold");
    doc.text("Student Details:", margin, yPos);
    doc.setFont("helvetica", "normal");
    yPos += isReceipt ? 4 : 6;
    doc.text(`Name: ${student.name}`, margin, yPos);
    yPos += isReceipt ? 4 : 6;
    doc.text(`Reg No: ${student.registration_number}`, margin, yPos);
    yPos += isReceipt ? 4 : 6;
    doc.text(`Class: ${student.class_form}`, margin, yPos);
    doc.text(`Year: ${student.year}`, margin + (isReceipt ? 25 : 60), yPos);

    // Line items table
    yPos += isReceipt ? 8 : 15;

    const relevantInvoices = documentType === "receipt" 
      ? student.invoices.filter(inv => inv.status === "paid")
      : student.invoices;

    if (relevantInvoices.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Description", "Term", "Installment", "Due Date", "Amount (MWK)", "Status"]],
        body: relevantInvoices.map(inv => [
          `${inv.class_form} Fees`,
          inv.term,
          `#${inv.installment_number}`,
          inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "-",
          inv.amount.toLocaleString(),
          inv.status.toUpperCase(),
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: isReceipt ? 5 : 9, cellPadding: isReceipt ? 1 : 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: isReceipt ? 5 : 9 },
        columnStyles: isReceipt ? { 
          0: { cellWidth: 12 }, 1: { cellWidth: 10 }, 2: { cellWidth: 10 },
          3: { cellWidth: 12 }, 4: { cellWidth: 12 }, 5: { cellWidth: 10 }
        } : {},
      });

      yPos = (doc as any).lastAutoTable.finalY + (isReceipt ? 5 : 10);
    }

    // Summary
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", margin, yPos);
    doc.setFont("helvetica", "normal");
    yPos += isReceipt ? 4 : 6;
    doc.text(`Total Amount: MWK ${student.totalAmount.toLocaleString()}`, margin, yPos);
    yPos += isReceipt ? 4 : 6;
    doc.text(`Amount Paid: MWK ${student.paidAmount.toLocaleString()}`, margin, yPos);
    yPos += isReceipt ? 4 : 6;
    doc.text(`Balance: MWK ${student.pendingAmount.toLocaleString()}`, margin, yPos);

    // Footer
    if (!isReceipt) {
      yPos += 20;
      doc.setFontSize(9);
      doc.text("Authorized Signature: _____________________", margin, yPos);
      doc.text("Date: _____________________", margin + 100, yPos);
      
      yPos += 15;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("This is a computer-generated document.", size.width / 2, yPos, { align: "center" });
    }

    doc.save(`${student.name}_${documentType}_${paperSize}.pdf`);
  };

  const generateWord = async () => {
    const relevantInvoices = documentType === "receipt" 
      ? student.invoices.filter(inv => inv.status === "paid")
      : student.invoices;

    const docNumber = `${documentType === "receipt" ? "RCP" : "INV"}-${Date.now().toString().slice(-8)}`;
    const title = documentType === "receipt" ? "PAYMENT RECEIPT" : "FEE INVOICE";

    const tableRows = [
      new TableRow({
        children: ["Description", "Term", "Installment", "Due Date", "Amount (MWK)", "Status"].map(text =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
            shading: { fill: "2980b9" },
          })
        ),
      }),
      ...relevantInvoices.map(inv =>
        new TableRow({
          children: [
            `${inv.class_form} Fees`,
            inv.term,
            `#${inv.installment_number}`,
            inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "-",
            inv.amount.toLocaleString(),
            inv.status.toUpperCase(),
          ].map(text =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
            })
          ),
        })
      ),
    ];

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ children: [new TextRun({ text: school.school_name, bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: school.address, size: 20 })], alignment: AlignmentType.CENTER }),
          school.district_name ? new Paragraph({ children: [new TextRun({ text: `${school.district_name} - ${school.division_name || ""}`, size: 20 })], alignment: AlignmentType.CENTER }) : new Paragraph({}),
          new Paragraph({}),
          new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
          new Paragraph({}),
          new Paragraph({ children: [new TextRun({ text: `Document No: ${docNumber}`, size: 20 }), new TextRun({ text: `     Date: ${new Date().toLocaleDateString()}`, size: 20 })] }),
          new Paragraph({}),
          new Paragraph({ children: [new TextRun({ text: "Student Details:", bold: true, size: 22 })] }),
          new Paragraph({ children: [new TextRun({ text: `Name: ${student.name}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Registration No: ${student.registration_number}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Class: ${student.class_form}     Year: ${student.year}`, size: 20 })] }),
          new Paragraph({}),
          new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
          new Paragraph({}),
          new Paragraph({ children: [new TextRun({ text: "Summary:", bold: true, size: 22 })] }),
          new Paragraph({ children: [new TextRun({ text: `Total Amount: MWK ${student.totalAmount.toLocaleString()}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Amount Paid: MWK ${student.paidAmount.toLocaleString()}`, size: 20 })] }),
          new Paragraph({ children: [new TextRun({ text: `Balance: MWK ${student.pendingAmount.toLocaleString()}`, size: 20 })] }),
          new Paragraph({}),
          new Paragraph({}),
          new Paragraph({ children: [new TextRun({ text: "Authorized Signature: _____________________     Date: _____________________", size: 20 })] }),
          new Paragraph({}),
          new Paragraph({ children: [new TextRun({ text: "This is a computer-generated document.", italics: true, size: 16, color: "666666" })], alignment: AlignmentType.CENTER }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${student.name}_${documentType}_${paperSize}.docx`);
  };

  const handleGenerate = () => {
    if (format === "pdf") {
      generatePDF();
    } else {
      generateWord();
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate {documentType === "receipt" ? "Receipt" : "Invoice"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{student.name}</p>
            <p className="text-sm text-muted-foreground">{student.registration_number} - {student.class_form}</p>
          </div>

          <div>
            <Label>Paper Size</Label>
            <Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAPER_SIZES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as "pdf" | "word")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="word">Word Document (.docx)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerate} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download {documentType === "receipt" ? "Receipt" : "Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
