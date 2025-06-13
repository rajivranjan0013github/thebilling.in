import mongoose from "mongoose";
import { shopPlugin } from "../plugins/shopPlugin.js";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    email: {
      // Keeping email as per your modification, very basic
      type: String,
      unique: true, // Typically, email should be unique
      sparse: true, // Allows null/undefined, but unique if value exists
      trim: true,
      lowercase: true,
      // required: true, // Consider if email should be strictly required
    },
    password: {
      type: String,
      trim: true,
      // required: true, // Consider if password should be strictly required
    },
    mobileNumber: {
      type: String,
      trim: true,
      // We could add a regex validator here if needed
    },
    role: {
      type: String,
      enum: ["user", "doctor"],
      default: "user",
    },
    // All other fields like shop, employeeID, roles, contactNumber, address, etc., will be removed
    // when a staff member is converted to a super admin.
  },
  { timestamps: true }
);

staffSchema.plugin(shopPlugin);
export const Staff = mongoose.model("Staff", staffSchema);
