import mongoose from "mongoose";
import { shopPlugin } from "../plugins/shopPlugin.js";

const SettingsSchema = new mongoose.Schema(
  {
    adjustment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SettingsSchema.plugin(shopPlugin);
export const Settings = mongoose.model("Settings", SettingsSchema);
