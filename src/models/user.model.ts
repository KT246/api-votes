import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: String,
  age: Number,
});

export const User = mongoose.model("User", userSchema);
