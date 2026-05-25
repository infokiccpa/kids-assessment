import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Student, User, AdminNote, Notification } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { studentId, adminId, action, note } = body;

    if (!studentId || !adminId || !action) {
      return NextResponse.json(
        { error: "studentId, adminId, and action are required" },
        { status: 400 }
      );
    }

    const validActions = ["ACCEPT", "HOLD", "REASSESS", "REJECT"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const admin = await User.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    if (admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can perform this action" },
        { status: 403 }
      );
    }

    const statusMap: Record<string, string> = {
      ACCEPT: "ACCEPTED",
      HOLD: "HOLD",
      REASSESS: "REASSESS",
      REJECT: "REJECTED",
    };
    const newStatus = statusMap[action];

    const adminNote = await AdminNote.create({
      studentId: student._id.toString(),
      adminId: admin._id.toString(),
      note: note || "",
      action,
    });

    await Student.findByIdAndUpdate(studentId, { status: newStatus });

    const notificationMessages: Record<string, { title: string; message: string }> = {
      ACCEPT: { title: "Application Accepted", message: `We are pleased to inform you that ${student.childName}'s application has been accepted.` },
      HOLD: { title: "Application On Hold", message: `${student.childName}'s application is currently on hold.` },
      REASSESS: { title: "Reassessment Required", message: `An additional assessment has been requested for ${student.childName}.` },
      REJECT: { title: "Application Update", message: `We regret to inform you that ${student.childName}'s application was not successful at this time.` },
    };

    const notificationContent = notificationMessages[action];
    await Notification.create({
      userId: student.parentId,
      type: "STATUS_CHANGE",
      title: notificationContent.title,
      message: notificationContent.message,
    });

    return NextResponse.json({ success: true, adminNote, newStatus });
  } catch (error) {
    console.error("Admin action error:", error);
    return NextResponse.json(
      { error: "Failed to process admin action" },
      { status: 500 }
    );
  }
}
