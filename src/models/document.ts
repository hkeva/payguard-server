import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

interface IDocument extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  fileUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
  },
  { timestamps: true }
);

const DocumentModel =
  mongoose.models.Document ||
  mongoose.model<IDocument>("Document", documentSchema);

export default DocumentModel;
