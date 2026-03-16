// Membership and RBAC guards for workspace/channel access
import { Workspace } from '../models/Workspace';
import { Channel } from '../models/Channel';
import { Types } from 'mongoose';

/** Throws 403 if user is not a member of the workspace */
export async function assertWorkspaceMember(userId: string, workspaceId: string) {
    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) throw Object.assign(new Error('Workspace not found'), { status: 404 });
    if (!workspace.members.some((m: Types.ObjectId) => m.toString() === userId)) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    return workspace;
}

/** Throws 403 if user is not the owner of the workspace */
export async function assertWorkspaceOwner(userId: string, workspaceId: string) {
    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) throw Object.assign(new Error('Workspace not found'), { status: 404 });
    if (workspace.ownerId.toString() !== userId) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    return workspace;
}

/** Resolves a channel's workspaceId */
export async function resolveChannelWorkspace(channelId: string) {
    const channel = await Channel.findById(channelId).lean();
    if (!channel) throw Object.assign(new Error('Channel not found'), { status: 404 });
    return channel.workspaceId.toString();
}

/** Throws 403 if the two users do not share any workspace */
export async function assertUsersShareWorkspace(userId: string, peerId: string) {
    const sharedWorkspaceExists = await Workspace.exists({
        members: {
            $all: [new Types.ObjectId(userId), new Types.ObjectId(peerId)],
        },
    });

    if (!sharedWorkspaceExists) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
}
