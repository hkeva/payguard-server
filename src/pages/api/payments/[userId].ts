import { NextApiRequest, NextApiResponse } from "next";
import DatabaseConnect from "@/config/mongodb";
import mongoose from "mongoose";
import { runMiddleware } from "@/middleware/corsMiddleware";
import Payment from "@/models/payment";

DatabaseConnect();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res);

  const { userId } = req.query;

  if (req.method === "GET") {
    if (
      typeof userId !== "string" ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    try {
      const userDocuments = await Payment.find({ userId }).sort({
        createdAt: -1,
      });

      return res.status(200).json({
        message: "Payments fetched successfully for the user",
        data: userDocuments,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
};

export default handler;
