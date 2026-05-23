import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// POST /api/videos - Upload video
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const studentId = formData.get("studentId") as string;
    const taskType = formData.get("taskType") as string;
    const file = formData.get("video") as File | null;

    if (!studentId || !taskType) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, taskType" },
        { status: 400 }
      );
    }

    // Validate taskType
    const validTaskTypes = ["TASK1", "TASK2", "TASK3", "TASK4"];
    if (!validTaskTypes.includes(taskType)) {
      return NextResponse.json(
        { error: `Invalid taskType. Must be one of: ${validTaskTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Missing video file" },
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

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate filename
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "webm";
    const fileName = `${studentId}_${taskType}_${timestamp}.${ext}`;
    const filePath = join(uploadsDir, fileName);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);

    // Create or update video record (upsert on studentId+taskType unique constraint)
    const video = await db.video.upsert({
      where: {
        studentId_taskType: {
          studentId,
          taskType,
        },
      },
      update: {
        filePath: `/uploads/${fileName}`,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
      },
      create: {
        studentId,
        taskType,
        filePath: `/uploads/${fileName}`,
        fileName: file.name,
        fileSize: file.size,
        duration: 0,
      },
    });

    // Check if all 4 videos are uploaded
    const videoCount = await db.video.count({
      where: { studentId },
    });

    if (videoCount >= 4) {
      await db.student.update({
        where: { id: studentId },
        data: {
          status: "SUBMITTED",
          currentStep: 4,
        },
      });
    } else {
      // Ensure student is at least in VIDEOS status
      if (student.status === "QUESTIONNAIRE" || student.status === "DRAFT") {
        await db.student.update({
          where: { id: studentId },
          data: {
            status: "VIDEOS",
            currentStep: 3,
          },
        });
      }
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}

// GET /api/videos - Get videos for a student
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

    const videos = await db.video.findMany({
      where: { studentId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
