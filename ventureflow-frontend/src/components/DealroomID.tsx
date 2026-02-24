/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import * as React from "react";
import { Controller, Control } from "react-hook-form";
import { PencilIcon, CornerDownLeftIcon, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

interface DealroomIDProps {
  name: string;
  control: Control<Record<string, string>>;
  label: string;
  description: string;
  iconSrc?: string | React.ReactNode;
  onSave: (newId: string) => void;
  validateId?: (id: string) => boolean;
  isChecking?: boolean;
  isAvailable?: boolean | null;
}

export const DealroomID: React.FC<DealroomIDProps> = ({
  name,
  control,
  label,
  description,
  iconSrc = "/vector.svg",
  onSave,
  validateId = (id) => id.length > 5, // Flexible validation
  isChecking = false,
  isAvailable = null,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);

  return (
    <Card className="w-[347px] bg-[#f1fcff] border-none shadow-none">
      <CardContent className="p-4">
        <div className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-[7px]">
            {/* Static icon */}
            <svg
              width="25"
              height="24"
              viewBox="0 0 25 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.36 2H16.64L22.5 7.86V16.14L16.64 22H8.36L2.5 16.14V7.86L8.36 2Z"
                stroke="#FF8400"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.5 16H12.51"
                stroke="#FF8400"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.5 8V12"
                stroke="#FF8400"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="font-semibold text-black text-base">
              {label}
            </h3>
          </div>

          <div className="flex flex-col gap-[18px]">
            <p className="text-gray-900 text-sm">
              {description}
            </p>

            <Controller
              name={name}
              control={control}
              render={({ field, fieldState }) => {
                const labelId = `${name}-dealroom-label`;
                const inputId = `${name}-dealroom-input`;
                const handleSave = () => {
                  if (validateId(field.value)) {
                    onSave(field.value);
                    setIsEditing(false);
                  } else {
                    alert("Invalid ID format. Please use format: XX-X-XXX");
                  }
                };

                return (
                  <div className="flex flex-col gap-4" role="group" aria-labelledby={labelId}>
                    <label
                      id={labelId}
                      htmlFor={inputId}
                      className="font-medium text-gray-900 text-base"
                    >
                      {label}
                    </label>

                    <div className="flex items-center justify-between bg-[#064771] text-white rounded-[5px] px-4 py-[13px] h-10">
                      <div className="flex items-center gap-2">
                        {iconSrc}
                        {isEditing ? (
                          <div className="relative flex items-center">
                            <input
                              {...field}
                              id={inputId}
                              type="text"
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSave();
                                } else if (e.key === "Escape") {
                                  setIsEditing(false);
                                }
                              }}
                              className="bg-transparent font-semibold text-[22.4px] leading-6 outline-none w-[150px]"
                              autoFocus
                              aria-label="Project Code"
                            />
                            <div className="ml-2 flex items-center gap-1">
                              {isChecking && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                              {!isChecking && isAvailable === true && <Check className="w-5 h-5 text-green-400" />}
                              {!isChecking && isAvailable === false && <AlertCircle className="w-5 h-5 text-red-400" />}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[22.4px] leading-6">
                              {field.value}
                            </span>
                            {!isChecking && isAvailable === true && <Check className="w-4 h-4 text-green-400" />}
                            {!isChecking && isAvailable === false && <AlertCircle className="w-4 h-4 text-red-400" />}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="p-1 bg-white text-[#064771] hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          if (isEditing) {
                            handleSave();
                          } else {
                            setIsEditing(true);
                          }
                        }}
                        title={isEditing ? "Save" : "Edit"}
                      >
                        {isEditing ? (
                          <CornerDownLeftIcon className="w-5 h-5" />
                        ) : (
                          <PencilIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {fieldState.error && (
                      <span className="text-sm text-red-500 mt-1">
                        {fieldState.error.message}
                      </span>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
