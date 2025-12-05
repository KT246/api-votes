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

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/import", upload.single("file"), importUsers);
router.post("/", createUser);
router.get("/list", getUsers);
router.get("/:id", getUserById);
router.put("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);

export default router;
