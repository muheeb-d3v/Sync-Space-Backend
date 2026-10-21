import { StatusCodes } from 'http-status-codes';

import Channel from '../schema/channel.js';
import { customErrorResponse } from '../utils/common/responseObjects.js';
import { isMemberPartOfWorkspace } from './memberService.js';

const DM_MEMBER_FIELDS = 'username email avatar';
const DM_CHANNEL_NAME = 'Direct message';

/**
 * A DM channel is private to the members listed on it. These helpers are used
 * by the channel/message services and the socket handler so a DM cannot be
 * read or written by another member of the workspace.
 */
export const isDmChannel = (channel) => channel?.type === 'dm';

export const assertDmParticipantship = (channel, userId) => {
    if (!isDmChannel(channel)) return;

    const isParticipant = (channel.members ?? []).some(
        (member) => String(member?._id ?? member) === String(userId)
    );

    if (!isParticipant) {
        throw customErrorResponse({
            message: 'You are not a participant of this direct message.',
            statusCode: StatusCodes.FORBIDDEN
        });
    }
};

export const listDmsService = async (workspaceId, userId) => {
    // Throws when the user is not part of the workspace.
    await isMemberPartOfWorkspace(workspaceId, userId);

    return Channel.find({ workspaceId, type: 'dm', members: userId })
        .populate('members', DM_MEMBER_FIELDS)
        .sort({ updatedAt: -1 });
};

export const startDmService = async (workspaceId, userId, memberId) => {
    if (!memberId) {
        throw customErrorResponse({
            message: 'memberId is required.',
            statusCode: StatusCodes.BAD_REQUEST
        });
    }

    if (String(memberId) === String(userId)) {
        throw customErrorResponse({
            message: 'You cannot start a direct message with yourself.',
            statusCode: StatusCodes.BAD_REQUEST
        });
    }

    await isMemberPartOfWorkspace(workspaceId, userId);
    await isMemberPartOfWorkspace(workspaceId, memberId);

    const existing = await Channel.findOne({
        workspaceId,
        type: 'dm',
        members: { $all: [userId, memberId], $size: 2 }
    }).populate('members', DM_MEMBER_FIELDS);

    if (existing) return existing;

    const dm = await Channel.create({
        name: DM_CHANNEL_NAME,
        workspaceId,
        type: 'dm',
        members: [userId, memberId]
    });

    return dm.populate('members', DM_MEMBER_FIELDS);
};
