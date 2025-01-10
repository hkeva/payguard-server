import mongoose, { Schema, Document } from "mongoose";

interface IPayment extends Document {
  title: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
