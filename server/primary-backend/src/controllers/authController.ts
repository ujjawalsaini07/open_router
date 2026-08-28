import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/dbConfig.ts";
import { z } from "zod";
import { comparePassword, hashPassword } from "../utils/passwordUtils.ts";
import { createToken } from "../utils/jwtUtils.ts";

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 4 * 24 * 60 * 60 * 1000, // 4 days, matches JWT expiry
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    if (!loginSchema.safeParse(req.body).success) {
      return res.status(400).json({
        msg: "Invalid request body",
      });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    const token = createToken({ userId: user.id, email: user.email });
    res.cookie("token", token, cookieOptions);
    return res.status(200).json({
      msg: "Login successful",
    });
  } catch (error) {
    next(error);
  }
};

export const signupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    if (!signupSchema.safeParse(req.body).success) {
      return res.status(400).json({
        msg: "Invalid Request Body",
      });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      return res.status(409).json({
        msg: "Email in Use ",
      });
    }
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = createToken({ userId: newUser.id, email: newUser.email });
    res.cookie("token", token, cookieOptions);
    return res.status(200).json({
      msg: "login successful",
      email: newUser.email,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token");
  return res.status(200).json({
    msg: "Successful Logout",
  });
};
