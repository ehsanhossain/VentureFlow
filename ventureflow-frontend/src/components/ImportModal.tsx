import { FileIcon, UploadIcon, X, AlertCircle } from "lucide-react";
import React, { useState, useCallback } from "react";
import { showAlert } from "./Alert";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleImportClick: (file: File | null) => Promise<void>;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, handleImportClick }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInternalClose = useCallback(() => {
    setSelectedFile(null);
    setIsLoading(false);
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const internalHandleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        setErrorMessage("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
        setSelectedFile(null);
        if (event.target) {
          event.target.value = "";
        }
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage("File is too large. Maximum size is 20MB.");
        setSelectedFile(null);
        if (event.target) {
          event.target.value = "";
        }
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const onTriggerImport = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a file to import.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await handleImportClick(selectedFile);
    } catch (error: unknown) {
      showAlert({ type: "error", message: "Import error from prop" });
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error && typeof (error as Record<string, unknown>).message === 'string'
        ? (error as Record<string, unknown>).message as string
        : "An error occurred during import via prop.";
      setErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        setErrorMessage("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
        setSelectedFile(null);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage("File is too large. Maximum size is 20MB.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleInternalClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full sm:w-[520px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e2e5]">
          <div>
            <h2 className="font-medium text-gray-900 text-lg leading-7">
              Import Excel File
            </h2>
            <p className="font-normal text-gray-900 text-[13px] leading-5">
              Select an Excel or CSV file to import your data
            </p>
          </div>
          <button
            onClick={handleInternalClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close import modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-premium">
          <div
            className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-[#e0e2e5] rounded-lg relative hover:border-[#064771] transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <UploadIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[#064771]" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-600">
                  Excel (.xlsx, .xls) or CSV (.csv) files up to 20MB
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={internalHandleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="File upload"
                disabled={isLoading}
              />
            </div>
          </div>

          {selectedFile && !errorMessage && (
            <div className="flex items-center gap-2 p-3 mt-4 bg-blue-50 border border-blue-200 rounded-md w-full">
              <FileIcon className="w-5 h-5 text-[#064771] flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 truncate" title={selectedFile.name}>
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-600 ml-auto flex-shrink-0">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 p-3 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-md w-full">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-[#e0e2e5] mt-auto">
          <button
            onClick={handleInternalClose}
            disabled={isLoading}
            className="w-full sm:w-auto h-[38px] px-4 items-center justify-center rounded-md border border-solid border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-70 transition-colors text-sm font-medium"
          >
            Cancel
          </button>

          <button
            onClick={onTriggerImport}
            disabled={!selectedFile || isLoading || !!errorMessage}
            className="w-full sm:w-auto h-[38px] px-4 items-center justify-center rounded-md bg-[#064771] text-white hover:bg-[#053a5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </div>
            ) : (
              "Import"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
