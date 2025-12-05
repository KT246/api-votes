import express from "express";
import multer from "multer";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  importUsers,
} from "../controllers/user.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/import", upload.single("file"), protect, importUsers);
router.post("/", protect, createUser);
router.get("/list", protect, getUsers);
router.get("/:id", getUserById);
router.put("/update/:id", protect, updateUser);
router.delete("/delete/:id", protect, deleteUser);

export default router;
