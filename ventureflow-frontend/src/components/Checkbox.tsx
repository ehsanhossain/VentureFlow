import * as React from "react";

// Simple utility function to concatenate class names conditionally.
// Equivalent to popular 'clsx' or 'classnames' libraries for this basic use case.
const cn = (...classes: Array<string | undefined | null | false>): string => {
  return classes.filter(Boolean).join(" ");
};

// Custom Check Icon SVG to replace lucide-react's Check icon.
// This path is a common filled checkmark style.
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16" // Using a 16x16 viewBox
    fill="currentColor" // Ensures the icon takes the text color (e.g., text-white)
    aria-hidden="true" // Decorative icon
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.4167 5.41675C12.7323 5.73235 12.7323 6.2429 12.4167 6.5585L7.16667 11.8085C6.85108 12.1241 6.34053 12.1241 6.02494 11.8085L3.58333 9.36691C3.26774 9.05132 3.26774 8.54077 3.58333 8.22518C3.89892 7.90959 4.40947 7.90959 4.72506 8.22518L6.5958 10.0959L11.2751 5.41675C11.5906 5.10116 12.1012 5.10116 12.4167 5.41675Z"
    />
  </svg>
);

// Define the props for the Checkbox component.
// It extends standard HTML input attributes, omitting 'type' as it's fixed.
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /**
   * Optional children to render a label next to the checkbox.
   */
  children?: React.ReactNode;
  /**
   * Additional class names to apply to the checkbox's visual square.
   */
  className?: string; // This className applies to the visual checkbox square
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (props, ref) => {
    const {
      checked: controlledChecked, // The 'checked' prop for controlled behavior
      defaultChecked, // The 'defaultChecked' prop for uncontrolled initial state
      onChange: onPropsChange, // The 'onChange' handler from props
      children,
      className,
      disabled,
      ...restProps // Other native input attributes
    } = props;

    // Internal state for uncontrolled behavior
    // Initialize with defaultChecked if provided, otherwise false.
    const [internalIsChecked, setInternalIsChecked] = React.useState<boolean>(!!defaultChecked);

    // Determine if the component is controlled
    const isControlled = controlledChecked !== undefined;

    // Determine the actual checked state to display
    // If controlled, use controlledChecked. Otherwise, use internalIsChecked.
    const displayChecked = isControlled ? !!controlledChecked : internalIsChecked;

    // Handler for the native input's change event
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newCheckedState = event.target.checked;
      // If not controlled, update the internal state
      if (!isControlled) {
        setInternalIsChecked(newCheckedState);
      }
      // Call the onChange handler passed in props, if any
      if (onPropsChange) {
        onPropsChange(event);
      }
    };

    return (
      <label className={cn(
        "inline-flex items-center", // Basic layout for label container
        disabled ? "cursor-not-allowed" : "cursor-pointer" // Set cursor based on disabled state for the whole label
      )}>
        {/* Visually hidden native checkbox input */}
        {/* It handles state, focus, and accessibility. It's the 'peer'. */}
        <input
          type="checkbox"
          ref={ref}
          checked={displayChecked} // Use the derived checked state
          disabled={disabled}
          onChange={handleInputChange} // Use our combined handler
          className="sr-only peer" // "sr-only" hides it visually but keeps it accessible, "peer" enables styling its siblings based on its state
          {...restProps} // Pass through other props like name, value, etc.
        />
        {/* Custom visual representation of the checkbox */}
        <div
          className={cn(
            // Base styles for the checkbox square
            "h-[18px] w-[18px] shrink-0 rounded-[4px] border flex items-center justify-center",
            "transition-colors duration-200", // Smooth color transitions

            // --- DEFAULT / UNCHECKED & ENABLED ---
            "bg-white border-[#D0D5DD]", // Default background and border for unchecked state
            "peer-enabled:hover:bg-[#F9F5FF] peer-enabled:hover:border-[#7F56D9]", // Hover for unchecked & enabled

            // --- CHECKED & ENABLED ---
            // These styles are applied based on the 'peer' input's actual :checked state,
            // which is now correctly managed by 'displayChecked'.
            "peer-checked:bg-[#7F56D9] peer-checked:border-[#7F56D9]", // Styles when checked
            "peer-checked:peer-enabled:hover:bg-[#6941C6]", // Hover for checked & enabled

            // --- DISABLED STATE ---
            "peer-disabled:opacity-50",

            // --- FOCUS-VISIBLE STATE (applies when the hidden 'peer' input is focused via keyboard) ---
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#7F56D9] peer-focus-visible:ring-offset-2",
            
            // Allow user to pass custom classes to the visual box
            className
          )}
          aria-hidden="true" // Hide from accessibility tree as the input element is the semantic source
        >
          {/* Show checkmark icon based on the derived displayChecked state */}
          {displayChecked && <CheckIcon className="h-3.5 w-3.5 text-white" />}
        </div>
        {/* Optional label text */}
        {children && (
          <span className={cn(
            "ml-2 select-none", // Margin to space from checkbox, prevent text selection on click
            disabled ? "opacity-50" : "" // Dim label text when disabled
            // Consider adding default text styles, e.g., "text-sm text-gray-700" if needed
          )}>
            {children}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox"; // Set display name for easier debugging

export default Checkbox; // Changed to default export

// Example Usage (not part of the component file, for demonstration):
//
// const App = () => {
//   const [isChecked, setIsChecked] = React.useState(false);
//   const [isDisabled, setIsDisabled] = React.useState(false);
//
//   return (
//     <div className="p-4 space-y-4">
//       <Checkbox
//         checked={isChecked} // Controlled example
//         onChange={(e) => setIsChecked(e.target.checked)}
//         disabled={isDisabled}
//       >
//         Enable feature (Controlled)
//       </Checkbox>
//
//       <Checkbox
//         defaultChecked={true} // Uncontrolled example
//         onChange={(e) => 
//       >
//         Default Checked (Uncontrolled)
//       </Checkbox>
//
//       <Checkbox
//         disabled
//         checked={true} // Controlled and disabled
//       >
//         Checked and Disabled
//       </Checkbox>
//
//       <Checkbox
//         disabled
//         // defaultChecked={false} // or omit for unchecked disabled
//       >
//         Unchecked and Disabled
//       </Checkbox>
//
//       <button
//         onClick={() => setIsDisabled(!isDisabled)}
//         className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-[#064771] active:bg-[#053a5c] transition-colors"
//       >
//         Toggle First Checkbox Disable ({isDisabled ? "Enable" : "Disable"})
//       </button>
//     </div>
//   );
// };
//
// export default App; // If you want to run this example

