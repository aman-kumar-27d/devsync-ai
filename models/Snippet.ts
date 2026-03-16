import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISnippet extends Document {
    messageId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    code: string;
    language: string;
    aiExplanation?: string;
    createdAt: Date;
}

const SnippetSchema = new Schema<ISnippet>(
    {
        messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        code: { type: String, required: true },
        language: { type: String, default: 'plaintext' },
        aiExplanation: { type: String },
    },
    { timestamps: true }
);

// Avoid treating the `language` field as Mongo text-language override.
SnippetSchema.index({ code: 'text' }, { language_override: 'mongoLanguageOverride' });

export const Snippet: Model<ISnippet> =
    mongoose.models.Snippet ?? mongoose.model<ISnippet>('Snippet', SnippetSchema);
