import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import { s3Domain } from "../assets/Data";
import { Backend_URL } from "../assets/Data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useSelector, useDispatch } from "react-redux";
import { fetchShopInfo, updateShopInfo } from "../redux/slices/shopSlice";
import { X, Plus, Upload } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

const ShopInfo = () => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { shopInfo, shopInfoStatus, updateStatus } = useSelector(
    (state) => state.shop
  );
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    address: "",
    contactNumber: "",
    email: "",
    website: "",
    shopId: "",
    gstNumber: "",
    itemExpiryThreshold: 3,
    itemCategories: [],
  });

  const [newCategory, setNewCategory] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    if (shopInfoStatus === "idle") {
      dispatch(fetchShopInfo());
    }
  }, [dispatch, shopInfoStatus]);

  useEffect(() => {
    if (shopInfo) {
      setFormData((prevData) => ({
        ...prevData,
        ...shopInfo,
      }));
      setLogoPreview(null);
    }
  }, [shopInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCategoryChange = (e, field) => {
    const categories = e.target.value.split(",").map((cat) => cat.trim());
    setFormData((prevData) => ({
      ...prevData,
      [field]: categories,
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    try {
      const response = await fetch(`${Backend_URL}/api/shops/getUploadUrl`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const data = await response.json();

      const res = await fetch(data.url, {
        method: "PUT",
        body: logoFile,
        headers: {
          "Content-Type": "image/png",
        },
      });
      if (!res.ok) {
        throw new Error("Failed to upload logo");
      } else {
        return `${s3Domain}/${data.key}`;
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Logo Upload Failed",
        description: "Failed to upload the logo. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const triggerLogoUpload = () => {
    document.getElementById("logo-upload").click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let updatedFormData = { ...formData };

      if (logoFile) {
        const logoUrl = await uploadLogo();
        if (logoUrl) {
          updatedFormData.logo = logoUrl;
        }
      }

      await dispatch(updateShopInfo(updatedFormData)).unwrap();
      toast({
        variant: "success",
        title: "Updated Successfully",
        description: "Shop information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Unable to update",
        description: "Failed to update shop information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = (field) => {
    if (newCategory.trim()) {
      setFormData((prevData) => ({
        ...prevData,
        [field]: [...prevData[field], newCategory.trim()],
      }));
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (field, index) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: prevData[field].filter((_, i) => i !== index),
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="border-b pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Shop Information Management
            </CardTitle>
            <CardDescription className="text-gray-500">
              Manage your shop's details
            </CardDescription>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={updateStatus === "loading"}
            className="w-full sm:w-auto"
          >
            {updateStatus === "loading" ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="shop" className="w-full">
          <TabsList className="grid w-full sm:w-1/2 grid-cols-2 mb-6">
            <TabsTrigger value="shop" className="text-sm font-medium">
              <span className="hidden sm:inline">Shop Information</span>
              <span className="sm:hidden">Shop</span>
            </TabsTrigger>
            <TabsTrigger value="shopSetting" className="text-sm font-medium">
              <span className="hidden sm:inline">Detailed Setting</span>
              <span className="sm:hidden">Detailed Setting</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                  label="Shop ID"
                  name="shopId"
                  value={formData.shopId}
                  onChange={handleChange}
                  disabled
                />
                <InputField
                  label="Shop Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Contact Number"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                />
                <InputField
                  label="GST Number"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                />
             
                <TextareaField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="lg:col-span-1">
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 flex items-center justify-center mb-4">
                  {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="mx-auto h-32 w-32 object-cover"
                        />
                      ) : shopInfo?.logoUsable ? (
                        <img
                          src={shopInfo.logoUsable}
                          alt="Pharmacy Logo"
                          className="mx-auto h-32 w-32 object-cover"
                        />
                      ) : formData.logo ? (
                        <img
                          src={formData.logo}
                          alt="Pharmacy Logo"
                          className="mx-auto h-32 w-32 object-cover"
                        />
                      ) : (
                        <img
                          src="https://via.placeholder.com/150"
                          alt="Placeholder"
                          className="mx-auto h-32 w-32 object-cover"
                        />
                      )}
                  </div>
                  <input
                    type="file"
                    id="logo-upload"
                    className="hidden"
                    onChange={handleLogoUpload}
                    accept="image/*"
                  />
                  <Button onClick={triggerLogoUpload} variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Change Logo
                  </Button>
                </div>
              </div>
            </div>
          
          </TabsContent>

          <TabsContent value="shopSetting">
            <div className="space-y-6">
              <InputField
                label="Item Expiry Threshold (in months)"
                name="itemExpiryThreshold"
                type="number"
                value={formData.itemExpiryThreshold}
                onChange={handleChange}
              />
              <CategoryField
                label="Item Categories"
                categories={formData.itemCategories}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                onAdd={() => handleAddCategory("itemCategories")}
                onRemove={(index) =>
                  handleRemoveCategory("itemCategories", index)
                }
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="font-medium">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    <Input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className="w-full"
    />
  </div>
);

const TextareaField = ({ label, name, value, onChange, required = false }) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="font-medium">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    <Textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full"
    />
  </div>
);

const CategoryField = ({
  label,
  categories,
  newCategory,
  setNewCategory,
  onAdd,
  onRemove,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd();
  };

  return (
    <div className="space-y-4">
      <Label className="font-medium text-base">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat, index) => (
          <Badge key={index} variant="secondary" className="text-sm">
            {cat}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="ml-2 text-gray-500 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </Badge>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
        <Input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Add new category"
          className="flex-grow"
        />
        <Button type="submit" size="icon" variant="outline">
          <Plus size={16} />
        </Button>
      </form>
    </div>
  );
};

export default ShopInfo;
