import mongoose from 'mongoose';

const Conversation = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullconversationHistoryStylist: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],
    fullconversationHistoryArt: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],
    fullconversationHistoryShopper: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const FullConversation = mongoose.model('FullConversation', Conversation);
export default FullConversation;
