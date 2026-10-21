import jwt from 'jsonwebtoken';

import workspaceRepository from '../repositories/workspaceRepository.js';
import Channel from '../schema/channel.js';
import { JOIN_CHANNEL_EVENT } from '../utils/common/eventConstants.js';

export default function messageHandler(io, socket) {
    socket.on(JOIN_CHANNEL_EVENT, async function joinChannelHandler(data, cb) {
        const respond = typeof cb === 'function' ? cb : () => {};

        try {
            // The socket connection itself carries the JWT; joining a room is
            // authorized so DM rooms cannot be joined by other workspace members.
            const token = socket.handshake.auth?.token;
            if (!token) {
                return respond({ success: false, message: 'Authentication required' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const channelId = data?.channelId;

            if (!channelId) {
                return respond({ success: false, message: 'channelId is required' });
            }

            const channel = await Channel.findById(channelId);
            if (!channel) {
                return respond({ success: false, message: 'Channel not found' });
            }

            const workspace = await workspaceRepository.getById(channel.workspaceId);
            const isWorkspaceMember = (workspace?.members ?? []).some(
                (member) => String(member.memberId) === String(decoded.id)
            );

            if (!isWorkspaceMember) {
                return respond({
                    success: false,
                    message: 'You are not a member of this workspace'
                });
            }

            if (
                channel.type === 'dm' &&
                !(channel.members ?? []).some(
                    (member) => String(member) === String(decoded.id)
                )
            ) {
                return respond({
                    success: false,
                    message: 'You are not a participant of this direct message'
                });
            }

            socket.join(String(channelId));
            return respond({
                success: true,
                message: `Joined Channel ${channelId}`,
                data: channelId
            });
        } catch (error) {
            console.error('[ERROR] joinChannelHandler:', error?.message || error);
            return respond({ success: false, message: 'Unauthorized' });
        }
    });
}
