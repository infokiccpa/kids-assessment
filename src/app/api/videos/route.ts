import { connectDB } from "@/lib/mongodb";
import { Student, Video } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();
    const studentId = formData.get("studentId") as string;
    const taskType = formData.get("taskType") as string;
    const file = formData.get("video") as File | null;

    if (!studentId || !taskType) {
      return NextResponse.json({ error: "Missing required fields: studentId, taskType" }, { status: 400 });
    }

    const validTaskTypes = ["TASK1", "TASK2", "TASK3", "TASK4"];
    if (!validTaskTypes.includes(taskType)) {
      return NextResponse.json({ error: `Invalid taskType. Must be one of: ${validTaskTypes.join(", ")}` }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Missing video file" }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "webm";
    const fileName = `${studentId}_${taskType}_${timestamp}.${ext}`;
    const filePath = join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);

    const video = await Video.findOneAndUpdate(
      { studentId: student._id.toString(), taskType },
      {
        filePath: `/uploads/${fileName}`,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    const videoCount = await Video.countDocuments({ studentId: student._id.toString() });

    if (videoCount >= 4) {
      await Student.findByIdAndUpdate(studentId, { status: "SUBMITTED", currentStep: 4 });
    } else if (student.status === "QUESTIONNAIRE" || student.status === "DRAFT") {
      await Student.findByIdAndUpdate(studentId, { status: "VIDEOS", currentStep: 3 });
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
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

    const videos = await Video.find({ studentId }).sort({ uploadedAt: -1 }).lean();
    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
