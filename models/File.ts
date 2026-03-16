import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFile extends Document {
    workspaceId: mongoose.Types.ObjectId;
    uploaderId: mongoose.Types.ObjectId;
    filename: string;
    originalName: string;
    url: string;
    mimetype: string;
    size: number;
    createdAt: Date;
}

const FileSchema = new Schema<IFile>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        url: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
    },
    { timestamps: true }
);

FileSchema.index({ originalName: 'text' });

export const File: Model<IFile> =
    mongoose.models.File ?? mongoose.model<IFile>('File', FileSchema);
