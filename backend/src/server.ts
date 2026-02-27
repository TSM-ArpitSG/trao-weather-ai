// Server entry point for Trao Weather App backend.
// Loads environment, connects to MongoDB, and starts the Express server.
// Code written by Arpit Singh.
import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";

dotenv.config();

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    // Connect to MongoDB before starting the HTTP server
    await connectDB();
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Backend server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();

