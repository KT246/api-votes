import { Request, Response } from "express";
import Vote from "../models/vote.model";
import Room from "../models/room.model";
import User from "../models/user.model";
import Candidate from "../models/candidate.model";
// --- 1. SUBMIT VOTE: Gửi phiếu bầu (Giữ nguyên) ---
export const submitVote = async (req: Request, res: Response) => {
  try {
    const { roomCode, username, candidateIds } = req.body;

    // Validate input cơ bản
    if (!roomCode || !username || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ (cần mã phòng, username và danh sách chọn)." });
    }

    // Tìm phòng theo Code
    const room = await Room.findOne({ code: roomCode });
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại!" });

    // Validate logic phòng
    if (room.status !== "open") return res.status(400).json({ message: "Phòng chưa mở." });
    if (!room.allowedUsernames.includes(username)) return res.status(403).json({ message: "Bạn chưa tham gia phòng này." });

    // Check số lượng phiếu bầu tối đa
    if (candidateIds.length > room.maxVotesPerUser) {
      return res.status(400).json({ message: `Chỉ được chọn tối đa ${room.maxVotesPerUser} ứng viên.` });
    }

    // Check xem user đã vote chưa (Mỗi phòng chỉ vote 1 lần)
    const existingVotes = await Vote.countDocuments({ roomId: room._id, username });
    if (existingVotes > 0) return res.status(400).json({ message: "Bạn đã bình chọn rồi." });

    // Check ứng viên có thuộc phòng này không
    const validCount = await Candidate.countDocuments({ _id: { $in: candidateIds }, roomId: room._id });
    if (validCount !== candidateIds.length) return res.status(400).json({ message: "Danh sách chứa ứng viên không thuộc phòng này." });

    // Tạo phiếu bầu (Lưu nhiều phiếu cùng lúc)
    const votesToInsert = candidateIds.map(candId => ({
      roomId: room._id,
      username: username,
      candidateId: candId
    }));

    await Vote.insertMany(votesToInsert);

    return res.status(201).json({
      message: "Bình chọn thành công!",
      votedCount: votesToInsert.length
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi bỏ phiếu." });
  }
};

// --- 2. VIEW RESULT: Xem kết quả (Đã loại bỏ Group) ---
export const getRoomResult = async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ code: roomCode });
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại" });

    // Aggregation: Thống kê số phiếu cho từng ứng viên
    const results = await Vote.aggregate([
      { $match: { roomId: room._id } }, // 1. Lọc vote của phòng
      {
        $group: {
          _id: "$candidateId",
          count: { $sum: 1 } // 2. Đếm số phiếu
        }
      },
      { $sort: { count: -1 } }, // 3. Sắp xếp giảm dần (nhiều phiếu nhất lên đầu)
      {
        $lookup: { // 4. Join với bảng candidates để lấy tên, avatar
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "info"
        }
      },
      { $unwind: "$info" }, // 5. Làm phẳng mảng info
      {
        $project: { // 6. Chỉ lấy các trường cần thiết
          _id: 1,
          count: 1,
          name: "$info.name",
          avatar: "$info.avatar",
          intro: "$info.intro"
          // Đã xóa hoàn toàn trường group ở đây
        }
      }
    ]);

    return res.status(200).json({
      message: "Lấy kết quả thành công",
      roomName: room.name,
      totalVotes: results.reduce((acc, curr) => acc + curr.count, 0),
      data: results
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server khi xem kết quả." });
  }
};

// --- 3. GET VOTING PAGE: Lấy thông tin hiển thị trang Vote ---
export const getVotingPageData = async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const { username } = req.query;

    const room = await Room.findOne({ code: roomCode });
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại" });

    // Lấy danh sách ứng viên (Candidate Model đã xóa group nên ở đây cũng sạch)
    const candidates = await Candidate.find({ roomId: room._id }).sort({ createdAt: 1 });

    // Kiểm tra trạng thái vote của user
    let myVotedIds: string[] = [];
    let hasVoted = false;

    if (username) {
      const myVotes = await Vote.find({ roomId: room._id, username: username as string });
      myVotedIds = myVotes.map(v => v.candidateId.toString());
      hasVoted = myVotes.length > 0;
    }

    return res.status(200).json({
      room: {
        id: room._id,
        code: room.code,
        name: room.name,
        status: room.status,
        maxVotesPerUser: room.maxVotesPerUser
      },
      candidates: candidates,
      myVoteState: {
        hasVoted,
        votedCandidateIds: myVotedIds
      }
    });

  } catch (error) {
    return res.status(500).json({ message: "Lỗi server." });
  }
}