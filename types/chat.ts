export interface MessageData {
    _id: string;
    content: string;
    type: string;
    senderId: { _id: string; username: string; avatarColor: string };
    reactions: { emoji: string; userIds: string[] }[];
    threadId?: string;
    deletedAt?: string;
    editedAt?: string;
    createdAt: string;
    channelId: string;
}
