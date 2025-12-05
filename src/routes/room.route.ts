import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  // addUsersToRoom,
  joinRoom,
} from "../controllers/room.controller";

const router = express.Router();

router.post("/", createRoom);
router.get("/", getRooms);
router.get("/:id", getRoomById);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);
// router.post("/:id/users", addUsersToRoom);
router.post("/:id/join", joinRoom);

export default router;
