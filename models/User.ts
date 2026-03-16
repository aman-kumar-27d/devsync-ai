import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    guestId: string;
    username: string;
    avatarColor: string;
    workspaces: mongoose.Types.ObjectId[];
    lastSeen: Date;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        guestId: { type: String, required: true, unique: true, index: true },
        username: { type: String, required: true },
        avatarColor: { type: String, default: '#6366f1' },
        workspaces: [{ type: Schema.Types.ObjectId, ref: 'Workspace' }],
        lastSeen: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const User: Model<IUser> =
    mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
