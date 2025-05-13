import DatabaseConnect from "@/config/mongodb";
import { NextApiResponse } from "next";
import Payment from "@/models/payment";
import { runMiddleware } from "@/middleware/corsMiddleware";
import mongoose from "mongoose";
import { authMiddleware } from "@/middleware/authMiddleware";
import { AuthenticatedRequest } from "@/types";
import User from "@/models/user";
import { sendEmail } from "@/utils/sendEmail";

DatabaseConnect();

interface IFilters {
  title?: { $regex: string; $options: string };
  status?: string;
  amount?: { $eq: number };
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  await runMiddleware(req, res);

  // check for permission
  const isAdminRoute = req.method === "GET" || req.method === "PATCH";
  await authMiddleware(req, res, isAdminRoute);

  // get payment list
  if (req.method === "GET") {
    try {
      const { title, status, amount, page = 1, limit = 10 } = req.query;

      const filters: IFilters = {};

      if (title) {
        filters.title = { $regex: title as string, $options: "i" };
      }
      if (status) {
        filters.status = status as string;
      }
      if (amount) {
        filters.amount = { $eq: Number(amount) };
      }

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      const [payments, total] = await Promise.all([
        Payment.find(filters)
          .populate("userId", "email")
          .skip(skip)
          .limit(limitNumber),
        Payment.countDocuments(filters),
      ]);

      return res.status(200).json({
        message: "Payment list fetched successfully",
        data: payments,
        meta: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // update payment status
  if (req.method === "PATCH") {
    const { status } = req.body;
    const { id } = req.query;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    try {
      const updatedPayment = await Payment.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true }
      );

      if (!updatedPayment) {
        return res.status(404).json({ error: "Payment details not found" });
      }

      // send email to user starts
      const user = await User.findById(updatedPayment.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const emailOptions = {
        to: user.email,
        type: "Payment",
        title: updatedPayment.title,
        status: updatedPayment.status,
      };

      await sendEmail(emailOptions);
      // send email to user ends

      return res
        .status(200)
        .json({ message: "Payment status updated.", data: updatedPayment });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    // Validate Id
    const { id } = req.query;
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    try {
      await Payment.deleteOne({ _id: id });

      return res.status(200).json({
        message: "Payment deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export default handler;
