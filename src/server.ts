import app from "./app";
import { connectDB } from "./config/database";

connectDB();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running at", PORT);
});
