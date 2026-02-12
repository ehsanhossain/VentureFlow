import React from "react";
import { Copy } from "lucide-react"; // Importing the Copy icon from lucide-react
import { showAlert } from "./Alert";

interface GeneratedPasswordModalProps {
  generatedPassword: string;
  onClose: () => void;
}

export default function GeneratedPasswordModal({ generatedPassword, onClose }: GeneratedPasswordModalProps) {
  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard
        .writeText(generatedPassword)
        .then(() =>
          showAlert({
            type: "success",
            message: "Password copied to clipboard!",
          })
        )
        .catch((_) => showAlert({ type: "error", message: "Failed to copy password" }));
    }
  };

  return (
    // Modal Overlay: Fixed position, full screen, semi-transparent black background with blur, centered content, high z-index.
    // Also applies Poppins font to the entire modal.
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[100] p-4 sm:p-6 lg:p-8">
      {/* Modal Content Container: Auto width and height, responsive max-width. */}
      {/* Use `h-auto` to let content dictate height. `max-w-lg` sets a max width (512px by default in Tailwind). */}
      {/* `w-full` makes it fill available width on small screens. */}
      <div className="w-full max-w-lg h-auto flex flex-col bg-[#FFFFFF] rounded-2xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col items-start py-4 px-6 border-b border-solid border-[#E0E3E6]">
          <span className="text-gray-600 text-lg font-semibold leading-7">
            Generated User Password
          </span>
          <span className="text-gray-600 text-[13px] leading-5">
            Copy this password for the new user.
          </span>
        </div>

        {/* Main Content Area */}
        {/* `flex-grow` allows this section to expand and push the footer down if content grows */}
        <div className="flex flex-col gap-6 p-6 flex-grow">
          <div className="flex flex-col gap-6">
            {/* Password Display Box: Responsive width `w-full` */}
            <div className="w-full flex justify-between items-center gap-2.5 py-3 px-4 bg-[#E7F4FC] rounded-[5px]">
              <div className="flex flex-col items-start gap-1 flex-grow">
                <span className="text-gray-600 text-sm font-medium leading-5">
                  Generated Password
                </span>
                <span className="text-gray-600 text-lg font-mono leading-7 select-all break-all">
                  {generatedPassword}
                </span>
              </div>
              <div className="flex items-center flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="flex justify-center items-center gap-2 py-2.5 px-3.5 bg-[#064771] rounded-[34px] cursor-pointer text-white text-sm font-medium leading-5 whitespace-nowrap hover:bg-[#043355] transition-colors duration-200"
                >
                  {/* Lucide React Copy Icon Component */}
                  <Copy className="w-5 h-5" />{" "}
                  {/* Use the Copy component directly */}
                  <span>Copy Password</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex justify-end items-center py-4 px-6 border-t border-solid border-[#E0E3E6]">
          <button
            type="button"
            onClick={onClose}
            className="flex justify-center items-center gap-[4.313709259033203px] py-2.5 px-4 bg-[#FFFFFF] border border-solid border-[#727272] rounded-[49.82036209106445px] cursor-pointer text-gray-600 text-sm font-medium leading-5 hover:bg-gray-50 transition-colors duration-200"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
