import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, adminId, action, note } = body;

    // Validate required fields
    if (!studentId || !adminId || !action) {
      return NextResponse.json(
        { error: "studentId, adminId, and action are required" },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ["ACCEPT", "HOLD", "REASSESS", "REJECT"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Verify admin exists and has ADMIN role
    const admin = await db.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    if (admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can perform this action" },
        { status: 403 }
      );
    }

    // Map action to student status
    const statusMap: Record<string, string> = {
      ACCEPT: "ACCEPTED",
      HOLD: "HOLD",
      REASSESS: "REASSESS",
      REJECT: "REJECTED",
    };

    const newStatus = statusMap[action];

    // Create admin note
    const adminNote = await db.adminNote.create({
      data: {
        studentId,
        adminId,
        note: note || "",
        action,
      },
    });

    // Update student status
    await db.student.update({
      where: { id: studentId },
      data: { status: newStatus },
    });

    // Create notification for the parent
    const notificationMessages: Record<string, { title: string; message: string }> = {
      ACCEPT: {
        title: "Application Accepted",
        message: `We are pleased to inform you that ${student.childName}'s application has been accepted. Welcome to the school!`,
      },
      HOLD: {
        title: "Application On Hold",
        message: `${student.childName}'s application is currently on hold. Our team will follow up with additional information shortly.`,
      },
      REASSESS: {
        title: "Reassessment Required",
        message: `An additional assessment has been requested for ${student.childName}. Please check for upcoming scheduling details.`,
      },
      REJECT: {
        title: "Application Update",
        message: `We regret to inform you that ${student.childName}'s application was not successful at this time. Please contact the school for further guidance.`,
      },
    };

    const notificationContent = notificationMessages[action];

    await db.notification.create({
      data: {
        userId: student.parentId,
        type: "STATUS_CHANGE",
        title: notificationContent.title,
        message: notificationContent.message,
      },
    });

    return NextResponse.json({
      success: true,
      adminNote,
      newStatus,
    });
  } catch (error) {
    console.error("Admin action error:", error);
    return NextResponse.json(
      { error: "Failed to process admin action" },
      { status: 500 }
    );
  }
}
