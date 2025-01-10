import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/config/supabase";
import { runMiddleware } from "@/middleware/corsMiddleware";
import Joi from "joi";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res);

  const { refreshToken } = req.body;

  const schema = Joi.object({
    refreshToken: Joi.string().required().messages({
      "any.required": "Refresh token is required",
    }),
  });

  try {
    await schema.validateAsync({ refreshToken }, { abortEarly: false });

    const { data: newSession, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken.trim(),
    });

    if (error) {
      return res.status(401).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newSession.session?.access_token,
      refreshToken: newSession.session?.refresh_token,
    });
  } catch (error: unknown) {
    const e = error as Error;
    return res.status(400).json({
      message: e.message || "Something went wrong while refreshing the token",
    });
  }
};

export default handler;
