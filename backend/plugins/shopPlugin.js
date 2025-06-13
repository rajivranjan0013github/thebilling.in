import mongoose from "mongoose";
import { getShopId } from "../utils/asyncLocalStorage.js";

export const shopPlugin = (schema) => {
  // Add the shop field to the schema if it doesn't exist
  if (!schema.path("shop")) {
    schema.add({
      shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    });
  }

  // Helper function to set shop condition
  const setShopCondition = function () {
    const shopId = getShopId();
    if (!this.getQuery().shop && shopId) {
      this.where({ shop: shopId });
    }
  };

  // Apply setShopCondition to all query middlewares
  const queryMiddlewares = [
    "count",
    "countDocuments",
    "find",
    "findOne",
    "findOneAndDelete",
    "findOneAndRemove",
    "findOneAndUpdate",
    "update",
    "updateOne",
    "updateMany",
  ];

  queryMiddlewares.forEach((method) => {
    schema.pre(method, setShopCondition);
  });

  schema.pre("save", function (next) {
    const shopId = getShopId();
    if (!this.shop && shopId) {
      this.shop = shopId;
    }
    next();
  });

  schema.pre("insertMany", function (next, docs) {
    const shopId = getShopId();

    if (Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (!doc.shop && shopId) {
          doc.shop = shopId;
        }
      });
    }
    next();
  });

  // Add a static method to the schema for shop-aware aggregation
  schema.statics.shopAwareAggregate = function (pipeline) {
    const shopId = getShopId();
    if (shopId) {
      // Add a $match stage at the beginning of the pipeline to filter by shop
      pipeline.unshift({ $match: { shop: shopId } });
    }
    return this.aggregate(pipeline);
  };
};
