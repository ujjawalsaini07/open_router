import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtUtils.ts";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {

    const decoded = verifyToken(req.cookies?.token);
    if (!decoded) {
        return res.status(401).json({
            msg: "Invalid token",
        });
    }
    req.user = decoded;
    next();

}


