import { StatusCodes } from 'http-status-codes';

import workspaceRepository from '../repositories/workspaceRepository.js';
import Notification from '../schema/notification.js';
import User from '../schema/user.js';
import { customErrorResponse } from '../utils/common/responseObjects.js';

const truncate = (text = '', max = 160) =>
    text.length > max ? `${text.slice(0, max - 1)}…` : text;

/**
 * Creates notifications for a newly persisted message.
 *
 * - DM messages notify the other participant.
 * - Workspace channel messages notify every workspace member mentioned with
 *   `@username` (the sender is never notified).
 *
 * Notification failures must never break message sending, so everything is
 * swallowed after being logged.
 */
export const createMessageNotifications = async (message, channel) => {
    try {
        const actor = message.senderId;
        const actorId = actor?._id ?? actor;
        const actorName = actor?.username || 'Someone';
        const workspaceId = channel.workspaceId;
        const base = {
            actorId,
            workspaceId,
            channelId: channel._id,
            body: truncate(message.body || '')
        };

        if (channel.type === 'dm') {
            const recipientId = (channel.members ?? []).find(
                (memberId) => String(memberId) !== String(actorId)
            );

            if (!recipientId) return;

            await Notification.create({
                ...base,
                recipientId,
                type: 'dm',
                title: `${actorName} sent you a direct message`,
                link: `/workspaces/${workspaceId}/dms/${channel._id}`
            });
            return;
        }

        const mentions = [
            ...new Set(
                [
                    ...String(message.body || '').matchAll(
                        /(?:^|\s)@([a-zA-Z0-9]+)/g
                    )
                ].map((match) => match[1])
            )
        ];

        if (mentions.length === 0) return;

        const workspace = await workspaceRepository.getById(workspaceId);
        const memberIds = new Set(
            (workspace?.members ?? []).map((member) => String(member.memberId))
        );

        const mentionedUsers = await User.find({
            username: { $in: mentions }
        }).select('_id username');

        const recipients = mentionedUsers.filter(
            (user) =>
                memberIds.has(String(user._id)) &&
                String(user._id) !== String(actorId)
        );

        if (recipients.length === 0) return;

        await Notification.insertMany(
            recipients.map((user) => ({
                ...base,
                recipientId: user._id,
                type: 'mention',
                title: `${actorName} mentioned you in #${channel.name}`,
                link: `/workspaces/${workspaceId}/channels/${channel._id}`
            }))
        );
    } catch (error) {
        console.error(
            '[WARNING] Could not create message notifications:',
            error?.message || error
        );
    }
};

export const notifyMemberAdded = async ({ workspaceId, workspaceName, memberId }) => {
    try {
        await Notification.create({
            recipientId: memberId,
            workspaceId,
            type: 'system',
            title: `You joined ${workspaceName}`,
            body: 'You can now browse channels and start chatting.',
            link: `/workspaces/${workspaceId}`
        });
    } catch (error) {
        console.error(
            '[WARNING] Could not create workspace notification:',
            error?.message || error
        );
    }
};

export const listNotificationsService = async (userId, filter = 'all') => {
    const query = { recipientId: userId };

    if (filter === 'unread') {
        query.isRead = false;
    } else if (['dm', 'mention', 'system'].includes(filter)) {
        query.type = filter;
    }

    return Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('actorId', 'username avatar')
        .populate('channelId', 'name type');
};

export const unreadNotificationCountService = async (userId) =>
    Notification.countDocuments({ recipientId: userId, isRead: false });

export const markNotificationReadService = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw customErrorResponse({
            message: 'Notification not found.',
            statusCode: StatusCodes.NOT_FOUND
        });
    }

    return notification;
};

export const markAllNotificationsReadService = async (userId) => {
    const result = await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
    );

    return { modifiedCount: result.modifiedCount ?? 0 };
};
