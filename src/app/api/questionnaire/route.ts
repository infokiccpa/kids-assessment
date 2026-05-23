import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/questionnaire - Save questionnaire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, sectionA, sectionB, sectionC } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Missing required field: studentId" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Stringify sections for SQLite storage
    const sectionAStr = typeof sectionA === "string" ? sectionA : JSON.stringify(sectionA || {});
    const sectionBStr = typeof sectionB === "string" ? sectionB : JSON.stringify(sectionB || {});
    const sectionCStr = typeof sectionC === "string" ? sectionC : JSON.stringify(sectionC || {});

    // Upsert questionnaire
    const questionnaire = await db.questionnaire.upsert({
      where: { studentId },
      update: {
        sectionA: sectionAStr,
        sectionB: sectionBStr,
        sectionC: sectionCStr,
        completedAt: new Date(),
      },
      create: {
        studentId,
        sectionA: sectionAStr,
        sectionB: sectionBStr,
        sectionC: sectionCStr,
        completedAt: new Date(),
      },
    });

    // Update student status to QUESTIONNAIRE and currentStep to 2
    await db.student.update({
      where: { id: studentId },
      data: {
        status: "QUESTIONNAIRE",
        currentStep: 2,
      },
    });

    return NextResponse.json({ questionnaire });
  } catch (error) {
    console.error("Error saving questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to save questionnaire" },
      { status: 500 }
    );
  }
}

// GET /api/questionnaire - Get questionnaire for a student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Missing required query parameter: studentId" },
        { status: 400 }
      );
    }

    const questionnaire = await db.questionnaire.findUnique({
      where: { studentId },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // Parse JSON strings back to objects
    const result = {
      ...questionnaire,
      sectionA: JSON.parse(questionnaire.sectionA),
      sectionB: JSON.parse(questionnaire.sectionB),
      sectionC: JSON.parse(questionnaire.sectionC),
    };

    return NextResponse.json({ questionnaire: result });
  } catch (error) {
    console.error("Error fetching questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaire" },
      { status: 500 }
    );
  }
}
