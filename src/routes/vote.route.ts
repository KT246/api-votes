import express from "express";
import {
  submitVote,
  getRoomResult,
  //   getMyVotes,
} from "../controllers/vote.controller";

const router = express.Router();

// 1. User gửi phiếu bầu (Chọn 1 hoặc nhiều)
router.post("/submit", submitVote);

// 2. Xem kết quả thống kê của phòng
router.get("/result/:roomCode", getRoomResult);

// 3. Kiểm tra xem mình đã bầu ai chưa
// router.get("/check-my-vote", getMyVotes);

export default router;
