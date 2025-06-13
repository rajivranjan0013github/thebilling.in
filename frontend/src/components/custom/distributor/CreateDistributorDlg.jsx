import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createDistributor,
  updateDistributor,
} from "../../../redux/slices/distributorSlice";
import { Button } from "../../ui/button";
import MemoizedInput from "../custom-fields/MemoizedInput";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useToast } from "../../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Separator } from "../../ui/separator";

const INITIAL_FORM_DATA = {
  name: "",
  mob: "",
  email: "",
  openBalance: "",
  balance_type: "collect",
  gstin: "",
  DLNumber: "",
  address: "",
  bankDetails: {
    accountNumber: "",
    ifsc: "",
  },
};

export default function CreateDistributorDlg({
  open,
  onOpenChange,
  onSuccess,
  distributorToEdit,
  initialData,
}) {
  const inputRef = useRef([]);
  const dispatch = useDispatch();
  const { createDistributorStatus, updateDistributorStatus } = useSelector(
    (state) => state.distributor
  );
  const { toast } = useToast();

  const inputKeys = [
    "name",
    "openBalance",
    "balance_type",
    "mob",
    "email",
    "gstin",
    "accountNumber",
    "ifsc",
    "address",
    "save_button",
  ];

  // handling button shortcuts
  const handleKeyDown = (e, currentKey) => {
    if (e.key === "Enter") {
      e.preventDefault();
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

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  useEffect(() => {
    if (distributorToEdit) {
      setFormData({
        ...distributorToEdit,
        balance_type: distributorToEdit.openBalance >= 0 ? "collect" : "pay",
        openBalance: Math.abs(distributorToEdit.openBalance || 0).toString(),
        bankDetails: {
          accountNumber: distributorToEdit.bankDetails?.accountNumber || "",
          ifsc: distributorToEdit.bankDetails?.ifsc || "",
        },
      });
    } else if (initialData) {
      setFormData({
        ...INITIAL_FORM_DATA,
        ...initialData,
        bankDetails: {
          accountNumber: initialData.accountNumber || "",
          ifsc: initialData.ifsc || "",
        },
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [distributorToEdit, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "accountNumber" || name === "ifsc") {
      setFormData({
        ...formData,
        bankDetails: {
          ...formData.bankDetails,
          [name]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const distributorData = { ...formData };
      // Convert opening balance to number and adjust sign based on balance_type
      let openBalance = Number(distributorData.openBalance);
      if (distributorData.balance_type === "pay" && openBalance > 0) {
        openBalance = -openBalance;
      } else if (
        distributorData.balance_type === "collect" &&
        openBalance < 0
      ) {
        openBalance = Math.abs(openBalance);
      }
      distributorData.openBalance = openBalance;

      let result;
      if (distributorToEdit) {
        result = await dispatch(
          updateDistributor({
            id: distributorToEdit._id,
            distributorData,
          })
        ).unwrap();
        toast({
          title: "Distributor updated successfully",
          variant: "success",
        });
      } else {
        result = await dispatch(createDistributor(distributorData)).unwrap();
        toast({
          title: "Distributor created successfully",
          variant: "success",
        });
      }

      onOpenChange(false);
      onSuccess?.(result);
      if (!distributorToEdit) {
        setFormData(INITIAL_FORM_DATA);
      }
    } catch (error) {
      toast({
        title: distributorToEdit
          ? "Failed to update distributor"
          : "Failed to create distributor",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Add a small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      if (open && inputRef.current["name"]) {
        inputRef.current["name"]?.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [open]);

  const isLoading =
    createDistributorStatus === "loading" ||
    updateDistributorStatus === "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 font-roboto">
        <DialogHeader className="px-6 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
          <DialogTitle className="font-medium">
            {distributorToEdit ? "Edit Distributor" : "Create Distributor"}
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <form
          id="createDistributorForm"
          onSubmit={handleSubmit}
          className="p-6"
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <MemoizedInput
                    id="name"
                    name="name"
                    label="Distributor Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, "name")}
                    ref={(el) => (inputRef.current["name"] = el)}
                    required
                  />
                </div>
                <div className="w-[180px]">
                  <MemoizedInput
                    id="openBalance"
                    name="openBalance"
                    type="number"
                    label="Balance"
                    value={formData.openBalance}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, "openBalance")}
                    ref={(el) => (inputRef.current["openBalance"] = el)}
                  />
                </div>
                <div className="w-[160px]">
                  <Select
                    value={formData.balance_type}
                    onValueChange={(value) =>
                      handleSelectChange("balance_type", value)
                    }
                  >
                    <SelectTrigger
                      className="h-8 mt-1.5 text-sm"
                      ref={(el) => (inputRef.current["balance_type"] = el)}
                      onKeyDown={(e) => handleKeyDown(e, "balance_type")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collect">To Collect</SelectItem>
                      <SelectItem value="pay">To Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <MemoizedInput
                    id="mob"
                    name="mob"
                    label="Mobile Number"
                    value={formData.mob}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, "mob")}
                    ref={(el) => (inputRef.current["mob"] = el)}
                  />
                </div>
                <div>
                  <MemoizedInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, "email")}
                    ref={(el) => (inputRef.current["email"] = el)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <MemoizedInput
                    id="gstin"
                    name="gstin"
                    label="GSTIN"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, "gstin")}
                    ref={(el) => (inputRef.current["gstin"] = el)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <MemoizedInput
                    id="accountNumber"
                    name="accountNumber"
                    label="Bank Account Number"
                    value={formData.bankDetails.accountNumber}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, "accountNumber")}
                    ref={(el) => (inputRef.current["accountNumber"] = el)}
                  />
                </div>
                <div>
                  <MemoizedInput
                    id="ifsc"
                    name="ifsc"
                    label="IFSC Code"
                    value={formData.bankDetails.ifsc}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, "ifsc")}
                    ref={(el) => (inputRef.current["ifsc"] = el)}
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-xs font-medium ">
                  Address Details
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  className="w-full h-[60px] p-2 mt-1 rounded-md border border-input text-sm font-semibold resize-none focus:ring-2 focus:ring-blue-500"
                  value={formData.address}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, "address")}
                  ref={(el) => (inputRef.current["address"] = el)}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-3 bg-gray-50 border-t flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-sm px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="createDistributorForm"
            ref={(el) => (inputRef.current["save_button"] = el)}
            disabled={isLoading}
            className="h-8 px-10 text-sm bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
