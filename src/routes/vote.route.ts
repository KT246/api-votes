import express from "express";
import {
  submitVote,
  getRoomResult,
  getVotingPageData
} from "../controllers/vote.controller";

const router = express.Router();

// 1. User gửi phiếu bầu (Chọn 1 hoặc nhiều)
// API: POST /api/votes/submit
router.post("/submit", submitVote);

// 2. Xem kết quả thống kê của phòng
// API: GET /api/votes/result/:roomCode
router.get("/result/:roomCode", getRoomResult);

// 3. Lấy toàn bộ data để hiển thị trang Vote (Info phòng + List Candidate + Trạng thái đã vote chưa)
// API: GET /api/votes/page/:roomCode?username=...
router.get("/page/:roomCode", getVotingPageData);

export default router;