import { NextApiResponse } from "next";
import Stripe from "stripe";
import DatabaseConnect from "@/config/mongodb";
import Payment from "@/models/payment";
import { AuthenticatedRequest } from "@/types";
import { runMiddleware } from "@/middleware/corsMiddleware";
import { authMiddleware } from "@/middleware/authMiddleware";
import Joi from "joi";

DatabaseConnect();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia",
});

const createCheckoutSession = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => {
  await runMiddleware(req, res);
  await authMiddleware(req, res);

  const { title, amount } = req.body;

  const schema = Joi.object({
    title: Joi.string().required().messages({
      "any.required": "Title is required",
    }),
    amount: Joi.number().min(0).required().messages({
      "any.required": "Amount is required",
      "number.min": "Amount must be a positive number",
    }),
  });

  try {
    await schema.validateAsync({ title, amount }, { abortEarly: false });

    // check for existing payment with same title
    const existingPayment = await Payment.findOne({
      userId: req.user?._id,
      title,
    });
    if (existingPayment) {
      return res.status(400).json({
        message: "Payment already exists with the same title",
      });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: title,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/user-dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/user-dashboard?session_id={CHECKOUT_SESSION_ID}&success=false`,
    });

    // Save the payment data to MongoDB
    await new Payment({
      title,
      amount,
      userId: req.user?._id,
      transactionId: session.id,
    }).save();

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default createCheckoutSession;
