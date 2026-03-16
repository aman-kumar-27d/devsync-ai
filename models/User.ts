import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    email: string;
    username: string;
    usernameLowercase: string;
    passwordHash: string;
    avatarColor: string;
    workspaces: mongoose.Types.ObjectId[];
    lastSeen: Date;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        username: { type: String, required: true, unique: true, trim: true },
        usernameLowercase: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, required: true },
        avatarColor: { type: String, default: '#6366f1' },
        workspaces: [{ type: Schema.Types.ObjectId, ref: 'Workspace' }],
        lastSeen: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

UserSchema.index({ username: 'text', email: 'text' });

export const User: Model<IUser> =
    mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
