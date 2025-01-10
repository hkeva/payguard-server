import Joi from "joi";
import DatabaseConnect from "@/config/mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/config/supabase";
import User from "@/models/user";
import { runMiddleware } from "@/middleware/corsMiddleware";

DatabaseConnect();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res);

  const { name, email, password } = req.body;

  const schema = Joi.object({
    name: Joi.string().required().messages({
      "any.required": `name is a required`,
    }),
    email: Joi.string()
      // regex for checking valid email
      .pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)
      .required()
      .messages({
        "string.pattern.base": "email is invalid",
        "string.empty": "email is a required",
      }),
    password: Joi.string().min(8).required().messages({
      "string.min": `password must be 8 characters long`,
      "any.required": `password is a required`,
    }),
  });

  try {
    // JOI validation
    await schema.validateAsync(
      { name, email, password },
      { abortEarly: false }
    );

    // check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // supabase auth
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:5173/",
      },
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // save to DB
    const newUser = new User({
      name,
      email,
    });

    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("Validation or registration error:", e);
    return res
      .status(400)
      .json({ message: e.message || "Something went wrong!" });
  }
};

export default handler;
