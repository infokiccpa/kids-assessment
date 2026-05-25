import { connectDB } from "@/lib/mongodb";
import { Student, Questionnaire } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { studentId, sectionA, sectionB, sectionC } = body;

    if (!studentId) {
      return NextResponse.json({ error: "Missing required field: studentId" }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const sectionAStr = typeof sectionA === "string" ? sectionA : JSON.stringify(sectionA || {});
    const sectionBStr = typeof sectionB === "string" ? sectionB : JSON.stringify(sectionB || {});
    const sectionCStr = typeof sectionC === "string" ? sectionC : JSON.stringify(sectionC || {});

    const questionnaire = await Questionnaire.findOneAndUpdate(
      { studentId: student._id.toString() },
      { sectionA: sectionAStr, sectionB: sectionBStr, sectionC: sectionCStr, completedAt: new Date() },
      { new: true, upsert: true }
    );

    await Student.findByIdAndUpdate(studentId, { status: "QUESTIONNAIRE", currentStep: 2 });

    return NextResponse.json({ questionnaire });
  } catch (error) {
    console.error("Error saving questionnaire:", error);
    return NextResponse.json({ error: "Failed to save questionnaire" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Missing required query parameter: studentId" }, { status: 400 });
    }

    const questionnaire = await Questionnaire.findOne({ studentId }).lean();
    if (!questionnaire) {
      return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 });
    }

    const result = {
      ...questionnaire,
      sectionA: JSON.parse(questionnaire.sectionA || "{}"),
      sectionB: JSON.parse(questionnaire.sectionB || "{}"),
      sectionC: JSON.parse(questionnaire.sectionC || "{}"),
    };

    return NextResponse.json({ questionnaire: result });
  } catch (error) {
    console.error("Error fetching questionnaire:", error);
    return NextResponse.json({ error: "Failed to fetch questionnaire" }, { status: 500 });
  }
}
