import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkspace extends Document {
    name: string;
    ownerId: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    channels: mongoose.Types.ObjectId[];
    inviteToken: string;
    createdAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
    {
        name: { type: String, required: true },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
        inviteToken: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

export const Workspace: Model<IWorkspace> =
    mongoose.models.Workspace ?? mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
