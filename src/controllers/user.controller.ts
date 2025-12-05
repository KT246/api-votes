import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import xlsx from "xlsx";

// --- 1. CREATE: Tạo mới một user ---
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, name } = req.body;

    // Validate cơ bản
    if (!username || !name) {
      return res.status(400).json({ message: "Username và Name là bắt buộc!" });
    }

    // Kiểm tra trùng username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username đã tồn tại!" });
    }

    const newUser = new User({ username, name });
    await newUser.save();

    return res.status(201).json({
      message: "Tạo user thành công!",
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// --- 2. LIST: Lấy danh sách users ---
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }); // Mới nhất lên đầu
    return res.status(200).json({
      message: "Lấy danh sách thành công",
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// --- 3. READ: Lấy chi tiết 1 user theo ID ---
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user!" });
    }

    return res.status(200).json({
      message: "Lấy thông tin user thành công",
      data: user,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server hoặc ID không hợp lệ", error });
  }
};

// --- 4. UPDATE: Cập nhật thông tin user ---
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, username } = req.body; // Chỉ cho phép sửa name và username

    // { new: true } để trả về data sau khi update thay vì data cũ
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, username },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy user để update!" });
    }

    return res.status(200).json({
      message: "Cập nhật thành công!",
      data: updatedUser,
    });
  } catch (error: any) {
    // Bắt lỗi trùng username nếu có
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Username mới bị trùng với user khác!" });
    }
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// --- 5. DELETE: Xóa user ---
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "Không tìm thấy user để xóa!" });
    }

    return res.status(200).json({
      message: "Xóa user thành công!",
      data: deletedUser, // Trả về thông tin user đã xóa (nếu cần)
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

const mapExcelDataToUser = (item: any): Partial<IUser> => {
  return {
    // Mapping cột trong Excel -> field trong DB
    username: item["username"] || item["Username"],
    name: item["name"] || item["Name"] || "No Name",
  };
};

export const importUsers = async (req: Request, res: Response) => {
  try {
    // 1. Kiểm tra file
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Vui lòng upload file Excel hoặc CSV!" });
    }

    // 2. Đọc file từ buffer (bộ nhớ tạm)
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    // Lấy sheet đầu tiên
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // 3. Convert sheet sang JSON
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
      return res
        .status(400)
        .json({ message: "File rỗng hoặc không đúng định dạng!" });
    }

    // 4. Chuẩn hóa dữ liệu
    const usersToInsert = rawData
      .map(mapExcelDataToUser)
      .filter((u) => u.username);

    // 5. Lưu vào DB
    try {
      // ordered: false giúp tiếp tục insert các dòng khác dù có dòng bị lỗi (VD: trùng username)
      const result = await User.insertMany(usersToInsert, { ordered: false });
      return res.status(200).json({
        message: "Import thành công!",
        count: result.length,
        data: result,
      });
    } catch (dbError: any) {
      const insertedCount = dbError.insertedDocs
        ? dbError.insertedDocs.length
        : 0;
      return res.status(200).json({
        message: "Import hoàn tất với một số lỗi (có thể do trùng username).",
        successCount: insertedCount,
        errors: dbError.writeErrors
          ? dbError.writeErrors.length
          : "Unknown error",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi import file." });
  }
};
