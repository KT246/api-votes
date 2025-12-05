import mongoose, { Document, Schema } from "mongoose";

// 1. Interface TypeScript
export interface IRoom extends Document {
  code: string;
  name: string;
  description?: string;
  status: "draft" | "open" | "closed";
  maxVotesPerUser: number;
  allowedUsernames: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 2. Schema Mongoose
const roomSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ["draft", "open", "closed"],
      default: "draft",
      required: true,
    },
    maxVotesPerUser: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    allowedUsernames: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Index Logic: Chỉ cho phép 1 phòng có status="open"
// Nếu cố tình set phòng thứ 2 là "open", MongoDB sẽ báo lỗi duplicate key
roomSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: "open" } }
);

export default mongoose.model<IRoom>("Room", roomSchema);
