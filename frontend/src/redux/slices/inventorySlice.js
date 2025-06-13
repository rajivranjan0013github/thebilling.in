import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";

const initialState = {
  items: [],
  itemsStatus: "idle",
  manageItemStatus: "idle",
  error: null,
};

// create new item
export const createInventory = createLoadingAsyncThunk(
  "inventory/createInventory",
  async (itemData) => {
    const response = await fetch(`${Backend_URL}/api/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemData),
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to create new item");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// update existing item
export const updateInventory = createLoadingAsyncThunk(
  "inventory/updateInventory",
  async (itemData) => {
    const { _id, ...updateData } = itemData;
    const response = await fetch(`${Backend_URL}/api/inventory/${_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to update item");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// Thunk for fetching items
export const fetchItems = createLoadingAsyncThunk(
  "inventory/fetchItems",
  async () => {
    const response = await fetch(`${Backend_URL}/api/inventory`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch items");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// Add new thunk for adjusting sto

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setItemStatusIdle: (state) => {
      state.itemsStatus = "idle";
      state.manageItemStatus = "idle";
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.itemsStatus = "loading";
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.itemsStatus = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.itemsStatus = "failed";
        state.error = action.error.message;
      })
      // Create inventory cases
      .addCase(createInventory.pending, (state) => {
        state.manageItemStatus = "loading";
      })
      .addCase(createInventory.fulfilled, (state, action) => {
        state.manageItemStatus = "succeeded";
        state.items.unshift(action.payload);
      })
      .addCase(createInventory.rejected, (state, action) => {
        state.manageItemStatus = "failed";
        state.error = action.error.message;
      })
      // Update inventory cases
      .addCase(updateInventory.pending, (state) => {
        state.manageItemStatus = "loading";
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.manageItemStatus = "succeeded";
        const itemIndex = state.items.findIndex(
          (item) => item._id === action.payload._id
        );
        if (itemIndex !== -1) {
          state.items[itemIndex] = action.payload;
        }
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.manageItemStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const { setItemStatusIdle } = inventorySlice.actions;

export default inventorySlice.reducer;
