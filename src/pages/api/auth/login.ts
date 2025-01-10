import Joi from "joi";
import DatabaseConnect from "@/config/mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/config/supabase";
import { runMiddleware } from "@/middleware/corsMiddleware";
import User from "@/models/user";

DatabaseConnect();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res);

  const { email, password } = req.body;

  const schema = Joi.object({
    email: Joi.string()
      // regex for checking valid email
      .pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)
      .required()
      .messages({
        "string.pattern.base": "email is invalid",
        "string.empty": "email is a required",
      }),
    password: Joi.string().required().messages({
      "any.required": `password is a required`,
    }),
  });

  try {
    // JOI validation
    await schema.validateAsync({ email, password }, { abortEarly: false });

    // sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const user = await User.findOne({ email });

    return res.status(201).json({
      message: "User logged in successfully",
      user,
      accessToken: data.session?.access_token,
      refreshToken: data.session.refresh_token,
      data: data,
    });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("Validation or registration error:", e);
    return res
      .status(400)
      .json({ message: e.message || "Something went wrong!" });
  }
};

export default handler;
