import { Shop } from "../models/Shop.js";
import { runWithShopContext } from "../utils/asyncLocalStorage.js";
import cookie from "cookie";

export const identifyShop = async (req, res, next) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const shopId = cookies?.shopId;
  if (!shopId) {
    return res.status(400).json({ error: "Shop not specified" });
  }

  try {
    const shop = await Shop.findOne({ shopId });
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    runWithShopContext(shop._id, () => {
      req.shop = shop._id;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: "Error identifying shop" });
  }
};

export const identifyShopFromBody = async (req, res, next) => {
  const { shopId } = req.body;
  if (!shopId) {
    return res
      .status(400)
      .json({ error: "Shop ID not provided in request body" });
  }

  try {
    const shop = await Shop.findOne({ shopId });
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    runWithShopContext(shop._id, () => {
      req.shop = shop._id;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: "Error identifying shop" });
  }
};
