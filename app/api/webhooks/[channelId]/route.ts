import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/models/Message';
import { Channel } from '@/models/Channel';
import { Workspace } from '@/models/Workspace';

export const dynamic = 'force-dynamic';

// POST /api/webhooks/:channelId
// Accepts a signed CI/CD payload and inserts a system message into the channel.
//
// Expected body: { text: string, title?: string, secret: string }
// The caller must supply the webhook secret configured as WEBHOOK_SECRET env var
// (or a per-channel secret stored on the Channel doc in future iterations).
//
// Returns 201 with the created message on success.

export async function POST(
    req: NextRequest,
    { params }: { params: { channelId: string } }
) {
    try {
        const { channelId } = params;
        if (!mongoose.isValidObjectId(channelId)) {
            return NextResponse.json({ error: 'Invalid channelId' }, { status: 400 });
        }

        // Constant-time secret comparison to prevent timing attacks
        const webhookSecret = process.env.WEBHOOK_SECRET ?? '';
        let body: { text?: string; title?: string; secret?: string };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { text, title, secret = '' } = body;

        if (!webhookSecret || secret.length !== webhookSecret.length) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // Constant-time comparison
        let diff = 0;
        for (let i = 0; i < webhookSecret.length; i++) {
            diff |= webhookSecret.charCodeAt(i) ^ secret.charCodeAt(i);
        }
        if (diff !== 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return NextResponse.json({ error: 'text is required' }, { status: 400 });
        }

        await connectDB();

        const channel = await Channel.findById(channelId).lean();
        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
        }

        const workspace = await Workspace.findById(channel.workspaceId).lean();
        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        // Create a system message attributed to a synthetic sender (workspace owner)
        const content = title ? `**[${title}]** ${text.trim()}` : text.trim();
        const message = await Message.create({
            channelId,
            senderId: workspace.ownerId,
            content: content.slice(0, 4000),
            type: 'ai', // reuse 'ai' type for system/bot messages
        });

        // Broadcast via Socket.io if available
        if (global.io) {
            global.io.to(`channel:${channelId}`).emit('message:new', {
                ...message.toObject(),
                _id: message._id.toString(),
            });
        }

        return NextResponse.json({ message }, { status: 201 });
    } catch (err) {
        console.error('[webhooks POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
