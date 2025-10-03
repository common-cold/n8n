import dotenv from "dotenv";
import { join } from "path";
import type { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";

dotenv.config({ path: join(__dirname, "..", "..", ".env") });
const JWT_SECRET = process.env.JWT_SECRET!;

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;
    console.log("TOKEN: " + token);
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            (req as any).user = decoded;
            next()
        } catch (e) {
            return res.status(401).send("Unauthorized");
        }
    } else {
        return res.status(401).send("Unauthorized");
    }
}