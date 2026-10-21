import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required']
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required']
    },
    // Workspace channels are visible to the whole workspace; DM channels are
    // private to the two members listed in `members`.
    type: {
      type: String,
      enum: ['channel', 'dm'],
      default: 'channel'
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },

  { timestamps: true }
);

const Channel = mongoose.model('Channel', channelSchema);

export default Channel;