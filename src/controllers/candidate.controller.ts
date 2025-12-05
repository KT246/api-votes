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
    // Không còn nhận 'group' từ body nữa
    const { roomId, name, avatar, intro } = req.body;

    if (!roomId || !name) {
      return res.status(400).json({ message: "RoomId và Tên ứng viên là bắt buộc!" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại!" });
    if (room.status === "closed") return res.status(400).json({ message: "Phòng đã đóng!" });

    const newCandidate = new Candidate({
      roomId,
      name,
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

// --- CÁCH 2: IMPORT TỪ EXCEL ---
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

    const candidatesToInsert = rawData.map((item: any) => {
      const cleanItem = normalizeKeys(item);
      return {
        roomId: roomId,
        name: cleanItem["name"] || cleanItem["tên"],
        avatar: cleanItem["avatar"] || cleanItem["ảnh"] || "",
        intro: cleanItem["intro"] || cleanItem["mô tả"] || ""
        // Đã xóa dòng map group
      };
    }).filter(c => c.name);

    if (candidatesToInsert.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy dữ liệu hợp lệ (cột name/tên)." });
    }

    const result = await Candidate.insertMany(candidatesToInsert);

    return res.status(200).json({
      message: `Đã import thành công ${result.length} ứng viên!`,
      data: result
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
    // Không cho update group nữa
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