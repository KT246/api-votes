import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoute from "./routes/user.route";
import roomRoute from "./routes/room.route";
import voteRoute from "./routes/vote.route";
import candidateRoute from "./routes/candidate.route";
import authRoute from "./routes/auth.route";
import { protect } from "./middleware/auth.middleware";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json())

app.use(express.json());
app.use("/api/users", userRoute);
app.use("/api/rooms", protect, roomRoute);
app.use("/api/candidates", protect, candidateRoute);
app.use("/api/votes", voteRoute);
app.use("/api/auth", authRoute);

export default app;
