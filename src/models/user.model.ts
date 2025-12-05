import mongoose, { Document, Schema } from "mongoose";

// 1. Định nghĩa Interface cho TypeScript (cập nhật theo schema mới)
export interface IUser extends Document {
  username: string;
  name: string;
}

// 2. Định nghĩa Schema Mongoose
const userSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
});

export default mongoose.model<IUser>("User", userSchema);
