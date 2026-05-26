import { connectDB } from "@/lib/mongodb";
import { Student, Video } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";
import { uploadToS3, deleteFromS3, buildVideoKey, getPresignedUrl } from "@/lib/s3";

// ============================================
// POST /api/videos — Upload video to AWS S3
// ============================================
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();
    const studentId = formData.get("studentId") as string;
    const taskType  = formData.get("taskType")  as string;
    const file      = formData.get("video")     as File | null;

    if (!studentId || !taskType) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, taskType" },
        { status: 400 }
      );
    }

    const validTaskTypes = ["TASK1", "TASK2", "TASK3", "TASK4"];
    if (!validTaskTypes.includes(taskType)) {
      return NextResponse.json(
        { error: `Invalid taskType. Must be one of: ${validTaskTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: "Missing video file" }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Duration sent by the browser (extracted via HTMLVideoElement.duration before upload)
    const durationRaw = formData.get("duration");
    const duration = durationRaw ? Math.round(parseFloat(durationRaw as string)) : 0;

    // Convert file to Buffer
    const buffer   = Buffer.from(await file.arrayBuffer());
    const ext      = file.name.split(".").pop() || "webm";
    const mimeType = getMimeType(ext);

    // Build S3 key and upload
    const s3Key = buildVideoKey(studentId, taskType, file.name);
    await uploadToS3(buffer, s3Key, mimeType);

    // Generate a 1-hour pre-signed URL for immediate playback in the browser
    const s3Url = await getPresignedUrl(s3Key, 3600);

    // If this task had a previous upload, delete the old S3 object
    const existing = await Video.findOne({
      studentId: student._id.toString(),
      taskType,
    }).lean() as { s3Key?: string } | null;

    if (existing?.s3Key && existing.s3Key !== s3Key) {
      await deleteFromS3(existing.s3Key).catch((e) =>
        console.warn("[S3] Could not delete old object:", e)
      );
    }

    // Upsert DB record
    const video = await Video.findOneAndUpdate(
      { studentId: student._id.toString(), taskType },
      {
        s3Key,
        s3Url,
        filePath: "",           // legacy field — cleared for new uploads
        fileName: file.name,
        fileSize: file.size,
        duration: isNaN(duration) ? 0 : duration,
        uploadedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    // Update student progress
    const videoCount = await Video.countDocuments({
      studentId: student._id.toString(),
    });

    if (videoCount >= 4) {
      await Student.findByIdAndUpdate(studentId, {
        status: "SUBMITTED",
        currentStep: 4,
      });
    } else if (
      student.status === "QUESTIONNAIRE" ||
      student.status === "DRAFT"
    ) {
      await Student.findByIdAndUpdate(studentId, {
        status: "VIDEOS",
        currentStep: 3,
      });
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
  }
}

// ============================================
// GET /api/videos?studentId=xxx
// Returns videos with fresh pre-signed URLs
// ============================================
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Missing required query parameter: studentId" },
        { status: 400 }
      );
    }

    const videos = (await Video.find({ studentId })
      .sort({ uploadedAt: -1 })
      .lean()) as unknown as Array<{ s3Key?: string; s3Url?: string; [key: string]: unknown }>;

    // Refresh pre-signed URLs (they expire after 1h — regenerate on GET)
    const videosWithFreshUrls = await Promise.all(
      videos.map(async (v) => {
        if (v.s3Key) {
          try {
            v.s3Url = await getPresignedUrl(v.s3Key, 3600);
          } catch {
            // keep existing url if refresh fails
          }
        }
        // For legacy local uploads, keep filePath as-is
        return v;
      })
    );

    return NextResponse.json({ videos: videosWithFreshUrls });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

// ============================================
// Map file extension → MIME type
// ============================================
function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    mp4:  "video/mp4",
    webm: "video/webm",
    mov:  "video/quicktime",
    avi:  "video/x-msvideo",
    mkv:  "video/x-matroska",
    ogg:  "video/ogg",
    m4v:  "video/mp4",
    "3gp":"video/3gpp",
  };
  return map[ext.toLowerCase()] || "video/webm";
}
