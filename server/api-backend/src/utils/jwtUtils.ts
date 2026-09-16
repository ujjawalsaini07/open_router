import "dotenv/config";
import jwt, { type JwtPayload } from "jsonwebtoken";
const secretKey = process.env.JWT_SECRET || "your_secret_key"; 

export const createToken = (payload: object): string => {
    return jwt.sign(payload, secretKey, { expiresIn: "4d" });
}

export const verifyToken = (token: string): JwtPayload | null => {
   try {
    const decoded = jwt.verify(token, secretKey);
    if (typeof decoded === "string") {
        return null;
    }
    return decoded;
} catch (error) {
    return null;
}
}


