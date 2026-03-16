import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { File } from '@/models/File';
import { assertWorkspaceMember } from '@/lib/guards';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'text/plain', 'text/markdown',
    'application/zip', 'application/json',
    'application/javascript', 'text/typescript', 'text/html', 'text/css',
]);

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const workspaceId = req.nextUrl.searchParams.get('workspaceId');
        if (!workspaceId) return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });

        await assertWorkspaceMember(user._id.toString(), workspaceId);

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 413 });
        }

        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return NextResponse.json({ error: 'File type not allowed' }, { status: 415 });
        }

        const ext = file.name.split('.').pop() ?? 'bin';
        // Sanitize filename to prevent path traversal
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext.replace(/[^a-zA-Z0-9]/g, '')}`;
        const uploadPath = join(UPLOAD_DIR, safeName);

        await mkdir(UPLOAD_DIR, { recursive: true });
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(uploadPath, buffer);

        const fileDoc = await File.create({
            workspaceId,
            uploaderId: user._id,
            filename: safeName,
            originalName: file.name.slice(0, 200),
            url: `/uploads/${safeName}`,
            mimetype: file.type,
            size: file.size,
        });

        return NextResponse.json({ file: fileDoc }, { status: 201 });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 404) {
            return NextResponse.json({ error: (err as Error).message }, { status });
        }
        console.error('[files/upload POST]', err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
