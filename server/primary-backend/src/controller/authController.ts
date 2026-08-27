import type { Request, Response } from "express";
import { prisma } from "../config/dbConfig.ts";
import { z } from "zod";
import { comparePassword, hashPassword } from "../utils/passwordUtils.ts";
import { createToken, verifyToken } from "../utils/jwtUtils.ts";

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const loginController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
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
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return res.status(200).json({
    msg: "Login successful",
  });
};

export const signupController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!signupSchema.safeParse(req.body).success) {
    return res.status(401).json({
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
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return res.status(200).json({
    msg: "login successful",
    email: newUser.email,
  });
};

export const logout = (req: Request, res: Response) => {
 
    res.clearCookie("token");
    return res.status(200).json({
      msg: "Successful Logout",
  
  }
};
