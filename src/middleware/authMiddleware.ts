import { NextApiResponse } from "next";
import { supabase } from "@/config/supabase";
import User from "@/models/user";
import { AuthenticatedRequest } from "@/types";

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  isAdminRoute: boolean = false
) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized, token missing" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Unauthorized, invalid token" });
  }

  const user = await User.findOne({ email: data.user.email });

  // check for routes protected for admin only
  if (isAdminRoute) {
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Forbidden, you are not an admin" });
    }
  }

  req.user = user;
};
