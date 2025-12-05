import { Request, Response } from "express";
import Admin from "../models/admin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Secret Key nên để trong file .env, ở đây mình demo để cứng
const JWT_SECRET = process.env.JWT_SECRET || "bi_mat_khong_the_bat_mi_123";

// --- 1. REGISTER: Tạo tài khoản Admin mới ---
export const registerAdmin = async (req: Request, res: Response) => {

    try {
        const { username, password } = req.body;
        console.log(req.body);

        if (!username || !password) {
            return res.status(400).json({ message: "Thiếu username hoặc password" });
        }

        // Check trùng
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin này đã tồn tại!" });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new Admin({
            username,
            password: hashedPassword
        });

        await newAdmin.save();

        return res.status(201).json({ message: "Đăng ký Admin thành công!" });

    } catch (error) {
        return res.status(500).json({ message: "Lỗi server" });
    }
};

// --- 2. LOGIN: Đăng nhập lấy Token ---
export const loginAdmin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Tìm admin
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu!" });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu!" });
        }

        // Tạo JWT Token (Hết hạn sau 1 ngày)
        const token = jwt.sign(
            { id: admin._id, username: admin.username, role: "admin" },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Đăng nhập thành công!",
            token: token,
            admin: {
                id: admin._id,
                username: admin.username
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Lỗi server" });
    }
};