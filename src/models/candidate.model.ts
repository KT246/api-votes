import mongoose, { Document, Schema } from "mongoose";

export interface ICandidate extends Document {
  roomId?: mongoose.Types.ObjectId; // Null = Candidate Mẫu (Menu gốc)
  name: string;
  avatar?: string;
  intro?: string;
  group?: string; // MỚI: Phân loại (vd: "leader", "lunch", "tech")
  createdAt: Date;
  updatedAt: Date;
}

const candidateSchema: Schema = new Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: false, // false để tạo candidate mẫu
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    intro: {
      type: String,
      default: "",
    },
    // MỚI: Giúp lọc danh sách candidate mẫu dễ hơn
    group: {
      type: String,
      default: "common", // Mặc định là nhóm chung
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICandidate>("Candidate", candidateSchema);
