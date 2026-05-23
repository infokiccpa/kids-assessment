import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/students - List students
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    if (role === "ADMIN") {
      // Admin can see all students with optional status filter
      const students = await db.student.findMany({
        where: status ? { status } : undefined,
        include: {
          aiAnalysis: {
            select: { readinessScore: true, riskFlags: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const result = students.map((s) => ({
        id: s.id,
        applicationId: s.applicationId,
        childName: s.childName,
        schoolApplied: s.schoolApplied,
        status: s.status,
        readinessScore: s.aiAnalysis?.readinessScore ?? null,
        riskFlags: s.aiAnalysis?.riskFlags ?? "[]",
        createdAt: s.createdAt,
      }));

      return NextResponse.json({ students: result });
    }

    if (parentId) {
      // Get students for a specific parent
      const students = await db.student.findMany({
        where: {
          parentId,
          ...(status ? { status } : {}),
        },
        include: {
          aiAnalysis: {
            select: { readinessScore: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const result = students.map((s) => ({
        id: s.id,
        applicationId: s.applicationId,
        childName: s.childName,
        status: s.status,
        readinessScore: s.aiAnalysis?.readinessScore ?? null,
        createdAt: s.createdAt,
      }));

      return NextResponse.json({ students: result });
    }

    // Default: return all students (with optional status filter)
    const students = await db.student.findMany({
      where: status ? { status } : undefined,
      include: {
        aiAnalysis: {
          select: { readinessScore: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = students.map((s) => ({
      id: s.id,
      applicationId: s.applicationId,
      childName: s.childName,
      status: s.status,
      readinessScore: s.aiAnalysis?.readinessScore ?? null,
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
    const body = await request.json();

    const {
      parentId,
      childName,
      dateOfBirth,
      gender,
      nationality,
      languagesSpoken,
      previousSchool,
      specialMedicalNotes,
      fatherName,
      motherName,
      mobileNumber,
      parentEmail,
      address,
      schoolApplied,
      gradeApplied,
      consentGiven,
    } = body;

    // Validate required fields
    if (!parentId || !childName || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: "Missing required fields: parentId, childName, dateOfBirth, gender" },
        { status: 400 }
      );
    }

    // Generate unique applicationId
    let applicationId: string;
    let isUnique = false;

    while (!isUnique) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      applicationId = `KRA-${randomNum}`;

      const existing = await db.student.findUnique({
        where: { applicationId },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    const student = await db.student.create({
      data: {
        applicationId: applicationId!,
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
      },
    });

    return NextResponse.json({ student }, { status: 201 });
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
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Check if student exists
    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const allowedFields = [
      "childName",
      "dateOfBirth",
      "gender",
      "nationality",
      "languagesSpoken",
      "previousSchool",
      "specialMedicalNotes",
      "fatherName",
      "motherName",
      "mobileNumber",
      "parentEmail",
      "address",
      "schoolApplied",
      "gradeApplied",
      "consentGiven",
      "status",
      "currentStep",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field];
      }
    }

    const student = await db.student.update({
      where: { id },
      data,
    });

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}
