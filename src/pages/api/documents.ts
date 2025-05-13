import Joi from "joi";
import DatabaseConnect from "@/config/mongodb";
import { NextApiResponse } from "next";
import { runMiddleware } from "@/middleware/corsMiddleware";
import DocumentModel from "@/models/document";
import mongoose from "mongoose";
import { authMiddleware } from "@/middleware/authMiddleware";
import { AuthenticatedRequest } from "@/types";
import { sendEmail } from "@/utils/sendEmail";
import User from "@/models/user";

DatabaseConnect();

interface IFilters {
  title?: { $regex: string; $options: string };
  status?: string;
}

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  await runMiddleware(req, res);

  // check for permission
  const isAdminRoute = req.method === "GET" || req.method === "PATCH";
  await authMiddleware(req, res, isAdminRoute);

  // create document
  if (req.method == "POST") {
    const { title, fileUrl } = req.body;

    const schema = Joi.object({
      title: Joi.string().required().messages({
        "any.required": "title is required",
      }),
      fileUrl: Joi.string().required().messages({
        "any.required": "fileUrl is required",
      }),
    });

    try {
      await schema.validateAsync({ title, fileUrl }, { abortEarly: false });

      // check for existing document with same title
      const existingDocument = await DocumentModel.findOne({
        userId: req.user?._id,
        title,
      });
      if (existingDocument) {
        return res.status(400).json({
          message: "Document already exists with the same title",
        });
      }

      const newDocument = new DocumentModel({
        userId: req.user?._id,
        title: title,
        fileUrl: fileUrl,
      });

      await newDocument.save();

      return res.status(201).json({
        message: "Document created successfully",
        document: newDocument,
      });
    } catch (error: unknown) {
      const e = error as Error;
      console.error("document creation error:", e);
      return res
        .status(400)
        .json({ message: e.message || "Something went wrong!" });
    }
  }

  // get document list
  if (req.method === "GET") {
    try {
      const { title, status } = req.query;

      const filters: IFilters = {};

      if (title) {
        filters.title = { $regex: title as string, $options: "i" };
      }
      if (status) {
        filters.status = status as string;
      }

      const documents = await DocumentModel.find(filters).populate(
        "userId",
        "email"
      );

      return res.status(200).json({
        message: "Document list fetched successfully",
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // update document  status
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
      const updatedDocument = await DocumentModel.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true }
      );

      if (!updatedDocument) {
        return res.status(404).json({ error: "Document details not found" });
      }

      // send email to user starts
      const user = await User.findById(updatedDocument.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const emailOptions = {
        to: user.email,
        type: "Document",
        title: updatedDocument.title,
        status: updatedDocument.status,
      };

      await sendEmail(emailOptions);
      // send email to user ends

      return res
        .status(200)
        .json({ message: "Document status updated.", data: updatedDocument });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

export default handler;
