import { Request, Response } from "express";
import Vote from "../models/vote.model";
import Room from "../models/room.model";
import User from "../models/user.model";
import Candidate from "../models/candidate.model";

// --- 1. SUBMIT VOTE: Gửi phiếu bầu (Giữ nguyên) ---
export const submitVote = async (req: Request, res: Response) => {
  try {
    const { roomCode, username, candidateIds } = req.body;

    // Validate input
    if (
      !roomCode ||
      !username ||
      !Array.isArray(candidateIds) ||
      candidateIds.length === 0
    ) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    const room = await Room.findOne({ code: roomCode });
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại!" });

    // Check logic
    if (room.status !== "open")
      return res.status(400).json({ message: "Phòng chưa mở." });
    if (!room.allowedUsernames.includes(username))
      return res.status(403).json({ message: "Bạn chưa tham gia phòng này." });
    if (candidateIds.length > room.maxVotesPerUser)
      return res.status(400).json({
        message: `Chỉ được chọn tối đa ${room.maxVotesPerUser} ứng viên.`,
      });

    // Check voted
    const existingVotes = await Vote.countDocuments({
      roomId: room._id,
      username,
    });
    if (existingVotes > 0)
      return res.status(400).json({ message: "Bạn đã bình chọn rồi." });

    // Check valid candidates
    const validCount = await Candidate.countDocuments({
      _id: { $in: candidateIds },
      roomId: room._id,
    });
    if (validCount !== candidateIds.length)
      return res
        .status(400)
        .json({ message: "Có ứng viên không thuộc phòng này." });

    // Insert Votes
    const votesToInsert = candidateIds.map((candId) => ({
      roomId: room._id,
      username: username,
      candidateId: candId,
    }));

    await Vote.insertMany(votesToInsert);

    return res.status(201).json({
      message: "Bình chọn thành công!",
      votedCount: votesToInsert.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server vote." });
  }
};

// --- 2. VIEW RESULT: Xem kết quả (CẬP NHẬT THÊM GROUP) ---
export const getRoomResult = async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ code: roomCode });
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại" });

    const results = await Vote.aggregate([
      { $match: { roomId: room._id } },
      {
        $group: {
          _id: "$candidateId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "info",
        },
      },
      { $unwind: "$info" },
      {
        $project: {
          _id: 1,
          count: 1,
          name: "$info.name",
          avatar: "$info.avatar",
          intro: "$info.intro",
          group: "$info.group", // <--- MỚI: Thêm trường này để Frontend phân nhóm kết quả
        },
      },
    ]);

    return res.status(200).json({
      message: "Lấy kết quả thành công",
      roomName: room.name,
      totalVotes: results.reduce((acc, curr) => acc + curr.count, 0),
      data: results,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server result." });
  }
};

// --- 3. GET VOTING PAGE (Giữ nguyên) ---
// API này dùng Candidate.find() nên nó tự động lấy full fields (bao gồm group), không cần sửa.
export const getVotingPageData = async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const { username } = req.query;

    const room = await Room.findOne({ code: roomCode });
    if (!room) return res.status(404).json({ message: "Not found" });

    const candidates = await Candidate.find({ roomId: room._id }).sort({
      createdAt: 1,
    });

    let myVotedIds: string[] = [];
    let hasVoted = false;
    if (username) {
      const myVotes = await Vote.find({
        roomId: room._id,
        username: username as string,
      });
      myVotedIds = myVotes.map((v) => v.candidateId.toString());
      hasVoted = myVotes.length > 0;
    }

    return res.status(200).json({
      room: {
        id: room._id,
        code: room.code,
        name: room.name,
        status: room.status,
        maxVotesPerUser: room.maxVotesPerUser,
      },
      candidates: candidates,
      myVoteState: { hasVoted, votedCandidateIds: myVotedIds },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error" });
  }
};
