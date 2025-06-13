import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { useDispatch } from "react-redux";
import {
  createInventory,
  updateInventory,
} from "../../../redux/slices/inventorySlice";
import { useToast } from "../../../hooks/use-toast";
// import { MEDICINE_FORMS } from "../../../assets/Data";
import { Separator } from "../../ui/separator";
import { Switch } from "../../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { primaryUnit } from "../../../assets/Data";
import SearchSuggestion from "../custom-fields/CustomSearchSuggestion";
import MemoizedInput from "../custom-fields/MemoizedInput";

const unitSuggestions = primaryUnit.map((unit) => ({
  id: unit,
  name: unit,
}));

const FORMDATAINITIAL = {
  name: "",
  mfcName: "",
  mrp: "",
  saleRate: "",
  purchaseRate: "",
  category: "",
  location: "",
  isBatchTracked: false,
  HSN: "",
  quantity: "",
  primaryUnit: "",
  secondaryUnit: "",
  pack: 1,
  gstPer: "",
};

export default function AddNewInventory({
  open,
  onOpenChange,
  inventoryDetails,
  onProductCreated,
  initialProductName,
}) {
  const inputRef = useRef([]);
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(FORMDATAINITIAL);
  const [batchDetails, setBatchDetails] = useState({
    batchNumber: "",
    expiry: "",
    quantity: "",
    purchaseRate: "",
    mrp: "",
    saleRate: "",
    gstPer: "",
    location: "",
    HSN: "",
  });
  const [primaryUnitSearch, setPrimaryUnitSearch] = useState("");
  const [secondaryUnitSearch, setSecondaryUnitSearch] = useState("");

  // Determine if batch tracking has just been enabled while editing an existing item
  const isNewlyEnabledBatchTracking =
    !!inventoryDetails &&
    inventoryDetails.isBatchTracked === false &&
    formData.isBatchTracked === true;

  useEffect(() => {
    if (inventoryDetails) {
      setFormData({
        name: inventoryDetails.name || "",
        mfcName: inventoryDetails.mfcName || "",
        mrp: inventoryDetails.mrp || "",
        purchaseRate: inventoryDetails.purchaseRate || "",
        saleRate: inventoryDetails.saleRate || "",
        category: inventoryDetails.category || "",
        location: inventoryDetails?.location || "",
        isBatchTracked: inventoryDetails.isBatchTracked ?? true,
        HSN: inventoryDetails.HSN || "",
        quantity: inventoryDetails.quantity || "",
        primaryUnit: inventoryDetails.primaryUnit || "",
        secondaryUnit: inventoryDetails.secondaryUnit || "",
        pack: inventoryDetails.pack || 1,
        gstPer: inventoryDetails.gstPer || "",
      });
      setPrimaryUnitSearch(inventoryDetails.primaryUnit || "");
      setSecondaryUnitSearch(inventoryDetails.secondaryUnit || "");
    }
  }, [inventoryDetails]);

  // Sync batch quantity to form quantity for new items is now handled in onChange events

  // Set pack to 1 if secondary unit is cleared
  useEffect(() => {
    if (!formData.secondaryUnit) {
      setFormData((prev) => ({ ...prev, pack: 1 }));
    }
  }, [formData.secondaryUnit]);

  // Effect to pre-fill name and focus when dialog opens for a new product with initialProductName
  useEffect(() => {
    if (open && !inventoryDetails && initialProductName) {
      setFormData((prev) => ({ ...prev, name: initialProductName }));
      // Delay focus slightly to ensure the input is rendered and ready
      setTimeout(() => {
        inputRef.current["name"]?.focus();
      }, 0);
    } else if (open && !inventoryDetails && !initialProductName) {
      // If dialog opens for new product without initial name, focus the name field by default
      setTimeout(() => {
        inputRef.current["name"]?.focus();
      }, 0);
    }
    // Reset form when dialog closes and it's not an update
    if (!open && !inventoryDetails) {
      setFormData(FORMDATAINITIAL);
      setBatchDetails({
        batchNumber: "",
        expiry: "",
        quantity: "",
        purchaseRate: "",
        mrp: "",
        saleRate: "",
        gstPer: "",
        location: "",
        HSN: "",
      });
      setPrimaryUnitSearch("");
      setSecondaryUnitSearch("");
    }
  }, [open, inventoryDetails, initialProductName, inputRef]);

  // Sync form data to batch details when batch tracking is enabled for a new product
  useEffect(() => {
    if (
      formData.isBatchTracked &&
      (!inventoryDetails || isNewlyEnabledBatchTracking)
    ) {
      setBatchDetails((prevBatchDetails) => ({
        ...prevBatchDetails,
        purchaseRate: formData.purchaseRate,
        mrp: formData.mrp,
        saleRate: formData.saleRate,
        gstPer: formData.gstPer,
        location: formData.location,
        HSN: formData.HSN,
        quantity: formData.quantity,
        primaryUnit: formData.primaryUnit,
        secondaryUnit: formData.secondaryUnit,
      }));
    }
  }, [
    formData.isBatchTracked,
    formData.purchaseRate,
    formData.mrp,
    formData.saleRate,
    formData.gstPer,
    formData.location,
    formData.HSN,
    formData.quantity,
    inventoryDetails,
    isNewlyEnabledBatchTracking,
  ]);
  const [error, setError] = useState([]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = "Name is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.primaryUnit) {
      newErrors.primaryUnit = "Primary unit is required";
    }
    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isValid = validate();
    console.log("formData", formData);
    console.log("error", error);
    console.log("isValid", isValid);
    if (!isValid) {
      setIsLoading(false);
      return;
    }

    const submitData = {
      ...formData,
      quantity: formData.quantity * formData.pack,
    };
    const batchData = {
      ...batchDetails,
      quantity: formData.quantity * formData.pack,
    };

    if (
      formData.isBatchTracked &&
      (!inventoryDetails || isNewlyEnabledBatchTracking)
    ) {
      submitData.batchDetails = batchData;
    }
    console.log(submitData);

    const action = inventoryDetails
      ? updateInventory({ ...submitData, _id: inventoryDetails._id })
      : createInventory(submitData);

    dispatch(action)
      .unwrap()
      .then((newlyCreatedProduct) => {
        toast({
          title: inventoryDetails
            ? `Product updated successfully`
            : `New product added successfully`,
          variant: "success",
        });
        onOpenChange(false);
        if (onProductCreated && !inventoryDetails) {
          onProductCreated(newlyCreatedProduct);
        }
        if (!inventoryDetails) {
          setFormData(FORMDATAINITIAL);
          setPrimaryUnitSearch("");
          setSecondaryUnitSearch("");
          setBatchDetails({ batchNumber: "", expiry: "", quantity: "" });
        }
      })
      .catch((error) => {
        toast({
          title: inventoryDetails
            ? `Failed to update product`
            : `Failed to add new product`,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getInputKeys = () => {
    const baseKeys = ["name", "category", "primaryUnit", "secondaryUnit"];

    if (formData.secondaryUnit) {
      baseKeys.push("pack");
    }

    baseKeys.push("mfcName", "isBatchTracked");

    const batchKeys = [];
    if (
      formData.isBatchTracked &&
      (!inventoryDetails || isNewlyEnabledBatchTracking)
    ) {
      batchKeys.push(
        "batchNumber",
        "expiry",
        "batchQuantity",
        "batchPurchasePrice",
        "batchMrp",
        "batchSalePrice",
        "batchGst",
        "batchLocation",
        "batchHsn"
      );
    }

    const pricingKeys = [];
    if (!formData.isBatchTracked) {
      pricingKeys.push("purchaseRate", "mrp", "saleRate", "gstPer");
    }

    const stockKeys = ["quantity", "location", "HSN"];

    return [
      ...baseKeys,
      ...batchKeys,
      ...pricingKeys,
      ...stockKeys,
      "submitButton",
    ];
  };

  const handleKeyDown = (e, currentKey) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputKeys = getInputKeys();
      const currentIndex = inputKeys.indexOf(currentKey);
      if (e.shiftKey) {
        // Move to previous input on Shift+Enter
        if (currentIndex > 0) {
          const prevKey = inputKeys[currentIndex - 1];
          inputRef.current[prevKey]?.focus();
        }
      } else {
        // Move to next input on Enter
        if (currentIndex < inputKeys.length - 1) {
          const nextKey = inputKeys[currentIndex + 1];
          inputRef.current[nextKey]?.focus();
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-2 gap-0  rounded-lg">
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between bg-gray-50 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {inventoryDetails ? "Edit Product" : "Create New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6" style={{ minHeight: "400px" }}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                {formData.isBatchTracked && (
                  <TabsTrigger value="batch">Batch Tracking</TabsTrigger>
                )}
                <TabsTrigger value="stock">Pricing & Stock</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-6">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div className="space-y-2">
                      <MemoizedInput
                        id="name"
                        label={
                          <>
                            Product Name<span className="text-red-500">*</span>
                          </>
                        }
                        data-dialog-autofocus={
                          !initialProductName && !inventoryDetails
                        }
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        onKeyDown={(e) => handleKeyDown(e, "name")}
                        ref={(el) => (inputRef.current["name"] = el)}
                        error={error.name}
                      />
                    </div>

                    <div className="space-y-2">
                      <MemoizedInput
                        id="category"
                        label="Product Category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "category")}
                        ref={(el) => (inputRef.current["category"] = el)}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-x-6 gap-y-5 col-span-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="primaryUnit"
                          className="text-sm font-medium text-gray-700"
                        >
                          Primary Unit
                        </Label>
                        <SearchSuggestion
                          id="primaryUnit"
                          suggestions={unitSuggestions}
                          value={primaryUnitSearch}
                          setValue={setPrimaryUnitSearch}
                          onSuggestionSelect={(suggestion) => {
                            setFormData({
                              ...formData,
                              primaryUnit: suggestion.name,
                            });
                            setPrimaryUnitSearch(suggestion.name);
                          }}
                          onKeyDown={(e) => handleKeyDown(e, "primaryUnit")}
                          ref={(el) => (inputRef.current["primaryUnit"] = el)}
                          className="h-9 font-semibold hover:cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="secondaryUnit"
                          className="text-sm font-medium text-gray-700"
                        >
                          Secondary Unit
                        </Label>
                        <SearchSuggestion
                          id="secondaryUnit"
                          suggestions={unitSuggestions}
                          value={secondaryUnitSearch}
                          setValue={setSecondaryUnitSearch}
                          onSuggestionSelect={(suggestion) => {
                            setFormData({
                              ...formData,
                              secondaryUnit: suggestion.name,
                            });
                            setSecondaryUnitSearch(suggestion.name);
                          }}
                          onKeyDown={(e) => handleKeyDown(e, "secondaryUnit")}
                          ref={(el) => (inputRef.current["secondaryUnit"] = el)}
                          className="h-9 font-semibold hover:cursor-pointer"
                        />
                      </div>

                      {formData.secondaryUnit && (
                        <div className="space-y-2">
                          <Label
                            htmlFor="pack"
                            className="text-sm font-medium text-gray-700"
                          >
                            Conversion
                          </Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800 font-medium whitespace-nowrap">
                              1 {formData.primaryUnit || "Unit"} =
                            </span>
                            <Input
                              id="pack"
                              type="number"
                              value={formData.pack}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  pack: e.target.value,
                                })
                              }
                              onKeyDown={(e) => handleKeyDown(e, "pack")}
                              ref={(el) => (inputRef.current["pack"] = el)}
                              className="h-9 font-semibold w-24 text-center"
                            />
                            <span className="text-sm text-gray-800 font-medium">
                              {formData.secondaryUnit}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <MemoizedInput
                        id="mfcName"
                        label={
                          <>
                            Company Name<span className="text-red-500">*</span>
                          </>
                        }
                        required
                        value={formData.mfcName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mfcName: e.target.value,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "mfcName")}
                        ref={(el) => (inputRef.current["mfcName"] = el)}
                      />
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Label
                        htmlFor="isBatchTracked"
                        className="text-sm font-medium text-gray-800 cursor-pointer"
                      >
                        Track Batches for this Product
                      </Label>
                      <p className="text-xs text-gray-500">
                        Enable to manage inventory by batch number & expiry
                        date.
                      </p>
                    </div>
                    <Switch
                      id="isBatchTracked"
                      checked={formData.isBatchTracked}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isBatchTracked: checked })
                      }
                      onKeyDown={(e) => handleKeyDown(e, "isBatchTracked")}
                      ref={(el) => (inputRef.current["isBatchTracked"] = el)}
                    />
                  </div>
                </div>
              </TabsContent>
              {formData.isBatchTracked && (
                <TabsContent value="batch" className="mt-6">
                  {!inventoryDetails || isNewlyEnabledBatchTracking ? (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50/80">
                      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">
                        Initial Batch Details
                      </h3>
                      <div className="grid grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <MemoizedInput
                            id="batchNumber"
                            label={
                              <>
                                Batch No.<span className="text-red-500">*</span>
                              </>
                            }
                            value={batchDetails.batchNumber}
                            onChange={(e) =>
                              setBatchDetails({
                                ...batchDetails,
                                batchNumber: e.target.value,
                              })
                            }
                            onKeyDown={(e) => handleKeyDown(e, "batchNumber")}
                            ref={(el) => (inputRef.current["batchNumber"] = el)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <MemoizedInput
                            id="expiry"
                            label="Expiry Date"
                            type="date"
                            value={batchDetails.expiry}
                            onChange={(e) =>
                              setBatchDetails({
                                ...batchDetails,
                                expiry: e.target.value,
                              })
                            }
                            onKeyDown={(e) => handleKeyDown(e, "expiry")}
                            ref={(el) => (inputRef.current["expiry"] = el)}
                          />
                        </div>
                        <div className="space-y-2">
                          <MemoizedInput
                            id="batchQuantity"
                            label={
                              <>
                                Quantity<span className="text-red-500">*</span>
                              </>
                            }
                            type="number"
                            value={batchDetails.quantity}
                            onChange={(e) => {
                              const newQuantity = e.target.value;
                              setBatchDetails({
                                ...batchDetails,
                                quantity: newQuantity,
                              });
                              setFormData({
                                ...formData,
                                quantity: newQuantity,
                              });
                            }}
                            onKeyDown={(e) => handleKeyDown(e, "batchQuantity")}
                            ref={(el) =>
                              (inputRef.current["batchQuantity"] = el)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <MemoizedInput
                            id="batchPurchasePrice"
                            label={
                              <>
                                Purchase Price
                                <span className="text-red-500">*</span>
                              </>
                            }
                            type="number"
                            required
                            value={batchDetails.purchaseRate}
                            onChange={(e) => {
                              const newPrice = e.target.value;
                              setBatchDetails({
                                ...batchDetails,
                                purchaseRate: newPrice,
                              });
                              setFormData({
                                ...formData,
                                purchaseRate: newPrice,
                              });
                            }}
                            onKeyDown={(e) =>
                              handleKeyDown(e, "batchPurchasePrice")
                            }
                            ref={(el) =>
                              (inputRef.current["batchPurchasePrice"] = el)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <MemoizedInput
                            id="batchMrp"
                            label={
                              <>
                                MRP<span className="text-red-500">*</span>
                                <span className="text-xs text-gray-500">
                                  {" "}
                                  (incl. tax)
                                </span>
                              </>
                            }
                            type="number"
                            required
                            value={batchDetails.mrp}
                            onChange={(e) => {
                              const newPrice = e.target.value;
                              setBatchDetails({
                                ...batchDetails,
                                mrp: newPrice,
                              });
                              setFormData({ ...formData, mrp: newPrice });
                            }}
                            onKeyDown={(e) => handleKeyDown(e, "batchMrp")}
                            ref={(el) => (inputRef.current["batchMrp"] = el)}
                          />
                        </div>
                        <div className="space-y-2">
                          <MemoizedInput
                            id="batchSalePrice"
                            label={
                              <>
                                Sale Price
                                <span className="text-red-500">*</span>
                                <span className="text-xs text-gray-500">
                                  {" "}
                                  (incl. tax)
                                </span>
                              </>
                            }
                            type="number"
                            required
                            value={batchDetails.saleRate}
                            onChange={(e) => {
                              const newPrice = e.target.value;
                              setBatchDetails({
                                ...batchDetails,
                                saleRate: newPrice,
                              });
                              setFormData({
                                ...formData,
                                saleRate: newPrice,
                              });
                            }}
                            onKeyDown={(e) =>
                              handleKeyDown(e, "batchSalePrice")
                            }
                            ref={(el) =>
                              (inputRef.current["batchSalePrice"] = el)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <MemoizedInput
                            id="batchGst"
                            label="GST (%)"
                            type="number"
                            value={batchDetails.gstPer}
                            onChange={(e) => {
                              const newGst = e.target.value;
                              setBatchDetails({
                                ...batchDetails,
                                gstPer: newGst,
                              });
                              setFormData({
                                ...formData,
                                gstPer: newGst,
                              });
                            }}
                            onKeyDown={(e) => handleKeyDown(e, "batchGst")}
                            ref={(el) => (inputRef.current["batchGst"] = el)}
                          />
                        </div>
                        <div className="space-y-2">
                          <MemoizedInput
                            id="batchLocation"
                            label="Location"
                            value={batchDetails.location}
                            onChange={(e) => {
                              const newLocation = e.target.value;
                              setBatchDetails({
                                ...batchDetails,
                                location: newLocation,
                              });
                              setFormData({
                                ...formData,
                                location: newLocation,
                              });
                            }}
                            onKeyDown={(e) => handleKeyDown(e, "batchLocation")}
                            ref={(el) =>
                              (inputRef.current["batchLocation"] = el)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <MemoizedInput
                            id="batchHsn"
                            label="HSN Code"
                            value={batchDetails.HSN}
                            onChange={(e) => {
                              const newHsn = e.target.value;
                              setBatchDetails({
                                ...batchDetails,
                                HSN: newHsn,
                              });
                              setFormData({
                                ...formData,
                                HSN: newHsn,
                              });
                            }}
                            onKeyDown={(e) => handleKeyDown(e, "batchHsn")}
                            ref={(el) => (inputRef.current["batchHsn"] = el)}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-500 bg-gray-50 rounded-lg p-8">
                      Batch details can be managed from the main inventory page.
                    </div>
                  )}
                </TabsContent>
              )}
              <TabsContent value="stock" className="mt-6">
                {formData.isBatchTracked && (
                  <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800">
                    Pricing & Stock for batch-tracked items are managed in the
                    "Batch Tracking" tab for new products or on the inventory
                    page for existing ones.
                  </div>
                )}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div className="space-y-2">
                      <MemoizedInput
                        id="purchaseRate"
                        label={
                          <>
                            Purchase Price
                            <span className="text-red-500">*</span>
                          </>
                        }
                        type="number"
                        required
                        value={formData.purchaseRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchaseRate: e.target.value,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "purchaseRate")}
                        ref={(el) => (inputRef.current["purchaseRate"] = el)}
                        disabled={formData.isBatchTracked}
                      />
                    </div>

                    <div className="space-y-2">
                      <MemoizedInput
                        id="mrp"
                        label={
                          <>
                            MRP<span className="text-red-500">*</span>
                            <span className="text-xs text-gray-500">
                              {" "}
                              (incl. tax)
                            </span>
                          </>
                        }
                        type="number"
                        required
                        value={formData.mrp}
                        onChange={(e) =>
                          setFormData({ ...formData, mrp: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "mrp")}
                        ref={(el) => (inputRef.current["mrp"] = el)}
                        disabled={formData.isBatchTracked}
                      />
                    </div>

                    <div className="space-y-2">
                      <MemoizedInput
                        id="saleRate"
                        label={
                          <>
                            Sale Price<span className="text-red-500">*</span>
                            <span className="text-xs text-gray-500">
                              {" "}
                              (incl. tax)
                            </span>
                          </>
                        }
                        type="number"
                        required
                        value={formData.saleRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            saleRate: e.target.value,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "saleRate")}
                        ref={(el) => (inputRef.current["saleRate"] = el)}
                        disabled={formData.isBatchTracked}
                      />
                    </div>

                    <div className="space-y-2">
                      <MemoizedInput
                        id="gstPer"
                        label="GST (%)"
                        type="number"
                        value={formData.gstPer}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gstPer: e.target.value,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "gstPer")}
                        ref={(el) => (inputRef.current["gstPer"] = el)}
                        disabled={formData.isBatchTracked}
                      />
                    </div>

                    <div className="space-y-2">
                      <MemoizedInput
                        id="quantity"
                        label="Quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => {
                          const newQuantity = e.target.value;
                          setFormData({
                            ...formData,
                            quantity: newQuantity,
                          });
                          if (formData.isBatchTracked && !inventoryDetails) {
                            setBatchDetails({
                              ...batchDetails,
                              quantity: newQuantity,
                            });
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, "quantity")}
                        ref={(el) => (inputRef.current["quantity"] = el)}
                        disabled={formData.isBatchTracked && !inventoryDetails}
                      />
                    </div>

                    <div className="space-y-2">
                      <MemoizedInput
                        id="location"
                        label="Location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: e.target.value,
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "location")}
                        ref={(el) => (inputRef.current["location"] = el)}
                        disabled={formData.isBatchTracked}
                      />
                    </div>

                    <div className="space-y-2">
                      <MemoizedInput
                        id="HSN"
                        label="HSN Code"
                        value={formData.HSN}
                        onChange={(e) =>
                          setFormData({ ...formData, HSN: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "HSN")}
                        ref={(el) => (inputRef.current["HSN"] = el)}
                        disabled={formData.isBatchTracked}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-4 bg-gray-50 border-t flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                onOpenChange(false);
              }}
              disabled={isLoading}
              className="rounded-md"
            >
              Cancel
            </Button>
            <Button
              id="submitButton"
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              ref={(el) => (inputRef.current["submitButton"] = el)}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-md"
            >
              {isLoading
                ? inventoryDetails
                  ? "Updating..."
                  : "Creating..."
                : inventoryDetails
                ? "Update"
                : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
