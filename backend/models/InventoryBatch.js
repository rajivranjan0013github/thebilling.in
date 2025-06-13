import mongoose from "mongoose";
import { shopPlugin } from "../plugins/shopPlugin.js";

const InventoryBatchSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    batchNumber: String,
    HSN: String,
    quantity: { type: Number, default: 0 },
    expiry: String, // mm/yy
    mrp: Number,
    primaryUnit: String,
    secondaryUnit: String,
    gstPer: Number,
    
    batchTracking: { type: Boolean},
    purchaseRate: Number, // excl gst
    discount: { type: Number, default: 0 },
    saleRate: Number, // without gst
    pack: { type: Number, default: 1 },
  },
  { timestamps: true }
);

InventoryBatchSchema.plugin(shopPlugin);

export const InventoryBatch = mongoose.model(
  "InventoryBatch",
  InventoryBatchSchema
);
