import mongoose, { Document, Schema } from "mongoose";

export interface ICandidate extends Document {
  roomId: mongoose.Types.ObjectId;
  name: string;
  avatar?: string;
  intro?: string;
  createdAt: Date;
  updatedAt: Date;
}

const candidateSchema: Schema = new Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true, // Bắt buộc phải thuộc về 1 phòng
      index: true
    },
    name: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: ""
    },
    intro: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model<ICandidate>("Candidate", candidateSchema);