import type { Request, Response, NextFunction } from "express";
import { appendFile } from "node:fs/promises";
import path from "node:path";

const LOG_FILE = path.join(process.cwd(), "serverlogs.txt");

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on("finish", () => {
        const durationMs = Date.now() - startTime;
        const line = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms\n`;

        appendFile(LOG_FILE, line).catch((error) => {
            console.error("Failed to write request log:", error);
        });
    });

    next();
};
