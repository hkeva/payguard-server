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
      const { id, name, email } = req.query;

      const filters = {
        ...(id && { _id: id }),
        ...(name && { name }),
        ...(email && { email }),
      };

      const users = await User.find(filters);

      return res.status(200).json({
        message: "User list fetched successfully",
        data: users,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export default handler;
