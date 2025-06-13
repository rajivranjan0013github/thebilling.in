import express from "express";
import { verifySuperAdmin } from "../middleware/SuperAdminMiddleWare.js";
import { Shop } from "../models/Shop.js";
import mongoose from "mongoose";
import cookie from "cookie";
import { identifyShop } from "../middleware/shopMiddleware.js";
import { presignedUrl } from "../s3.js";
import AccountDetails from "../models/AccountDetails.js";

const router = express.Router();

router.post("/create", verifySuperAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingShop = await Shop.findOne({
      shopId: req.body.shopId,
    }).session(session);
    if (existingShop) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "A shop with this ID already exists" });
    }

    const newShop = new Shop({
      ...req.body,
    });

    const savedShop = await newShop.save({ session });

    // Create default accounts for the shop
    const currentDate = new Date();

    // Create Cash Account
    const cashAccount = new AccountDetails({
      accountType: "CASH",
      balance: 0,
      cashDetails: {
        openingBalance: 0,
        openingBalanceDate: currentDate,
      },
    });
    await cashAccount.save({ session });

    // Create Bank Account
    const bankAccount = new AccountDetails({
      accountType: "BANK",
      balance: 0,
      bankDetails: {
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        type: "SAVINGS",
        openingBalance: 0,
        openingBalanceDate: currentDate,
      },
    });
    await bankAccount.save({ session });

    // Create UPI Account
    const upiAccount = new AccountDetails({
      accountType: "UPI",
      balance: 0,
      upiDetails: {
        upiId: "",
        upiName: "",
        openingBalance: 0,
        openingBalanceDate: currentDate,
      },
    });
    await upiAccount.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Shop created successfully with default accounts",
      shop: savedShop,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
});

// New route to fetch shop details
router.get("/getShop", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const shopId = cookies?.shopId;
    if (!shopId) {
      return res.status(400).json({ error: "shop not specified" });
    }

    const shop = await Shop.findOne({ shopId });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }
    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching shop details",
      error: error.message,
    });
  }
});

// New route to update shop information
router.post("/:shopId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const shop = await Shop.findOne({
      shopId: req.params.shopId,
    }).session(session);
    if (!shop) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Shop not found" });
    }

    // Update all fields, including the new category fields
    Object.assign(shop, req.body);

    const updatedShop = await shop.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Shop updated successfully",
      shop: updatedShop,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res
      .status(400)
      .json({ message: "Error updating shop", error: error.message });
  }
});

router.get("/getUploadUrl", identifyShop, async (req, res) => {
  try {
    const data = await presignedUrl();
    res.status(200).json(data);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching upload url", error: error.message });
  }
});

export default router;
