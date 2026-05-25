import { connectDB } from "@/lib/mongodb";
import { Student, AIAnalysis } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

// GET /api/students - List students
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    if (role === "ADMIN") {
      const filter = status ? { status } : {};
      const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
      const studentIds = students.map((s) => s._id.toString());
      const analyses = await AIAnalysis.find({ studentId: { $in: studentIds } })
        .select("studentId readinessScore riskFlags")
        .lean();
      const analysisMap = new Map(analyses.map((a) => [a.studentId, a]));

      const result = students.map((s) => {
        const id = s._id.toString();
        const analysis = analysisMap.get(id);
        return {
          id,
          applicationId: s.applicationId,
          childName: s.childName,
          schoolApplied: s.schoolApplied,
          status: s.status,
          readinessScore: analysis?.readinessScore ?? null,
          riskFlags: analysis?.riskFlags ?? "[]",
          createdAt: s.createdAt,
        };
      });

      return NextResponse.json({ students: result });
    }

    if (parentId) {
      const filter: Record<string, unknown> = { parentId };
      if (status) filter.status = status;
      const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
      const result = students.map((s) => ({
        id: s._id.toString(),
        applicationId: s.applicationId,
        childName: s.childName,
        status: s.status,
        createdAt: s.createdAt,
      }));
      return NextResponse.json({ students: result });
    }

    const filter = status ? { status } : {};
    const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
    const result = students.map((s) => ({
      id: s._id.toString(),
      applicationId: s.applicationId,
      childName: s.childName,
      status: s.status,
      createdAt: s.createdAt,
    }));
    return NextResponse.json({ students: result });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// POST /api/students - Create new student application
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      parentId, childName, dateOfBirth, gender, nationality,
      languagesSpoken, previousSchool, specialMedicalNotes,
      fatherName, motherName, mobileNumber, parentEmail,
      address, schoolApplied, gradeApplied, consentGiven,
    } = body;

    if (!parentId || !childName || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: "Missing required fields: parentId, childName, dateOfBirth, gender" },
        { status: 400 }
      );
    }

    // Generate unique applicationId
    let applicationId = "";
    let isUnique = false;
    while (!isUnique) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      applicationId = `KRA-${randomNum}`;
      const existing = await Student.findOne({ applicationId });
      if (!existing) isUnique = true;
    }

    const student = await Student.create({
      applicationId,
      parentId,
      childName,
      dateOfBirth,
      gender,
      nationality: nationality || "",
      languagesSpoken: languagesSpoken || "",
      previousSchool: previousSchool || "",
      specialMedicalNotes: specialMedicalNotes || "",
      fatherName: fatherName || "",
      motherName: motherName || "",
      mobileNumber: mobileNumber || "",
      parentEmail: parentEmail || "",
      address: address || "",
      schoolApplied: schoolApplied || "",
      gradeApplied: gradeApplied || "",
      consentGiven: consentGiven || false,
      status: "DRAFT",
      currentStep: 1,
    });

    return NextResponse.json({ student: { ...student.toObject(), id: student._id.toString() } }, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}

// PUT /api/students - Update student
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "childName", "dateOfBirth", "gender", "nationality", "languagesSpoken",
      "previousSchool", "specialMedicalNotes", "fatherName", "motherName",
      "mobileNumber", "parentEmail", "address", "schoolApplied",
      "gradeApplied", "consentGiven", "status", "currentStep",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field];
      }
    }

    const student = await Student.findByIdAndUpdate(id, data, { new: true });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ student: { ...student.toObject(), id: student._id.toString() } });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}
