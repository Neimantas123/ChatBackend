import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationHistoryStylist: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],
    conversationHistoryArt: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],
    conversationHistoryShopper: [
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

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
