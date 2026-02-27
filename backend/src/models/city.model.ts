// Mongoose model for a user's saved city in the Trao Weather App backend.
// Stores normalized city name, country code, owner reference, and favorite flag.
// Code written by Arpit Singh.

import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICity extends Document {
  userId: Types.ObjectId;
  name: string;
  nameNormalized: string;
  country?: string;
  apiCityId?: string;
  isFavorite: boolean;
}

const citySchema = new Schema<ICity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    nameNormalized: { type: String, required: true, lowercase: true },
    country: { type: String },
    apiCityId: { type: String },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

citySchema.index({ userId: 1, nameNormalized: 1, country: 1 }, { unique: true });

export const CityModel = mongoose.model<ICity>("City", citySchema);
