import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
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
    globalWithMongoose.mongoose.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  globalWithMongoose.mongoose.conn = await globalWithMongoose.mongoose.promise;

  // Auto-generate demo admin once per cold start
  if (!globalWithMongoose.mongoose.seeded) {
    globalWithMongoose.mongoose.seeded = true;
    try {
      const { User } = await import('./models');
      const bcrypt = (await import('bcryptjs')).default;
      const adminExists = await User.findOne({ email: 'admin@school.com' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          email: 'admin@school.com',
          name: 'Demo Admin',
          password: hashedPassword,
          role: 'ADMIN'
        });
        console.log('Demo admin automatically generated.');
      }
    } catch (err) {
      console.error('Failed to generate demo admin:', err);
    }
  }

  return globalWithMongoose.mongoose.conn;
}
