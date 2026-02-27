// Repository helpers for querying and mutating City documents.
// Encapsulates all DB access for user-saved cities in Trao Weather App.
// Code written by Arpit Singh.

import { Types } from "mongoose";
import { CityModel, ICity } from "../models/city.model";

export const listCitiesForUser = (userId: string) => {
  // Retrieve cities for a user, sorted by creation time in descending order
  return CityModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
};

export const createCityForUser = (city: {
  userId: string;
  name: string;
  nameNormalized: string;
  country?: string;
  apiCityId?: string;
}) => {
  const doc = new CityModel({
    userId: new Types.ObjectId(city.userId),
    name: city.name,
    nameNormalized: city.nameNormalized,
    country: city.country,
    apiCityId: city.apiCityId,
  });

  return doc.save();
};

export const findCityByIdForUser = (cityId: string, userId: string) => {
  return CityModel.findOne({ _id: new Types.ObjectId(cityId), userId: new Types.ObjectId(userId) }).exec();
};

export const deleteCityForUser = (cityId: string, userId: string) => {
  return CityModel.deleteOne({ _id: new Types.ObjectId(cityId), userId: new Types.ObjectId(userId) }).exec();
};

export const updateCityFavoriteForUser = (cityId: string, userId: string, isFavorite: boolean) => {
  return CityModel.findOneAndUpdate(
    { _id: new Types.ObjectId(cityId), userId: new Types.ObjectId(userId) },
    { isFavorite },
    { new: true }
  ).exec();
};
