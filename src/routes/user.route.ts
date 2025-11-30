import { Router } from "express";
import { createUser } from "../controllers/user.controller";
import { get } from "http";

const router = Router();

router.post("/create", createUser);
router.get("/", (req, res) => {
  res.send("User route is working");
});

export default router;
