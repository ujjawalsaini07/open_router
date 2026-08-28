import type { Request, Response, NextFunction } from "express";

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        msg: "Internal server error"
    });
}
