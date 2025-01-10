import Cors from "cors";
import { NextApiRequest, NextApiResponse } from "next";

const cors = Cors({
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  origin: "*",
});

export const runMiddleware = (req: NextApiRequest, res: NextApiResponse) =>
  new Promise((resolve, reject) => {
    cors(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
