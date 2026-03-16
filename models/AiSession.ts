import mongoose, { Schema, Document, Model } from 'mongoose';
import { AiMode } from '@/lib/promptEngine';

export interface IAiHistoryEntry {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface IAiSession extends Document {
    userId: mongoose.Types.ObjectId;
    workspaceId?: mongoose.Types.ObjectId;
    mode: AiMode;
    history: IAiHistoryEntry[];
    updatedAt: Date;
}

const AiHistoryEntrySchema = new Schema<IAiHistoryEntry>(
    {
        role: { type: String, enum: ['user', 'model'], required: true },
        parts: [{ text: { type: String, required: true } }],
    },
    { _id: false }
);

const AiSessionSchema = new Schema<IAiSession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
        mode: {
            type: String,
            enum: ['chat', 'codegen', 'bugfix', 'explain', 'docs', 'refactor'],
            default: 'chat',
        },
        history: { type: [AiHistoryEntrySchema], default: [] },
    },
    { timestamps: true }
);

export const AiSession: Model<IAiSession> =
    mongoose.models.AiSession ?? mongoose.model<IAiSession>('AiSession', AiSessionSchema);
