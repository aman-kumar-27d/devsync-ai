import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
    recipientId: mongoose.Types.ObjectId;
    type: 'mention' | 'reply' | 'system';
    messageId?: mongoose.Types.ObjectId;
    channelId?: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, enum: ['mention', 'reply', 'system'], required: true },
        messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
        channelId: { type: Schema.Types.ObjectId, ref: 'Channel' },
        senderId: { type: Schema.Types.ObjectId, ref: 'User' },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Notification: Model<INotification> =
    mongoose.models.Notification ?? mongoose.model<INotification>('Notification', NotificationSchema);
