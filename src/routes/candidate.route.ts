import express from "express";
import multer from "multer";
import {
  createCandidate,
  importCandidates,
  getCandidatesByRoom,
  updateCandidate,
  deleteCandidate
} from "../controllers/candidate.controller";

const router = express.Router();

// Cấu hình upload file (Lưu vào bộ nhớ RAM để xử lý nhanh)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 1. Cách 1: Tạo thủ công từng người
// Body: { roomId, name, intro... }
router.post("/", createCandidate);

// 2. Cách 2: Import từ Excel/CSV
// Form-data: file (excel), roomId (text)
router.post("/import", upload.single("file"), importCandidates);

// 3. Lấy danh sách ứng viên của phòng
router.get("/room/:roomId", getCandidatesByRoom);

// 4. Sửa/Xóa
router.put("/:id", updateCandidate);
router.delete("/:id", deleteCandidate);

export default router;