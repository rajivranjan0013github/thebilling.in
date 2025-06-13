import express from "express";
import { Inventory } from "../models/Inventory.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { StockTimeline } from "../models/StockTimeline.js";
import mongoose from "mongoose";
import { findChangesInObject } from "../utils/Helper.js";

const router = express.Router();

// Create new inventory
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const details = req.body;
    const newInventoryItem = new Inventory(details);
    const savedItem = await newInventoryItem.save({ session });

    if (details.isBatchTracked && details.batchDetails) {
      const batchData = {
        ...details.batchDetails,
        batchTracking: true,
        inventoryId: savedItem._id,
      };

      const newBatch = new InventoryBatch(batchData);
      await newBatch.save({ session });
      savedItem.batch.push(newBatch._id);
      savedItem.quantity = batchData.quantity || 0;
      await savedItem.save({ session });
    } else if (!details.isBatchTracked) {
      const batchData = {
        ...details,
        inventoryId: savedItem._id,
        batchTracking: false,
        batchNumber: savedItem.name || "N/A",
      };
      const newBatch = new InventoryBatch(batchData);
      await newBatch.save({ session });
      savedItem.batch.push(newBatch._id);
      savedItem.quantity = batchData.quantity || 0;
      await savedItem.save({ session });
    }

    const finalItem = await Inventory.findById(savedItem._id)
      .populate("batch")
      .session(session);
    await session.commitTransaction();
    res.status(201).json(finalItem);
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Update existing inventory
router.put("/:id", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const details = req.body;

    // Fetch the current inventory item with batches
    const existingItem = await Inventory.findById(id)
      .populate("batch")
      .session(session);
    if (!existingItem) {
      throw new Error("Item not found");
    }

    // Detect if batch tracking is being enabled for the very first time
    const isEnablingBatchTracking =
      existingItem.isBatchTracked === false && details.isBatchTracked === true;

    // Separate any batchDetails (and _id) from other update fields
    const { batchDetails, _id: bodyId, ...inventoryUpdateFields } = details;

    // Apply simple field updates on inventory
    Object.assign(existingItem, inventoryUpdateFields);

    // ------------------------------------------------------------------
    // If user has just enabled batch-tracking, convert the default batch
    // (batchTracking : false) → tracked batch (batchTracking : true)
    // ------------------------------------------------------------------
    if (isEnablingBatchTracking) {
      // 1. Locate and delete the un-tracked (default) batch
      const defaultBatch = await InventoryBatch.findOne({
        inventoryId: existingItem._id,
        batchTracking: false,
      }).session(session);

      let carriedQuantity = existingItem.quantity || 0; // fallback
      if (defaultBatch) {
        carriedQuantity = Number(defaultBatch.quantity) || 0;
        // Remove batch document
        await InventoryBatch.deleteOne({ _id: defaultBatch._id }).session(
          session
        );
        // Remove its reference from inventory.batch array
        existingItem.batch = existingItem.batch.filter((b) => {
          const idToCompare = (b && b._id ? b._id : b).toString();
          return idToCompare !== defaultBatch._id.toString();
        });
      }

      // 2. Prepare data for the new tracked batch. Use provided batchDetails
      //    when available, otherwise fall back to inventory fields.
      const newBatchData = {
        batchTracking: true,
        inventoryId: existingItem._id,
        quantity: carriedQuantity,
        batchNumber: batchDetails?.batchNumber,
        expiry: batchDetails?.expiry ,
        purchaseRate: batchDetails?.purchaseRate || existingItem.purchaseRate,
        saleRate: batchDetails?.saleRate || existingItem.saleRate,
        mrp: batchDetails?.mrp || existingItem.mrp,
        gstPer: batchDetails?.gstPer || existingItem.gstPer,
        location: batchDetails?.location || existingItem.location,
        HSN: batchDetails?.HSN || existingItem.HSN,
        primaryUnit: existingItem.primaryUnit,
        secondaryUnit: existingItem.secondaryUnit,
        pack: existingItem.pack,
      };

      const newBatch = new InventoryBatch(newBatchData);
      await newBatch.save({ session });

      // 3. Link the newly created batch & sync stock quantity
      existingItem.batch.push(newBatch._id);
      existingItem.quantity = carriedQuantity;
    }

    // Save inventory after modifications
    const savedInventory = await existingItem.save({ session });

    const populatedItem = await Inventory.findById(savedInventory._id)
      .populate("batch")
      .session(session);

    await session.commitTransaction();
    res.status(200).json(populatedItem);
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// creating or updating batch
router.post("/manage-batch", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { _id, inventoryId, ...details } = req.body; // _id is batch id

  try {
    const inventoryDetails = await Inventory.findById(inventoryId).session(
      session
    );
    if (!inventoryDetails) throw new Error("Item not found");

    // Force quantity to be a number -> parsing
    inventoryDetails.quantity = Number(inventoryDetails.quantity || 0);
    details.quantity = Number(details.quantity);

    // creating timeline for the batch
    const timeline = new StockTimeline({
      inventoryId: inventoryId,
      type: "Adjustment",
      batchNumber: details.batchNumber,
      createdBy: req.user._id,
      pack: details.pack,
      createdByName: req.user?.name,
    });

    if (_id) {
      const batchDetails = await InventoryBatch.findById(_id).session(session);
      if (!batchDetails) throw new Error("Batch not found");

      const oldQuantity = Number(batchDetails.quantity || 0);
      const newQuantity = Number(details.quantity || 0);

      if (newQuantity > oldQuantity) {
        timeline.credit = newQuantity - oldQuantity;
        inventoryDetails.quantity += timeline.credit;
      } else {
        timeline.debit = oldQuantity - newQuantity;
        inventoryDetails.quantity -= timeline.debit;
      }
      timeline.remarks = findChangesInObject(batchDetails, details);
      Object.assign(batchDetails, details);
      await batchDetails.save({ session });
    } else {
      const newBatch = new InventoryBatch({
        inventoryId: inventoryId,
        ...details,
      });
      await newBatch.save({ session });
      inventoryDetails.batch.push(newBatch._id);
      inventoryDetails.quantity += Number(details.quantity);
      timeline.credit = Number(details.quantity);
    }

    timeline.balance = Number(inventoryDetails.quantity);
    inventoryDetails.timeline.push(timeline._id);
    await timeline.save({ session });
    await inventoryDetails.save({ session });
    const updatedItem = await Inventory.findById(inventoryId)
      .populate("batch")
      .session(session);
    await session.commitTransaction();
    res.status(200).json(updatedItem);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// deleting batch
router.delete("/delete-batch/:batchId", async (req, res) => {
  const { batchId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const batch = await InventoryBatch.findByIdAndDelete(batchId).session(
      session
    );
    if (!batch) throw new Error("Batch not found");
    const inventoryDetails = await Inventory.findById(
      batch.inventoryId
    ).session(session);
    inventoryDetails.quantity -= Number(batch.quantity);
    // Remove the batch ID from the inventoryDetails.batch array
    inventoryDetails.batch = inventoryDetails.batch.filter(
      (id) => id.toString() !== batchId
    );
    const timeline = new StockTimeline({
      inventoryId: batch.inventoryId,
      type: "Adjustment",
      batchNumber: batch.batchNumber,
      debit: Number(batch.quantity),
      balance: Number(inventoryDetails.quantity),
    });
    await timeline.save({ session });
    await inventoryDetails.save({ session });
    const updatedItem = await Inventory.findById(batch.inventoryId)
      .populate("batch")
      .session(session);
    await session.commitTransaction();
    res.status(200).json(updatedItem);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

router.get("/timeline/:inventoryId", async (req, res) => {
  const { inventoryId } = req.params;
  const { page = 1 } = req.query;
  const limit = 20;
  const skip = (page - 1) * limit;
  const queryValue = { inventoryId };

  try {
    const [timeline, total] = await Promise.all([
      StockTimeline.find(queryValue)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockTimeline.countDocuments(queryValue),
    ]);

    res.status(200).json({
      timeline,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all batches..by inventory id
router.get("/batches/:inventoryId", verifyToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const batches = await InventoryBatch.find({ inventoryId });
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all inventory items
router.get("/", verifyToken, async (req, res) => {
  try {
    const items = await Inventory.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific inventory item by ID
router.get("/:inventoryId", verifyToken, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.inventoryId).populate(
      "batch"
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all unique group names
router.get("/groups/distinct", verifyToken, async (req, res) => {
  try {
    const distinctGroups = await Inventory.distinct("group");
    res.status(200).json(distinctGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign a group to multiple inventory items
router.post("/groups/assign", verifyToken, async (req, res) => {
  const { groupName, inventoryIds } = req.body;

  if (
    !groupName ||
    !inventoryIds ||
    !Array.isArray(inventoryIds) ||
    inventoryIds.length === 0
  ) {
    return res.status(400).json({
      message: "Group name and a list of inventory IDs are required.",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const operations = inventoryIds.map((inventoryId) => ({
      updateOne: {
        filter: { _id: inventoryId },
        update: { $addToSet: { group: groupName } }, // $addToSet adds only if value doesn't exist
      },
    }));

    if (operations.length > 0) {
      await Inventory.bulkWrite(operations, { session });
    }

    await session.commitTransaction();
    res.status(200).json({
      message: `Group '${groupName}' assigned successfully to specified items.`,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Rename a group and update its membership
router.post("/groups/update", verifyToken, async (req, res) => {
  const {
    oldGroupName,
    newGroupName,
    removeOldGroupIds,
    addNewGroupIds,
    renameGroupIds,
  } = req.body;

  if (!oldGroupName || !newGroupName) {
    return res.status(400).json({
      message:
        "Old group name, new group name, and all three ID arrays are required.",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Remove old group from specified items
    if (removeOldGroupIds?.length > 0) {
      await Inventory.updateMany(
        { _id: { $in: removeOldGroupIds } },
        { $pull: { group: oldGroupName } },
        { session }
      );
    }
    // 2. Add new group to specified items
    if (addNewGroupIds?.length > 0) {
      await Inventory.updateMany(
        { _id: { $in: addNewGroupIds } },
        { $addToSet: { group: newGroupName } },
        { session }
      );
    }
    // 3. Rename group for specified items
    if (renameGroupIds?.length > 0) {
      await Inventory.updateMany(
        { _id: { $in: renameGroupIds } },
        { $pull: { group: oldGroupName }, $addToSet: { group: newGroupName } },
        { session }
      );
    }
    await session.commitTransaction();
    res.status(200).json({
      message: `Group '${newGroupName}' updated successfully.`,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

export default router;
