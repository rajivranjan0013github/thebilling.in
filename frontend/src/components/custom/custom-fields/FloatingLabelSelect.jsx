import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export const FloatingLabelSelect = ({
  id,
  label,
  value,
  onValueChange,
  error,
  children,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <Select
        id={id}
        value={value}
        onValueChange={(newValue) => {
          onValueChange(newValue);
          setIsFocused(false);
        }}
        onOpenChange={(open) => setIsFocused(open)}
      >
        <SelectTrigger
          className={`peer px-3 py-2 w-full border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 bg-white ${
            error && !value && !isFocused ? "border-red-500" : "border-gray-300"
          }`}
        >
          <label
            htmlFor={id}
            className={`absolute text-xs duration-300 font-medium transform -translate-y-1/2 left-3
            peer-placeholder-shown:text-sm peer-placeholder-shown:top-1/2
            peer-focus:text-xs peer-focus:top-0 peer-focus:-translate-y-1/2
            ${value || isFocused ? "top-0 -translate-y-1/2 text-xs" : "top-1/2"}
            ${error && !value && !isFocused ? "text-red-500" : "text-gray-500"}
            bg-white px-1`}
          >
            {label}
            {error && !value && !isFocused && (
              <span className="text-red-500 ml-1">*Required</span>
            )}
          </label>
          <SelectValue placeholder=" " />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
};
