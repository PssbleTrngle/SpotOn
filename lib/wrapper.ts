
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/client";
import database from "./database";

export interface AuthenticatedApiHandler {
   (req: NextApiRequest, res: NextApiResponse, session: Session): void | Promise<void>
}

export default function wrapper(handler: AuthenticatedApiHandler): NextApiHandler {
   return async (req: NextApiRequest, res: NextApiResponse) => {
      await database()
      const session = await getSession({ req })
      if (!session) return res.status(403).json({ error: 'Not logged in' })
      return handler(req, res, session)
   }
}