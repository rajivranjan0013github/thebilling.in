import mongoose from "mongoose";

const ShopSchema = new mongoose.Schema({
  name: String,
  logo: String,
  address: String,
  contactNumber: String,
  email: String,
  website: String,
  gstNumber: String,
  drugLicenceNumber: String,
  shopId: {
    type: String,
    required: true,
    unique: true,
  },
  itemExpiryThreshold: {
    type: Number,
    min: 0,
    default: 3, // Default to 3 months, for example
  },
  itemCategories: {
    type: [String],
    default: [],
  },
});

export const Shop = mongoose.model("Shop", ShopSchema);
