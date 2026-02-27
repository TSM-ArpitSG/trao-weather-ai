// Authentication controller for Trao Weather App backend.
// Handles user registration, login, and returning the current authenticated user.
// Code written by Arpit Singh.

import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    // Check if a user with this email already exists.
    const user = await registerUser(name, email, password);

    return res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email
    });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return res.status(409).json({ message: "Email is already registered" });
    }

    console.error("Error in register controller", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const { token, user } = await loginUser(email, password);

    return res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.error("Error in login controller", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
