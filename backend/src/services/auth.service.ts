// Authentication service layer for Trao Weather App backend.
// Handles password hashing, validation, and JWT token generation.
// Code written by Arpit Singh.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../repositories/user.repository";
import { IUser } from "../models/user.model";

const SALT_ROUNDS = 10;

export interface AuthPayload {
  userId: string;
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return secret;
};

// Register a new user with hashed password and return the user document.
export const registerUser = async (name: string, email: string, password: string): Promise<IUser> => {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ name, email, passwordHash });
  return user;
};

// Authenticate a user by email/password and return a JWT token plus user document.
export const loginUser = async (email: string, password: string): Promise<{ token: string; user: IUser }> => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const secret = getJwtSecret();
  const token = jwt.sign({ userId: user._id.toString() } as AuthPayload, secret, { expiresIn: "2h" });

  return { token, user };
};
