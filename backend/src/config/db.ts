// Database connection helper for Trao Weather App backend.
// Responsible for connecting to MongoDB using the URI from environment variables.
// Code written by Arpit Singh.

import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  await mongoose.connect(uri);
};
