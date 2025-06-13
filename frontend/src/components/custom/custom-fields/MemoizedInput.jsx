import React, { useState, forwardRef } from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

// Wrap core component with forwardRef so parents can grab the underlying <input /> element.
const CoreInput = (
  { id, label, type = "text", value, onChange, error, ...restProps },
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);

  const showError = error && !value && !isFocused;

  return (
    <div className="relative">
      <Input
        id={id}
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`peer px-3 font-semibold hover:cursor-pointer py-2 block w-full border !rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 bg-white ${
          showError ? "border-red-500" : "border-gray-300"
        }`}
        placeholder=" "
        {...restProps}
      />
      <Label
        htmlFor={id}
        className={`absolute text-xs duration-300 transform -translate-y-1/2 left-3
          peer-placeholder-shown:text-sm peer-placeholder-shown:top-1/2
          peer-focus:text-xs peer-focus:top-0 peer-focus:-translate-y-1/2
          ${value || isFocused ? "top-0 -translate-y-1/2 text-xs" : "top-1/2"}
          ${showError ? "text-red-500" : "text-gray-500"}
          bg-white px-1`}
      >
        {label}{" "}
        {showError && <span className="text-red-500 ml-1">*Required</span>}
      </Label>
    </div>
  );
};

// Memoize the forwardRef component to avoid unnecessary re-renders
const MemoizedInput = React.memo(forwardRef(CoreInput));

MemoizedInput.displayName = "MemoizedInput";

export default MemoizedInput;
