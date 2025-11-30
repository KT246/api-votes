import express from "express";
import dotenv from "dotenv";
import userRoute from "./routes/user.route";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/user", userRoute);
app.use("/user", userRoute);

export default app;
