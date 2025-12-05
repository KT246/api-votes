import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bi_mat_khong_the_bat_mi_123";

// Mở rộng kiểu Request để gắn user vào (nếu cần dùng sau này)
export interface AuthRequest extends Request {
    user?: any;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Lấy token từ header (Format: "Bearer <token>")
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Không có quyền truy cập! Vui lòng đăng nhập." });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 2. Xác thực token
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Gắn thông tin user vào request để các hàm sau dùng
        req.user = decoded;

        // 4. Cho phép đi tiếp
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};