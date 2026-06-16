import mongoose from 'mongoose';

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  return uri;
}

// Cached connection for Next.js hot-reload
const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null; seeded?: boolean };
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null, seeded: false };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (globalWithMongoose.mongoose.conn) {
    return globalWithMongoose.mongoose.conn;
  }

  if (!globalWithMongoose.mongoose.promise) {
    globalWithMongoose.mongoose.promise = mongoose
      .connect(getMongoUri(), {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .catch((err) => {
        globalWithMongoose.mongoose.promise = null;
        throw err;
      });
  }

  globalWithMongoose.mongoose.conn = await globalWithMongoose.mongoose.promise;

  if (!globalWithMongoose.mongoose.seeded) {
    globalWithMongoose.mongoose.seeded = true;
    try {
      const { ensureDemoAdmin } = await import("./seed-demo-admin");
      const result = await ensureDemoAdmin();
      if (result.created) {
        console.log("Demo admin automatically generated in MongoDB.");
      }
    } catch (err) {
      console.error("Failed to generate demo admin:", err);
    }
  }

  return globalWithMongoose.mongoose.conn;
}
