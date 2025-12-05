import mongoose, { Document, Schema } from "mongoose";

export interface IAdmin extends Document {
    username: string;
    password: string; // Sẽ lưu dạng hash (mã hóa)
}

const adminSchema: Schema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export default mongoose.model<IAdmin>("Admin", adminSchema);