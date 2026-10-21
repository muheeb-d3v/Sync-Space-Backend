import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient is required']
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: [true, 'Workspace is required']
        },
        channelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel'
        },
        type: {
            type: String,
            enum: ['dm', 'mention', 'system'],
            required: [true, 'Notification type is required']
        },
        title: {
            type: String,
            required: [true, 'Notification title is required']
        },
        body: {
            type: String,
            default: ''
        },
        link: {
            type: String,
            default: ''
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
