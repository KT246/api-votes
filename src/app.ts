import express from "express";
import dotenv from "dotenv";
import userRoute from "./routes/user.route";
import roomRoute from "./routes/room.route";
import voteRoute from "./routes/vote.route";
import candidateRoute from "./routes/candidate.route";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/users", userRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/candidates", candidateRoute);
app.use("/api/votes", voteRoute);

export default app;
