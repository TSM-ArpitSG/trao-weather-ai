// Repository helpers for User documents in Trao Weather App backend.
// Centralizes user lookup and persistence logic.
// Code written by Arpit Singh.

import { UserModel, IUser } from "../models/user.model";

export const findUserByEmail = (email: string) => {
  return UserModel.findOne({ email }).exec();
};

export const createUser = (data: Pick<IUser, "name" | "email" | "passwordHash">) => {
  return UserModel.create(data);
};
