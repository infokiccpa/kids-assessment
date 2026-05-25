import { connectDB } from "@/lib/mongodb";
import { Student, Questionnaire, Video, AIAnalysis, AdminNote, User } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

// GET /api/students/[id] - Get single student with all related data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const student = await Student.findById(id).lean();
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const studentId = student._id.toString();

    // Fetch all related data in parallel
    const [questionnaire, videos, aiAnalysis, adminNotesRaw] = await Promise.all([
      Questionnaire.findOne({ studentId }).lean(),
      Video.find({ studentId }).sort({ uploadedAt: -1 }).lean(),
      AIAnalysis.findOne({ studentId }).lean(),
      AdminNote.find({ studentId }).sort({ createdAt: -1 }).lean(),
    ]);

    // Enrich admin notes with admin user info
    const adminIds = [...new Set(adminNotesRaw.map((n) => n.adminId))];
    const adminUsers = await User.find({ _id: { $in: adminIds } })
      .select("_id name email")
      .lean();
    const adminMap = new Map(adminUsers.map((u) => [u._id.toString(), u]));

    const adminNotes = adminNotesRaw.map((note) => ({
      ...note,
      admin: adminMap.get(note.adminId) || null,
    }));

    return NextResponse.json({
      student: {
        ...student,
        id: studentId,
        questionnaire,
        videos,
        aiAnalysis,
        adminNotes,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}
