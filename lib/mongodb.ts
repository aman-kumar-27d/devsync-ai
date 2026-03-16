import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('Please define MONGODB_URI in .env.local');

// Module-level cache to avoid creating multiple connections in dev (hot-reload)
interface MongoCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var _mongoCache: MongoCache;
}

const cached: MongoCache = global._mongoCache ?? { conn: null, promise: null };
global._mongoCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
