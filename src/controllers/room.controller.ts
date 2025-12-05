import { Request, Response } from "express";
import Room, { IRoom } from "../models/room.model";
import User from "../models/user.model";

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID của phòng
    const { username } = req.body; // Username người dùng nhập

    if (!username) {
      return res.status(400).json({ message: "Vui lòng nhập username!" });
    }

    // BƯỚC 1: Kiểm tra xem User này có thật trong hệ thống không?
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "Username không tồn tại trong hệ thống!" });
    }

    // BƯỚC 2: Kiểm tra phòng và thêm user vào
    // Sử dụng $addToSet để đảm bảo không bị trùng (nếu join rồi thì thôi, không lỗi)
    const room = await Room.findByIdAndUpdate(
      id,
      { $addToSet: { allowedUsernames: username } },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại!" });
    }

    // (Tuỳ chọn) Kiểm tra xem phòng có đang đóng không?
    if (room.status === "closed") {
      return res
        .status(400)
        .json({ message: "Phòng này đã đóng, không thể tham gia!" });
    }

    return res.status(200).json({
      message: "Tham gia phòng thành công!",
      data: room, // Trả về thông tin phòng để client hiển thị luôn
      userInfo: existingUser, // Trả về thêm info user để hiển thị "Xin chào..."
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2

// --- 1. CREATE: Tạo phòng mới ---
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { code, name, description, maxVotesPerUser, status } = req.body;

    // Validate cơ bản
    if (!code || !name) {
      return res
        .status(400)
        .json({ message: "Mã phòng (code) và Tên phòng (name) là bắt buộc!" });
    }

    // Kiểm tra trùng code
    const existingRoom = await Room.findOne({ code });
    if (existingRoom) {
      return res.status(400).json({ message: "Mã phòng này đã tồn tại!" });
    }

    const newRoom = new Room({
      code,
      name,
      description,
      maxVotesPerUser: maxVotesPerUser || 1,
      status: status || "draft", // Mặc định là draft nếu không gửi lên
      allowedUsernames: [], // Mặc định rỗng, sẽ thêm user sau
    });

    await newRoom.save();

    return res.status(201).json({
      message: "Tạo phòng thành công!",
      data: newRoom,
    });
  } catch (error: any) {
    // Bắt lỗi chỉ được 1 phòng open
    if (error.code === 11000 && error.keyPattern?.status) {
      return res.status(400).json({
        message: "Hệ thống chỉ cho phép 1 phòng OPEN tại một thời điểm!",
      });
    }
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// --- 2. LIST: Lấy danh sách phòng ---
export const getRooms = async (req: Request, res: Response) => {
  try {
    // Có thể lọc theo status nếu cần: ?status=open
    const filter = req.query.status ? { status: req.query.status } : {};

    const rooms = await Room.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách phòng thành công",
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// --- 3. READ: Lấy chi tiết phòng (theo ID hoặc Code) ---
export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check xem id gửi lên là ObjectId hay là Code string
    // Nếu muốn tìm theo Code thì dùng Room.findOne({ code: id })
    // Ở đây mình mặc định RESTful chuẩn dùng ID
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng!" });
    }

    return res.status(200).json({
      message: "Lấy chi tiết phòng thành công",
      data: room,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server hoặc ID không hợp lệ", error });
  }
};

// --- 4. UPDATE: Cập nhật phòng ---
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Không cho phép sửa code (thường là cố định), nếu muốn sửa thì tùy nghiệp vụ
    // delete updateData.code;

    const updatedRoom = await Room.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedRoom) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phòng để update!" });
    }

    return res.status(200).json({
      message: "Cập nhật phòng thành công!",
      data: updatedRoom,
    });
  } catch (error: any) {
    // Bắt lỗi chỉ được 1 phòng open khi update status
    if (error.code === 11000 && error.keyPattern?.status) {
      return res.status(400).json({
        message: "Không thể mở phòng này vì đã có một phòng khác đang OPEN!",
      });
    }
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// --- 5. DELETE: Xóa phòng ---
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedRoom = await Room.findByIdAndDelete(id);

    if (!deletedRoom) {
      return res.status(404).json({ message: "Không tìm thấy phòng để xóa!" });
    }

    return res.status(200).json({
      message: "Xóa phòng thành công!",
      data: deletedRoom,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// // --- EXTRA: Thêm users vào phòng (Allowed List) ---
// export const addUsersToRoom = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { usernames } = req.body; // Mảng username: ["user1", "user2"]

//     if (!Array.isArray(usernames)) {
//       return res
//         .status(400)
//         .json({ message: "Danh sách usernames phải là một mảng." });
//     }

//     const room = await Room.findByIdAndUpdate(
//       id,
//       { $addToSet: { allowedUsernames: { $each: usernames } } }, // $addToSet giúp không bị trùng
//       { new: true }
//     );

//     if (!room) return res.status(404).json({ message: "Phòng không tồn tại." });

//     return res.status(200).json({
//       message: "Đã thêm user vào phòng.",
//       data: room,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: "Lỗi server", error });
//   }
// };
