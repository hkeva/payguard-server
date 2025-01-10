import { NextApiRequest } from "next";

interface IAuthUser {
  _id: string;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user?: IAuthUser;
}
