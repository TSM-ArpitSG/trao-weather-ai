// Mongoose model for application users in the Trao Weather App backend.
// Stores identity, credentials hash, and relations to saved cities.
// Code written by Arpit Singh.

import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
