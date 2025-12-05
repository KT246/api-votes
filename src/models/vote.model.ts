import mongoose, { Document, Schema } from "mongoose";

export interface IVote extends Document {
  roomId: mongoose.Types.ObjectId;
  username: string;
  candidateId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const voteSchema: Schema = new Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
  },
  { timestamps: true }
);

// Index 1: Đảm bảo 1 user không thể vote 2 lần cho CÙNG 1 ứng viên trong 1 phòng
// (Nhưng user có thể vote cho nhiều ứng viên khác nhau nếu luật phòng cho phép)
voteSchema.index({ roomId: 1, username: 1, candidateId: 1 }, { unique: true });

export default mongoose.model<IVote>("Vote", voteSchema);
