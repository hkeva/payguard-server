import DatabaseConnect from "@/config/mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { runMiddleware } from "@/middleware/corsMiddleware";
import User from "@/models/user";
import { authMiddleware } from "@/middleware/authMiddleware";

DatabaseConnect();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res);

  // check for permission
  await authMiddleware(req, res, true);

  // get users list
  if (req.method === "GET") {
    try {
      const { name, email, page = 1, limit = 10 } = req.query;

      const filters = {
        ...(name && { name }),
        ...(email && { email }),
      };

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      const [users, total] = await Promise.all([
        User.find(filters).skip(skip).limit(limitNumber),
        User.countDocuments(filters),
      ]);

      return res.status(200).json({
        message: "User list fetched successfully",
        data: users,
        meta: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export default handler;
