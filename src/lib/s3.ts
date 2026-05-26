import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

// ============================================
// S3 Client — singleton
// ============================================
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME || "";

// ============================================
// Upload a Buffer to S3
// Returns the S3 object key (for DB storage)
// ============================================
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<{ key: string }> {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return { key };
}

// ============================================
// Download an object from S3 as a Buffer
// Used by analyze route to feed videos to Gemini
// ============================================
export async function downloadFromS3(key: string): Promise<Buffer> {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");

  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );

  if (!response.Body) throw new Error(`S3 object not found: ${key}`);

  // Convert readable stream to Buffer
  const stream = response.Body as Readable;
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

// ============================================
// Generate a pre-signed URL for secure playback
// Default expiry: 1 hour (3600 seconds)
// ============================================
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

// ============================================
// Delete an object from S3 (cleanup on re-upload)
// ============================================
export async function deleteFromS3(key: string): Promise<void> {
  if (!BUCKET) return; // gracefully skip if not configured

  await s3Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

// ============================================
// Build the S3 key for a video upload
// Pattern: videos/{studentId}/{taskType}_{timestamp}.{ext}
// ============================================
export function buildVideoKey(
  studentId: string,
  taskType: string,
  fileName: string
): string {
  const ext = fileName.split(".").pop() || "webm";
  const timestamp = Date.now();
  return `videos/${studentId}/${taskType}_${timestamp}.${ext}`;
}
