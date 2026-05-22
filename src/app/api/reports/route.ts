import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jsPDF from "jspdf";
import "jspdf-autotable";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // Get student with all related data
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        questionnaire: true,
        videos: true,
        aiAnalysis: true,
        adminNotes: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (!student.aiAnalysis || student.aiAnalysis.analysisStatus !== "COMPLETED") {
      return NextResponse.json(
        { error: "AI analysis must be completed before generating a report" },
        { status: 400 }
      );
    }

    const analysis = student.aiAnalysis;

    // Parse risk flags
    let riskFlags: string[] = [];
    try {
      riskFlags = JSON.parse(analysis.riskFlags || "[]");
    } catch {
      riskFlags = [];
    }

    // Parse questionnaire sections
    const sectionA: Record<string, string> = safeParseJSON(
      student.questionnaire?.sectionA || "{}"
    );
    const sectionB: Record<string, string> = safeParseJSON(
      student.questionnaire?.sectionB || "{}"
    );
    const sectionC: Record<string, string> = safeParseJSON(
      student.questionnaire?.sectionC || "{}"
    );

    // Generate PDF
    const doc = new jsPDF() as JsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // ---- HEADER ----
    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Kindergarten Readiness Assessment", pageWidth / 2, 15, {
      align: "center",
    });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("AI-Assisted Educational Readiness Report", pageWidth / 2, 25, {
      align: "center",
    });
    doc.setFontSize(9);
    doc.text(
      `Application: ${student.applicationId}`,
      pageWidth / 2,
      32,
      { align: "center" }
    );

    yPos = 45;

    // ---- STUDENT PROFILE ----
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Student Profile", 14, yPos);
    yPos += 2;

    doc.autoTable({
      startY: yPos,
      head: [],
      body: [
        ["Child Name", student.childName],
        ["Date of Birth", student.dateOfBirth],
        ["Age at Assessment", calculateAge(student.dateOfBirth)],
        ["Gender", student.gender],
        ["Nationality", student.nationality],
        ["Languages Spoken", student.languagesSpoken],
        ["School Applied", student.schoolApplied],
        ["Grade Applied", student.gradeApplied],
        ["Father", student.fatherName],
        ["Mother", student.motherName],
        ["Contact", student.mobileNumber],
        ["Previous School", student.previousSchool || "N/A"],
        ["Special Medical Notes", student.specialMedicalNotes || "None"],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45, fillColor: [240, 244, 255] },
        1: { cellWidth: "auto" },
      },
    });

    yPos = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12;

    // ---- QUESTIONNAIRE SUMMARY ----
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Questionnaire Summary", 14, yPos);
    yPos += 2;

    const questionnaireData: string[][] = [];
    const allQuestions: Record<string, string> = {
      // Section A - Attention
      q1: "Can the child sit still for 5+ minutes?",
      q2: "Does the child maintain focus on tasks?",
      q3: "Can the child follow simple instructions?",
      q4: "Does the child complete activities without distraction?",
      q5: "Does the child show sustained interest in activities?",
    };

    // Add Section A responses
    for (const [key, question] of Object.entries(allQuestions)) {
      if (sectionA[key]) {
        questionnaireData.push([
          `A-${key.toUpperCase()}`,
          question,
          sectionA[key],
        ]);
      }
    }

    // Add Section B responses
    const sectionBQuestions: Record<string, string> = {
      q1: "Does the child become easily frustrated?",
      q2: "Can the child calm down after being upset?",
      q3: "Does the child show aggressive behavior?",
      q4: "Does the child separate from parents without distress?",
      q5: "Does the child express emotions appropriately?",
    };
    for (const [key, question] of Object.entries(sectionBQuestions)) {
      if (sectionB[key]) {
        questionnaireData.push([
          `B-${key.toUpperCase()}`,
          question,
          sectionB[key],
        ]);
      }
    }

    // Add Section C responses
    const sectionCQuestions: Record<string, string> = {
      q1: "Does the child interact with other children?",
      q2: "Can the child share toys with others?",
      q3: "Does the child communicate needs clearly?",
      q4: "Does the child show empathy toward others?",
      q5: "Can the child take turns in group activities?",
    };
    for (const [key, question] of Object.entries(sectionCQuestions)) {
      if (sectionC[key]) {
        questionnaireData.push([
          `C-${key.toUpperCase()}`,
          question,
          sectionC[key],
        ]);
      }
    }

    if (questionnaireData.length > 0) {
      doc.autoTable({
        startY: yPos,
        head: [["Code", "Question", "Response"]],
        body: questionnaireData,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [41, 98, 255],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 30 },
        },
      });
      yPos = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12;
    } else {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("No questionnaire data available.", 14, yPos);
      yPos += 10;
    }

    // ---- AI READINESS SCORES ----
    checkPageBreak(doc, yPos, 80);
    yPos = getYAfterPageBreak(doc, yPos, 80);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("AI Readiness Scores", 14, yPos);
    yPos += 2;

    // Readiness score banner
    const readinessColor = getReadinessColor(analysis.readinessScore);
    doc.setFillColor(...readinessColor);
    doc.roundedRect(14, yPos, pageWidth - 28, 20, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Overall Readiness Score: ${Math.round(analysis.readinessScore)} / 100`,
      pageWidth / 2,
      yPos + 13,
      { align: "center" }
    );
    yPos += 28;

    doc.setTextColor(0, 0, 0);

    // Video analysis scores
    doc.autoTable({
      startY: yPos,
      head: [["Category", "Score (1-10)", "Rating"]],
      body: [
        [
          "Sitting Ability",
          analysis.sittingScore.toFixed(1),
          getRatingLabel(analysis.sittingScore),
        ],
        [
          "Attention",
          analysis.attentionScore.toFixed(1),
          getRatingLabel(analysis.attentionScore),
        ],
        [
          "Hyperactivity (Inverse)",
          analysis.hyperactivityScore.toFixed(1),
          getRatingLabel(analysis.hyperactivityScore),
        ],
        [
          "Emotional Regulation",
          analysis.emotionalScore.toFixed(1),
          getRatingLabel(analysis.emotionalScore),
        ],
        [
          "Instruction Following",
          analysis.instructionScore.toFixed(1),
          getRatingLabel(analysis.instructionScore),
        ],
      ],
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 30, halign: "center" },
      },
    });

    yPos = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8;

    // Speech analysis scores
    doc.autoTable({
      startY: yPos,
      head: [["Speech Metric", "Score", "Rating"]],
      body: [
        [
          "Speech Clarity",
          analysis.speechClarity.toFixed(1),
          getRatingLabel(analysis.speechClarity),
        ],
        [
          "Vocabulary Level",
          analysis.vocabularyLevel.toFixed(1),
          getRatingLabel(analysis.vocabularyLevel),
        ],
        [
          "Response Confidence",
          analysis.responseConfidence.toFixed(1),
          getRatingLabel(analysis.responseConfidence),
        ],
        [
          "Response Delay (seconds)",
          analysis.responseDelay.toFixed(1),
          analysis.responseDelay <= 2 ? "Good" : analysis.responseDelay <= 4 ? "Moderate" : "Needs Support",
        ],
      ],
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 30, halign: "center" },
      },
    });

    yPos = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12;

    // ---- BEHAVIORAL ASSESSMENT ----
    checkPageBreak(doc, yPos, 70);
    yPos = getYAfterPageBreak(doc, yPos, 70);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Behavioral Assessment", 14, yPos);
    yPos += 2;

    doc.autoTable({
      startY: yPos,
      head: [],
      body: [
        ["Attention Level", analysis.attentionLevel || "N/A"],
        ["Instruction Following", analysis.instructionFollowing || "N/A"],
        ["Social Readiness", analysis.socialReadiness || "N/A"],
        ["Emotional Behavior", analysis.emotionalBehavior || "N/A"],
        ["Classroom Adaptability", analysis.classroomAdaptability || "N/A"],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, fillColor: [240, 244, 255] },
        1: { cellWidth: "auto" },
      },
    });

    yPos = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12;

    // ---- TEACHER RECOMMENDATIONS ----
    checkPageBreak(doc, yPos, 40);
    yPos = getYAfterPageBreak(doc, yPos, 40);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Teacher Recommendations", 14, yPos);
    yPos += 4;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const recommendation = analysis.teacherRecommendation || "No specific recommendations.";
    const splitRecommendation = doc.splitTextToSize(recommendation, pageWidth - 28);
    doc.text(splitRecommendation, 14, yPos);
    yPos += splitRecommendation.length * 5 + 10;

    // ---- RISK FLAGS ----
    if (riskFlags.length > 0) {
      checkPageBreak(doc, yPos, 40);
      yPos = getYAfterPageBreak(doc, yPos, 40);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(200, 50, 50);
      doc.text("Areas of Attention", 14, yPos);
      yPos += 4;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      for (const flag of riskFlags) {
        doc.setFillColor(255, 240, 240);
        doc.roundedRect(14, yPos - 4, pageWidth - 28, 8, 2, 2, "F");
        doc.text(`• ${flag}`, 18, yPos);
        yPos += 10;
      }
      yPos += 4;
    }

    // ---- ADMIN NOTES ----
    if (student.adminNotes.length > 0) {
      checkPageBreak(doc, yPos, 40);
      yPos = getYAfterPageBreak(doc, yPos, 40);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Admin Notes", 14, yPos);
      yPos += 2;

      const adminNotesData = student.adminNotes.map((note) => [
        note.action,
        note.note,
        new Date(note.createdAt).toLocaleDateString(),
      ]);

      doc.autoTable({
        startY: yPos,
        head: [["Action", "Note", "Date"]],
        body: adminNotesData,
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
          fillColor: [100, 100, 100],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 30 },
        },
      });

      yPos = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12;
    }

    // ---- VIDEO TASKS SUMMARY ----
    if (student.videos.length > 0) {
      checkPageBreak(doc, yPos, 40);
      yPos = getYAfterPageBreak(doc, yPos, 40);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Video Task Submissions", 14, yPos);
      yPos += 2;

      const videoData = student.videos.map((v) => [
        v.taskType,
        v.fileName,
        `${(v.fileSize / 1024 / 1024).toFixed(2)} MB`,
        `${v.duration.toFixed(1)}s`,
        new Date(v.uploadedAt).toLocaleDateString(),
      ]);

      doc.autoTable({
        startY: yPos,
        head: [["Task", "File Name", "Size", "Duration", "Uploaded"]],
        body: videoData,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [41, 98, 255],
          textColor: 255,
          fontStyle: "bold",
        },
      });

      yPos = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12;
    }

    // ---- FOOTER DISCLAIMER ----
    const footerY = doc.internal.pageSize.getHeight() - 25;
    doc.setFillColor(255, 245, 230);
    doc.rect(0, footerY - 5, pageWidth, 30, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 100, 0);
    doc.text(
      "DISCLAIMER: This is an AI-assisted educational readiness observation and NOT a medical diagnosis.",
      pageWidth / 2,
      footerY + 2,
      { align: "center" }
    );
    doc.text(
      "Results should be reviewed by qualified educators and used as one of multiple assessment tools.",
      pageWidth / 2,
      footerY + 8,
      { align: "center" }
    );

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Report generated on ${new Date().toLocaleString()} | Application ${student.applicationId}`,
      pageWidth / 2,
      footerY + 16,
      { align: "center" }
    );

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), "public", "uploads", "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save PDF file
    const fileName = `report_${student.applicationId}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    const relativePath = `/uploads/reports/${fileName}`;

    // Create or update Report record
    await db.report.upsert({
      where: { studentId },
      create: {
        studentId,
        filePath: relativePath,
        generatedAt: new Date(),
      },
      update: {
        filePath: relativePath,
        generatedAt: new Date(),
      },
    });

    // Return the PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="KRA_Report_${student.applicationId}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Types
// ============================================

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

// ============================================
// Helper Functions
// ============================================

function safeParseJSON(str: string): Record<string, string> {
  try {
    return JSON.parse(str || "{}");
  } catch {
    return {};
  }
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    now.getMonth() -
    birth.getMonth();
  return `${Math.floor(months / 12)} years ${months % 12} months`;
}

function getRatingLabel(score: number): string {
  if (score >= 7) return "Good";
  if (score >= 4) return "Moderate";
  return "Needs Support";
}

function getReadinessColor(score: number): [number, number, number] {
  if (score >= 75) return [34, 139, 34]; // Green
  if (score >= 50) return [255, 165, 0]; // Orange
  return [220, 50, 50]; // Red
}

function checkPageBreak(
  doc: jsPDF,
  yPos: number,
  requiredSpace: number
): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos + requiredSpace > pageHeight - 30) {
    doc.addPage();
  }
}

function getYAfterPageBreak(
  doc: jsPDF,
  yPos: number,
  requiredSpace: number
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos + requiredSpace > pageHeight - 30) {
    return 20;
  }
  return yPos;
}
