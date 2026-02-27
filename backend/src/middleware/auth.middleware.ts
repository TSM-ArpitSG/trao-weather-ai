// Authentication middleware for Trao Weather App backend.
// Verifies JWTs from incoming requests and attaches the authenticated user to req.
// Code written by Arpit Singh.

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthPayload } from "../services/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers["authorization"];

    if (!header || typeof header !== "string") {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Invalid Authorization header format" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const payload = jwt.verify(token, secret) as AuthPayload;

    req.user = { id: payload.userId };

    next();
  } catch (err) {
    console.error("Error in authMiddleware", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
