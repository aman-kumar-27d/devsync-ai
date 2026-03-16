import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReaction {
    emoji: string;
    userIds: mongoose.Types.ObjectId[];
}

export interface IMessage extends Document {
    channelId?: mongoose.Types.ObjectId;
    dmPairId?: string; // sorted 'userId1-userId2'
    senderId: mongoose.Types.ObjectId;
    content: string;
    type: 'text' | 'code' | 'file' | 'ai';
    reactions: IReaction[];
    threadId?: mongoose.Types.ObjectId;
    deletedAt?: Date;
    editedAt?: Date;
    createdAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
    {
        emoji: { type: String, required: true },
        userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { _id: false }
);

const MessageSchema = new Schema<IMessage>(
    {
        channelId: { type: Schema.Types.ObjectId, ref: 'Channel', index: true },
        dmPairId: { type: String, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        type: { type: String, enum: ['text', 'code', 'file', 'ai'], default: 'text' },
        reactions: { type: [ReactionSchema], default: [] },
        threadId: { type: Schema.Types.ObjectId, ref: 'Message' },
        deletedAt: { type: Date },
        editedAt: { type: Date },
    },
    { timestamps: true }
);

MessageSchema.index({ content: 'text' });

export const Message: Model<IMessage> =
    mongoose.models.Message ?? mongoose.model<IMessage>('Message', MessageSchema);
