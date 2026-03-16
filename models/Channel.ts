import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChannel extends Document {
    workspaceId: mongoose.Types.ObjectId;
    name: string;
    type: 'text' | 'announce';
    createdAt: Date;
}

const ChannelSchema = new Schema<IChannel>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['text', 'announce'], default: 'text' },
    },
    { timestamps: true }
);

export const Channel: Model<IChannel> =
    mongoose.models.Channel ?? mongoose.model<IChannel>('Channel', ChannelSchema);
