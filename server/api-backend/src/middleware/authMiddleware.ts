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

// Must be called after the `authenticate` middleware, since it relies on req.user already being set.
export const checkAuthHeader = (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            msg: "Authorization header is required",
        });
    }

    const [scheme, apiKey] = authHeader.split(" ");

    if (scheme !== "Bearer" || !apiKey) {
        return res.status(401).json({
            msg: "Authorization header must be in the format: Bearer <apiKey>",
        });
    }

    req.user!.apikey = apiKey;
    next();

}




