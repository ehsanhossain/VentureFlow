// FileUpload.tsx
import React, {
  useState,
  useRef,
  DragEvent,
  ChangeEvent,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import api from "../config/api"; 
import axios from "axios";
import { showAlert } from "./Alert";


const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

// --- Define Types ---

type UploadState = "initial" | "selected" | "uploading" | "failed" | "success";

// Configuration for a specific state
interface StateConfig {
  title: string | ((files: File[]) => string);
  subtitle?: string | ((files: File[]) => string);
  icon?: JSX.Element;
  progress?: number; // Only relevant for 'uploading' state
  badge?: string | ((files: File[]) => string);
  primaryButton?: ButtonConfig;
  secondaryButton?: ButtonConfig;
  cancelButton?: ButtonConfig; 
  tryAgainButton?: ButtonConfig; 
  doneButton?: ButtonConfig; 
  background?: string;
  showBadgeComponent?: boolean;
}

// Configuration for buttons
interface ButtonConfig {
  text: string;
  icon?: JSX.Element;
  action?: "browse" | "upload" | "cancel" | "reset" | "done";
  onClick?: () => void; 
}

// Props for the reusable FileUpload component
interface FileUploadProps {
  config: {
    initial: StateConfig;
    selected: StateConfig;
    "selected-alt"?: StateConfig; // Optional alternate selected state config
    uploading: StateConfig;
    failed: StateConfig;
    success: StateConfig;
  };
  onFilesChange?: (files: File[]) => void;
  uploadEndpoint: string; 
  folderId?: string | number; 
  className?: string; 
  dropzoneClassName?: string; 
  accept?: string; 
  multiple?: boolean; 
  header?: ReactNode;
}

// --- Reusable FileUpload Component ---

export const FileUpload = ({
  config: stateConfigs,
  onFilesChange,
  uploadEndpoint,
  folderId, // Destructure the new folderId prop
  className,
  dropzoneClassName,
  accept,
  multiple = true, // Default to allowing multiple files
  header,
}: FileUploadProps): JSX.Element => {
  const [uploadState, setUploadState] = useState<UploadState>("initial");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<unknown>(null); // State to store upload error details

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null); // Ref for AbortController

  // --- Event Handlers ---

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        setSelectedFiles(fileArray);
        setUploadState("selected");
        setUploadProgress(0);
        setUploadError(null); 
        onFilesChange?.(fileArray); 
      }
    },
    [onFilesChange]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleFileSelect(e.dataTransfer.files); // Process dropped files
    },
    [handleFileSelect]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input value to allow selecting the same file again
      if (e.target) {
        e.target.value = "";
      }
    },
    [handleFileSelect]
  );

  // --- State Management & Upload Logic ---

  const resetState = useCallback(() => {
    // Abort any ongoing upload before resetting state
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort("User reset the component.");
      uploadAbortControllerRef.current = null;
    }
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadState("initial");
    setUploadError(null);
    // Clear the file input visually
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFilesChange?.([]); // Notify parent about the reset
  }, [onFilesChange]);

  // Internal callbacks used by handleUploadAttempt to update state
  const uploadCallbacks = useMemo(
    () => ({
      onProgress: (percentage: number) => {
        setUploadProgress(Math.min(100, Math.max(0, percentage)));
      },
      onSuccess: () => {
        setUploadState("success");
        setUploadProgress(100); // Ensure progress hits 100%
      },
      onError: (error?: unknown) => {
        showAlert({ type: "error", message: "Upload failed" });
        setUploadState("failed");
        setUploadProgress(0); // Reset progress bar on error
        setUploadError(error); // Store error details for potential display
      },
    }),
    []
  );

  // Handles the actual file upload API call
  const handleUploadAttempt = useCallback(async () => {
    // Prevent upload if no files are selected or not in a valid state to upload
    if (
      selectedFiles.length === 0 ||
      (uploadState !== "selected" && uploadState !== "failed")
    ) {
      return;
    }

    setUploadState("uploading");
    setUploadProgress(0);
    setUploadError(null); // Clear previous errors on a new attempt

    // Create a new AbortController for this specific upload attempt
    const abortController = new AbortController();
    uploadAbortControllerRef.current = abortController;
    const { signal } = abortController;

    const formData = new FormData();

    // Append each file using the 'files[]' convention for backend array parsing
    selectedFiles.forEach((file) => {
      formData.append("files[]", file);
    });

    // Append the folderId if it was provided
    if (folderId !== undefined && folderId !== null) {
      formData.append("folder_id", String(folderId)); // Ensure it's a string
     
    }

    //if local storage has partner_id, append it to formData
    const sellerId = localStorage.getItem("seller_id");
   
    if (sellerId) {
      formData.append("seller_id", sellerId);
    }
    const buyerId = localStorage.getItem("buyer_id");
  
    if (buyerId) {
      formData.append("buyer_id", buyerId);
    }
    const partnerId = localStorage.getItem("partner_id");
    if (partnerId) {
      formData.append("partner_id", partnerId);
    }

    try {
      // Perform the POST request using the configured Axios instance (api)
      await api.post(uploadEndpoint, formData, {
        headers: {
          // Crucial header for file uploads with FormData
          "Content-Type": "multipart/form-data",
        },
        // Axios callback to track upload progress
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total;
          if (total) {
            const percentage = Math.round((progressEvent.loaded * 100) / total);
            uploadCallbacks.onProgress(percentage); // Update progress state
          }
        },
        signal: signal, // Pass the abort signal to Axios
      });

      // If the request succeeds (no exception thrown)
      uploadCallbacks.onSuccess();
    } catch (error) {
      // Check if the error was specifically an Axios cancellation
      if (axios.isCancel(error)) {
       
        // State reset is typically handled by the button action that triggered the cancel (resetState)
      } else {
        // Handle other types of upload errors
        showAlert({ type: "error", message: "Error during API upload" });
        uploadCallbacks.onError(error); // Update state to 'failed' and store error
      }
    } finally {
      // Ensure the AbortController reference is cleaned up after the attempt
      uploadAbortControllerRef.current = null;
    }
    // Dependencies for useCallback: ensures function updates if these change
  }, [selectedFiles, uploadEndpoint, uploadCallbacks, uploadState, folderId]);

  // --- Button Click Handling ---

  const handleButtonClick = useCallback(
    (buttonConfig?: ButtonConfig) => {
      if (!buttonConfig) return;

      // Prioritize custom onClick if provided
      if (buttonConfig.onClick) {
        buttonConfig.onClick();
        return;
      }

      // Handle default actions
      switch (buttonConfig.action) {
        case "browse":
          fileInputRef.current?.click(); // Open file browser
          break;
        case "upload":
          handleUploadAttempt(); // Start the upload process
          break;
        case "cancel": // Can be used during 'uploading' or 'selected'/'failed'
        
          // Abort any active upload via the controller ref
          if (uploadAbortControllerRef.current) {
            uploadAbortControllerRef.current.abort(
              "User clicked cancel button."
            );
          }
          resetState(); // Reset the component to initial state
          break;
        case "reset": // Explicitly reset to initial state
          resetState();
          break;
        case "done": // Typically used after success, resets to initial
          resetState();
          break;
        default:
          // console.warn(
          //   "Button clicked with no defined action or onClick:",
          //   buttonConfig
          // );
      }
    },
    [handleUploadAttempt, resetState]
  ); // Dependencies for button actions

  // --- Dynamic Configuration ---

  // Memoized calculation of the current configuration based on uploadState
  const currentConfig = useMemo(() => {
    const activeState = uploadState;
    const baseConfig = stateConfigs[activeState];

    // Graceful fallback if a state config is missing
    if (!baseConfig) {
      showAlert({
        type: "error",
        message: `FileUpload: Configuration for state "${activeState}" is missing! Falling back to initial.`,
      });
      // Return a resolved version of the initial config
      const initialConf = stateConfigs.initial;
      return {
        ...initialConf,
        progress: uploadState === "uploading" ? uploadProgress : undefined,
        badge:
          typeof initialConf.badge === "function"
            ? initialConf.badge(selectedFiles)
            : initialConf.badge,
        title:
          typeof initialConf.title === "function"
            ? initialConf.title(selectedFiles)
            : initialConf.title,
        subtitle:
          initialConf.subtitle && typeof initialConf.subtitle === "function"
            ? initialConf.subtitle(selectedFiles)
            : initialConf.subtitle,
      };
    }

    // Resolve dynamic properties (title, subtitle, badge) if they are functions
    const resolvedTitle =
      typeof baseConfig.title === "function"
        ? baseConfig.title(selectedFiles)
        : baseConfig.title;

    const resolvedSubtitle =
      baseConfig.subtitle && typeof baseConfig.subtitle === "function"
        ? baseConfig.subtitle(selectedFiles)
        : baseConfig.subtitle;

    const resolvedBadge =
      baseConfig.badge && typeof baseConfig.badge === "function"
        ? baseConfig.badge(selectedFiles)
        : baseConfig.badge;

    return {
      ...baseConfig,
      title: resolvedTitle,
      subtitle: resolvedSubtitle,
      badge: resolvedBadge,
      // Inject the current upload progress into the config for the 'uploading' state
      progress: uploadState === "uploading" ? uploadProgress : undefined,
    };
    // Dependencies: Recalculate when state, config, files, or progress change
  }, [uploadState, stateConfigs, selectedFiles, uploadProgress]);

  // --- Rendering Logic ---

  // Renders a single button based on its config and type
  const renderButton = (
    buttonConfig: ButtonConfig | undefined,
    type: "primary" | "secondary" | "cancel" | "tryAgain" | "done"
  ) => {
    if (!buttonConfig) return null;

    let baseClasses = "";
    let textClasses = "";

    // Determine if the button should be disabled
    // Generally disable destructive/initiating actions during upload, allow 'cancel'
    const isUploading = uploadState === "uploading";
    const isDisabled = isUploading && buttonConfig.action !== "cancel"; // Allow cancel during upload

    // Define base styles for different button types
    switch (type) {
      case "primary":
        baseClasses =
          "flex items-center gap-2 px-4 py-1 h-[34.49px] bg-[#064771] text-white rounded-full";
        textClasses = "text-base font-medium";
        break;
      case "secondary":
        baseClasses =
          "flex items-center gap-1.5 px-4 py-1 h-[34px] bg-white border border-[#d0d5dd] rounded-full text-gray-600";
        textClasses = "text-base";
        break;
      case "cancel": // Style for cancel/reset buttons
        baseClasses =
          "flex items-center gap-1 px-4 py-1 h-[34.49px] bg-[#fff6f6] border border-[#FEECEB] rounded-full text-gray-600";
        textClasses = "text-base font-medium";
        break;
      case "tryAgain": // Style specifically for try again (often similar to cancel/error)
        baseClasses =
          "flex items-center gap-1 px-4 py-1 h-[34.49px] bg-[#fff6f6] border border-[#FEECEB] rounded-full text-gray-600"; // Example: same as cancel
        textClasses = "text-base font-medium";
        break;
      case "done": // Style for the final success action button
        baseClasses =
          "flex items-center gap-2 px-4 py-1 h-[34.49px] bg-[#EBF9F1] text-[#064771] rounded-full border border-[#B8E8CD]";
        textClasses = "text-base font-medium";
        break;
    }

    return (
      <button
        type="button"
        // Apply base classes and conditional disabled styles
        className={cn(
          baseClasses,
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:opacity-90 transition-opacity"
        )}
        onClick={() => handleButtonClick(buttonConfig)}
        disabled={isDisabled} // Disable based on calculated state
      >
        {buttonConfig.icon} {/* Render icon if provided */}
        <span className={cn(textClasses)}>{buttonConfig.text}</span>
      </button>
    );
  };

  // Memoized list of buttons to display based on the current state's configuration
  const displayedButtons = useMemo(() => {
    const buttons: {
      config: ButtonConfig;
      type: "primary" | "secondary" | "cancel" | "tryAgain" | "done";
    }[] = [];

    // Define button precedence or layout order here
    if (currentConfig.cancelButton)
      buttons.push({ config: currentConfig.cancelButton, type: "cancel" });
    if (currentConfig.tryAgainButton)
      buttons.push({ config: currentConfig.tryAgainButton, type: "tryAgain" });
    if (currentConfig.secondaryButton)
      buttons.push({
        config: currentConfig.secondaryButton,
        type: "secondary",
      });
    if (currentConfig.primaryButton)
      buttons.push({ config: currentConfig.primaryButton, type: "primary" });
    if (currentConfig.doneButton)
      buttons.push({ config: currentConfig.doneButton, type: "done" });

    // Filter buttons based on the current state logic (e.g., only show 'cancel' during upload)
    if (uploadState === "uploading") {
      return buttons.filter((b) => b.type === "cancel"); // Only allow Cancel during upload
    }
    if (uploadState === "failed") {
      // Show TryAgain, Secondary (e.g., Browse), Cancel(Reset)
      return buttons.filter(
        (b) =>
          b.type === "tryAgain" || b.type === "secondary" || b.type === "cancel"
      );
    }
    if (uploadState === "success") {
      // Show Done, Secondary (e.g., Upload More)
      return buttons.filter((b) => b.type === "done" || b.type === "secondary");
    }
    if (uploadState === "selected") {
      // Show Primary (Upload), Secondary (Browse), Cancel(Reset)
      return buttons.filter(
        (b) =>
          b.type === "primary" || b.type === "secondary" || b.type === "cancel"
      );
    }
    // Default (initial state): Show Primary (Browse)
    return buttons.filter((b) => b.type === "primary");
  }, [currentConfig, uploadState]); // Recalculate when config or state changes

  // --- Component JSX ---

  return (
    <div
      className={cn("bg-white flex justify-center w-full px-[25px]", className)}
    >
      <div className="w-full bg-white">
        <div className="relative h-full rounded-md overflow-hidden">
          <div className="flex flex-col gap-8">
            {/* Optional Header */}
            {header !== undefined ? (
              header
            ) : (
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center gap-4">
                  <h2 className="font-medium text-[#0c5577] text-lg leading-5">
                    Quick Upload
                  </h2>
                </div>
                <hr className="w-full border-t border-gray-200" />
              </div>
            )}
            {/* Dropzone Area */}
            <div
              className={cn(
                "flex flex-col h-60 w-full items-center justify-center gap-1.5 border border-dashed border-[#064771] rounded-[12.34px] relative overflow-hidden p-4", // Added padding
                currentConfig.background || "bg-white", // Use background from config or default
                dropzoneClassName // Allow custom styling
              )}
              onDragOver={handleDragOver} // Enable dropping
              onDrop={handleDrop} // Handle dropped files
              role="group"
              aria-label="File upload dropzone"
            >
              {/* Content inside Dropzone */}
              <div className="flex flex-col items-center justify-center gap-6 w-full h-full text-center">
                {/* Icon/Progress Area */}
                <div className="flex flex-col items-center gap-4">
                  {/* Show Progress Spinner/Percentage OR State Icon */}
                  {currentConfig.progress !== undefined ? ( // Check if progress value exists (only in 'uploading')
                    <div className="relative w-[84px] h-[82px]">
                      {" "}
                      {/* Progress Spinner */}
                      <div className="absolute w-full h-full">
                        <svg
                          width="83"
                          height="82"
                          viewBox="0 0 83 82"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="animate-spin flex-shrink-0"
                        >
                          <path
                            d="M82.5 41C82.5 63.6437 64.1437 82 41.5 82C18.8563 82 0.5 63.6437 0.5 41C0.5 18.3563 18.8563 0 41.5 0C64.1437 0 82.5 18.3563 82.5 41ZM8.7 41C8.7 59.1149 23.3851 73.8 41.5 73.8C59.6149 73.8 74.3 59.1149 74.3 41C74.3 22.8851 59.6149 8.2 41.5 8.2C23.3851 8.2 8.7 22.8851 8.7 41Z"
                            fill="#D0EAFF"
                          />
                          <path
                            d="M41.5 4.1C41.5 1.83563 43.3402 -0.0212356 45.5932 0.204827C50.6442 0.71162 55.5694 2.15336 60.1136 4.46873C65.8786 7.40615 70.8666 11.6663 74.6697 16.9008C78.4728 22.1353 80.9831 28.1956 81.9952 34.5862C83.0074 40.9767 82.4927 47.5161 80.4933 53.6697C78.4939 59.8232 75.0665 65.4162 70.4914 69.9914C65.9162 74.5665 60.3233 77.9939 54.1697 79.9933C48.0162 81.9927 41.4768 82.5074 35.0862 81.4952C30.0489 80.6974 25.2169 78.9688 20.8327 76.4099C18.8771 75.2685 18.4798 72.6846 19.8107 70.8527V70.8527C21.1417 69.0208 23.6959 68.6402 25.6795 69.7324C28.9948 71.5579 32.6105 72.8009 36.369 73.3962C41.4814 74.2059 46.7129 73.7942 51.6358 72.1947C56.5586 70.5951 61.033 67.8532 64.6931 64.1931C68.3532 60.533 71.0951 56.0586 72.6947 51.1358C74.2942 46.2129 74.7059 40.9814 73.8962 35.8689C73.0864 30.7565 71.0782 25.9083 68.0358 21.7206C64.9933 17.533 61.0029 14.1249 56.3909 11.775C53.0003 10.0474 49.3446 8.92779 45.5894 8.45592C43.3427 8.1736 41.5 6.36437 41.5 4.1V4.1Z"
                            fill="#064771"
                          />
                        </svg>
                      </div>
                      {/* Progress Percentage Text */}
                      <div className="absolute inset-0 flex items-center justify-center font-semibold text-gray-900 text-[19.5px] leading-[23.4px]">
                        {currentConfig.progress}%
                      </div>
                    </div>
                  ) : (
                    // Render the icon defined in the current state's config
                    currentConfig.icon || null
                  )}
                </div>

                {/* Text Area (Title, Subtitle, Error) */}
                <div className="flex flex-col items-center gap-2">
                  <h3 className="font-medium text-gray-900 text-base">
                    {currentConfig.title} {/* Dynamic title */}
                  </h3>
                  {currentConfig.subtitle && (
                    <p className="text-gray-500 text-sm max-w-xs break-words truncate">
                      {currentConfig.subtitle} {/* Dynamic subtitle */}
                    </p>
                  )}
                  {/* Display error message specifically in 'failed' state */}
                  {uploadState === "failed" && Boolean(uploadError) && (
                    <p className="text-[#DF272A] text-sm max-w-xs break-words">
                      {/* Try to display backend message, fallback to generic */}
                      {(() => {
                        if (typeof uploadError === 'object' && uploadError !== null && 'response' in uploadError &&
                            typeof (uploadError as Record<string, unknown>).response === 'object' &&
                            (uploadError as Record<string, unknown>).response !== null &&
                            'data' in ((uploadError as Record<string, unknown>).response as Record<string, unknown>) &&
                            typeof ((uploadError as Record<string, unknown>).response as Record<string, unknown>).data === 'object' &&
                            ((uploadError as Record<string, unknown>).response as Record<string, unknown>).data !== null &&
                            'message' in (((uploadError as Record<string, unknown>).response as Record<string, unknown>).data as Record<string, unknown>) &&
                            typeof (((uploadError as Record<string, unknown>).response as Record<string, unknown>).data as Record<string, unknown>).message === "string") {
                          return (((uploadError as Record<string, unknown>).response as Record<string, unknown>).data as Record<string, unknown>).message as string;
                        }
                        if (typeof uploadError === 'object' && uploadError !== null && 'message' in uploadError && typeof (uploadError as Record<string, unknown>).message === 'string') {
                          return (uploadError as Record<string, unknown>).message as string;
                        }
                        return "Upload failed. Please try again.";
                      })()}
                    </p>
                  )}
                </div>

                {/* Button Area */}
                <div className="flex items-center justify-center gap-3 md:gap-5 flex-wrap mt-2">
                  {/* Render the filtered buttons for the current state */}
                  {displayedButtons.map((buttonInfo, index) => (
                    <React.Fragment key={index}>
                      {renderButton(buttonInfo.config, buttonInfo.type)}
                      {/* Optional: Add "or" separator between specific buttons */}
                      {index === 0 && // Show 'or' only after the first button
                        displayedButtons.length > 1 &&
                        buttonInfo.type === "secondary" && // If first is secondary
                        displayedButtons[1].type === "primary" && // And second is primary
                        uploadState === "initial" && ( // Only in specific states (e.g., initial)
                          <span className="text-gray-900 text-base hidden md:inline">
                            or
                          </span>
                        )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Optional Badge Area (Bottom Right) */}
              {currentConfig.badge && currentConfig.showBadgeComponent && (
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[#064771] rounded-full shadow-md max-w-[200px]">
                    {/* Example File Icon for Badge */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M9 17V11L7 13M9 11L11 13M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H13.1716C13.702 3 14.2107 3.21071 14.5858 3.58579L18.4142 7.41421C18.7893 7.78929 19 8.29799 19 8.82843V19C19 20.1046 18.1046 21 17 21Z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-white text-sm font-semibold leading-5 whitespace-nowrap overflow-hidden text-ellipsis">
                      {currentConfig.badge} {/* Dynamic badge text */}
                    </span>
                  </div>
                </div>
              )}
            </div>{" "}
            {/* End Dropzone Area */}
          </div>{" "}
          {/* End Main Flex Column */}
        </div>{" "}
        {/* End Relative Container */}
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden" // Visually hide the default input
          multiple={multiple} // Control single/multiple file selection
          accept={accept} // Specify accepted file types
          onChange={handleFileInput} // Triggered when files are selected
          aria-hidden="true" // Hide from accessibility tree as it's controlled by buttons/dropzone
        />
      </div>{" "}
      {/* End Width Container */}
    </div> /* End Outer Container */
  );
};

// --- Default SVG Icon Components (Placeholders/Examples) ---
// (These remain the same as provided previously)

export const UploadCloudIcon = ({
  color = "#064771",
  size = 54,
}: {
  color?: string;
  size?: number;
}) => (
  <svg
    width={size * (47 / 48)}
    height={size}
    viewBox="0 0 47 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.6336 38.6064H13.2335C11.7775 38.605 10.3385 38.2939 9.01188 37.6938C7.6853 37.0937 6.50153 36.2183 5.53914 35.1257C4.57675 34.0331 3.85776 32.7483 3.42989 31.3566C3.00202 29.9649 2.87505 28.4981 3.05741 27.0535C3.23978 25.609 3.7273 24.2197 4.48763 22.978C5.24796 21.7363 6.2637 20.6705 7.46743 19.8514C8.67116 19.0323 10.0354 18.4785 11.4695 18.2269C12.9036 17.9754 14.3748 18.0317 15.7854 18.3922"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.7012 23.9378C14.7014 21.6139 15.2538 19.3233 16.313 17.2547C17.3721 15.1862 18.9076 13.3989 20.793 12.0402C22.6783 10.6815 24.8596 9.79024 27.1569 9.43987C29.4543 9.0895 31.802 9.29005 34.0067 10.025C36.2113 10.7599 38.2098 12.0082 39.8374 13.667C41.465 15.3258 42.6751 17.3476 43.3681 19.5658C44.061 21.7841 44.217 24.1352 43.823 26.4255C43.4291 28.7158 42.4966 30.8797 41.1023 32.7389"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21.6777 30.1601L27.9004 23.9373L34.1231 30.1601"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M27.9004 38.6043V23.9373"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ErrorIcon = ({
  color = "#DF272A",
  size = 54,
}: {
  color?: string;
  size?: number;
}) => (
  <svg
    width={size * (67 / 54)}
    height={size}
    viewBox="0 0 67 54"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M33.5 18.25V28.75M33.5 39.25H33.535M20.9 51.5C10.4618 51.5 2 43.1154 2 32.7725C2 24.2003 8.3 16.2812 17.75 14.75C20.7143 7.7023 27.7299 2.5 35.9125 2.5C46.394 2.5 54.9609 10.6288 55.55 20.875C61.1125 23.3071 65 29.276 65 35.7391C65 44.4436 57.9486 51.5 49.25 51.5H20.9Z"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SuccessIcon = ({
  color = "#0A8043",
  size = 54,
}: {
  color?: string;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <path
      d="M8 12.3L11.0345 15.5L16.5 9.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// --- Button Specific Icons ---

export const BrowseIconSVG = () => (
  // Used for secondary browse buttons
  <svg
    width="17"
    height="21"
    viewBox="0 0 17 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.2507 19.281H1.75C1.55109 19.281 1.36032 19.202 1.21967 19.0613C1.07902 18.9207 1 18.7299 1 18.531V2.03101C1 1.83209 1.07902 1.64133 1.21967 1.50068C1.36032 1.36002 1.55109 1.28101 1.75 1.28101H10.7507L16.0007 6.53101V18.531C16.0007 18.6295 15.9813 18.727 15.9436 18.818C15.906 18.909 15.8507 18.9917 15.7811 19.0613C15.7114 19.131 15.6287 19.1862 15.5377 19.2239C15.4468 19.2616 15.3492 19.281 15.2507 19.281Z"
      stroke="#54575C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.75 1.28101V6.53101H16.0007"
      stroke="#54575C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.875 12.156L8.5 9.53101L11.125 12.156"
      stroke="#54575C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 15.531V9.53101"
      stroke="#54575C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const InitialBrowseIconSVG = () => (
  // Used for the main browse button in initial state
  <svg
    width="20"
    height="21"
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.0008 15.0266V8.72656V15.0266ZM10.0008 8.72656L12.7008 11.4266L10.0008 8.72656ZM10.0008 8.72656L7.30078 11.4266L10.0008 8.72656Z"
      fill="white"
    />
    <path
      d="M10.0008 15.0266V8.72656M10.0008 8.72656L12.7008 11.4266M10.0008 8.72656L7.30078 11.4266"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.5984 6.02734H9.99844H6.39844"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M1 10.5273C1 6.2847 1 4.16338 2.31802 2.84537C3.63604 1.52734 5.75736 1.52734 10 1.52734C14.2426 1.52734 16.364 1.52734 17.6819 2.84537C19 4.16338 19 6.2847 19 10.5273C19 14.7699 19 16.8913 17.6819 18.2093C16.364 19.5273 14.2426 19.5273 10 19.5273C5.75736 19.5273 3.63604 19.5273 2.31802 18.2093C1 16.8913 1 14.7699 1 10.5273Z"
      stroke="white"
      strokeWidth="1.4"
    />
  </svg>
);

export const UploadIconSVG = () => (
  // Used for Upload/Try Again buttons
  <svg
    width="20"
    height="21"
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.0008 15.0258V8.72583M10.0008 8.72583L12.7008 11.4258M10.0008 8.72583L7.30078 11.4258"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.6004 6.02588H10.0004H6.40039"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M1 10.5264C1 6.28372 1 4.1624 2.31802 2.84439C3.63604 1.52637 5.75736 1.52637 10 1.52637C14.2426 1.52637 16.364 1.52637 17.6819 2.84439C19 4.1624 19 6.28372 19 10.5264C19 14.769 19 16.8904 17.6819 18.2083C16.364 19.5264 14.2426 19.5264 10 19.5264C5.75736 19.5264 3.63604 19.5264 2.31802 18.2083C1 16.8904 1 14.769 1 10.5264Z"
      stroke="white"
      strokeWidth="1.4"
    />
  </svg>
);

export const CancelIconSVG = () => (
  // Used for Cancel/Reset buttons
  <svg
    width="19"
    height="19"
    viewBox="0 0 19 19"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="9.34409"
      cy="9.75449"
      r="8.58443"
      stroke="#54575C"
      strokeWidth="1.22635"
    />
    <path
      d="M12.8292 6.99536L6.58594 13.2386M13.0243 13.4337L6.68257 7.092"
      stroke="#54575C"
      strokeWidth="1.53293"
      strokeLinecap="round"
    />
  </svg>
);
