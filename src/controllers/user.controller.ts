import { Request, Response } from "express";
import { User } from "../models/user.model";

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await User.create(req.body);
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, message: err });
  }
};
