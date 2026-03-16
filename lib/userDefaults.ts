import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Workspace } from '@/models/Workspace';
import { Channel } from '@/models/Channel';

export const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

export function getRandomAvatarColor() {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export async function ensureDefaultWorkspace(ownerId?: mongoose.Types.ObjectId) {
    const defaultWorkspace = await Workspace.findOne({ name: 'General' }).lean();
    if (defaultWorkspace) return defaultWorkspace;

    const workspaceOwnerId = ownerId ?? new mongoose.Types.ObjectId();
    const createdWorkspace = await Workspace.create({
        name: 'General',
        ownerId: workspaceOwnerId,
        members: ownerId ? [ownerId] : [],
        channels: [],
        inviteToken: uuidv4(),
    });

    const generalChannel = await Channel.create({
        workspaceId: createdWorkspace._id,
        name: 'general',
        type: 'text',
    });

    const randomChannel = await Channel.create({
        workspaceId: createdWorkspace._id,
        name: 'random',
        type: 'text',
    });

    await Workspace.findByIdAndUpdate(createdWorkspace._id, {
        $set: { channels: [generalChannel._id, randomChannel._id] },
    });

    return Workspace.findById(createdWorkspace._id).lean();
}
