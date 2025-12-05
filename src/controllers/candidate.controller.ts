import { Request, Response } from "express";
import Candidate from "../models/candidate.model";
import Room from "../models/room.model";
import xlsx from "xlsx";

const normalizeKeys = (obj: any) => {
  const newObj: any = {};
  Object.keys(obj).forEach((key) => {
    const cleanKey = key.trim().toLowerCase().replace(/^\uFEFF/, "").replace(/^"|"$/g, "");
    newObj[cleanKey] = obj[key];
  });
  return newObj;
};

// --- CÁCH 1: TẠO THỦ CÔNG ---
export const createCandidate = async (req: Request, res: Response) => {
  try {
    const { roomId, name, avatar, intro } = req.body;

    if (!roomId || !name) {
      return res.status(400).json({ message: "RoomId và Tên ứng viên là bắt buộc!" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại!" });
    if (room.status === "closed") return res.status(400).json({ message: "Phòng đã đóng!" });

    // CHECK TRÙNG TÊN: Kiểm tra xem tên đã có trong phòng này chưa (Case insensitive)
    // Ví dụ: "Lan" và "lan" coi là trùng
    const existingCandidate = await Candidate.findOne({
      roomId,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    });

    if (existingCandidate) {
      return res.status(400).json({ message: `Ứng viên tên "${name}" đã tồn tại trong phòng này!` });
    }

    const newCandidate = new Candidate({
      roomId,
      name: name.trim(), // Trim khoảng trắng thừa
      avatar,
      intro
    });

    await newCandidate.save();

    return res.status(201).json({
      message: "Thêm ứng viên thành công!",
      data: newCandidate,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// --- CÁCH 2: IMPORT TỪ EXCEL (BỎ QUA NẾU TRÙNG) ---
export const importCandidates = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;

    if (!req.file) return res.status(400).json({ message: "Vui lòng upload file Excel/CSV!" });
    if (!roomId) return res.status(400).json({ message: "Thiếu roomId!" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại!" });
    if (room.status === "closed") return res.status(400).json({ message: "Phòng đã đóng!" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (rawData.length === 0) return res.status(400).json({ message: "File rỗng!" });

    // 1. Map dữ liệu từ Excel
    const rawList = rawData.map((item: any) => {
      const cleanItem = normalizeKeys(item);
      return {
        roomId: roomId,
        name: (cleanItem["name"] || cleanItem["tên"] || "").toString().trim(),
        avatar: cleanItem["avatar"] || cleanItem["ảnh"] || "",
        intro: cleanItem["intro"] || cleanItem["mô tả"] || ""
      };
    }).filter(c => c.name); // Bỏ dòng ko có tên

    if (rawList.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy dữ liệu hợp lệ (cột name/tên)." });
    }

    // 2. Lấy danh sách tên ĐANG CÓ trong DB của phòng này để so sánh
    const existingCandidates = await Candidate.find({ roomId }).select("name");
    // Tạo Set tên viết thường để check cho nhanh
    const existingNames = new Set(existingCandidates.map(c => c.name.toLowerCase()));

    // 3. Lọc danh sách cần insert (Loại bỏ trùng lặp)
    const uniqueList: any[] = [];
    const seenInFile = new Set<string>(); // Để check trùng nội bộ trong file excel (vd file có 2 dòng "Lan")
    let skippedCount = 0;

    for (const item of rawList) {
      const lowerName = item.name.toLowerCase();

      // Nếu trùng trong file Excel
      if (seenInFile.has(lowerName)) {
        skippedCount++;
        continue;
      }

      // Nếu trùng với DB đã có
      if (existingNames.has(lowerName)) {
        skippedCount++;
        continue;
      }

      // Nếu ok thì thêm vào danh sách chuẩn bị insert
      seenInFile.add(lowerName);
      uniqueList.push(item);
    }

    if (uniqueList.length === 0) {
      return res.status(200).json({
        message: "Tất cả ứng viên trong file đều đã tồn tại trong phòng. Không có gì mới để thêm.",
        skipped: skippedCount
      });
    }

    // 4. Insert danh sách sạch
    const result = await Candidate.insertMany(uniqueList);

    return res.status(200).json({
      message: `Đã import thành công ${result.length} ứng viên! (Bỏ qua ${skippedCount} trùng lặp)`,
      data: result,
      skippedCount
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi import." });
  }
};

// --- CRUD CƠ BẢN ---
export const getCandidatesByRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const candidates = await Candidate.find({ roomId }).sort({ createdAt: 1 });
    return res.status(200).json({ count: candidates.length, data: candidates });
  } catch (error) { return res.status(500).json({ message: "Lỗi server" }); }
};

export const updateCandidate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Nếu có sửa tên, cũng phải check trùng (trừ chính nó ra)
    if (name) {
      const currentCandidate = await Candidate.findById(id);
      if (currentCandidate) {
        const duplicate = await Candidate.findOne({
          roomId: currentCandidate.roomId,
          name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
          _id: { $ne: id } // Không tính chính nó
        });
        if (duplicate) return res.status(400).json({ message: "Tên mới bị trùng với ứng viên khác!" });
      }
    }

    const updated = await Candidate.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Không tìm thấy" });
    return res.status(200).json({ data: updated });
  } catch (error) { return res.status(500).json({ message: "Lỗi server" }); }
};

export const deleteCandidate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Candidate.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy" });
    return res.status(200).json({ message: "Đã xóa" });
  } catch (error) { return res.status(500).json({ message: "Lỗi server" }); }
};