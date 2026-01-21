import React, { useCallback, useState } from "react";
import {
  FileUpload,
  UploadCloudIcon,
  ErrorIcon,
  SuccessIcon,
  BrowseIconSVG,
  UploadIconSVG,
  CancelIconSVG,
  InitialBrowseIconSVG,
} from "../../../components/FileUpload";

import { FileManager, Folder } from "../../../components/FileManager";
import api from "../../../config/api";
import axios from "axios";
import FileView from "../../../components/FileView";
import { useTabStore } from "./store/tabStore";
import { useNavigate, useParams } from "react-router-dom";
import { showAlert } from "../../../components/Alert";
interface AttachmentFile {
  id: string;
  name: string;
  size?: number;
  type?: string;
  isSelected?: boolean;
  mime_type?: string;
  previewImageUrl?: string;
}



const handleCopyLinkExample = (_folderId: string) => {

};
const handleDownloadExample = (_folderId: string) => {

};
const handleShareExample = (_folderId: string) => {

};
const handleViewSizeExample = (_folderId: string) => {

};

interface ApiFile {
  _id: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  urlPreview?: string;
  createdAt?: string;
}

const mapApiFileToFile = (apiFile: ApiFile): AttachmentFile => {
  return {
    id: apiFile._id,
    name: apiFile.fileName,
    mime_type: apiFile.mimeType,
    size: apiFile.fileSize,
    previewImageUrl: apiFile.urlPreview,
  };
};

const Attachments: React.FC = () => {
  // Hooks moved to top level
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const [selectedFolderIdInParent, setSelectedFolderIdInParent] = useState<string | null>(null);
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);



  const onFetchFilesCallback = useCallback(async () => {

    try {
      const response = await api.get<{ data: ApiFile[] }>("/api/files", {
        params: {
          folder_id: selectedFolderIdInParent || undefined,
        },
      });

      const apiFiles = response.data.data || [];
      const fetchedFiles = apiFiles.map(mapApiFileToFile);
      setFiles(fetchedFiles);
      return fetchedFiles;
    } catch (error: unknown) {
      showAlert({ type: "error", message: "Error in onFetchFilesCallback" });
      setFiles([]);
      throw error;
    }
  }, [selectedFolderIdInParent]);

  if (!paramId && !localStorage.getItem("buyer_id")) {
    return (
      <div className="p-8 text-red-600 font-semibold flex justify-center items-center h-[200px]">
        Error: No buyer ID found. Please complete company overview.
      </div>
    );
  }

  const createFolderApi = async (name: string): Promise<Folder> => {
    try {
      const buyerId = paramId || localStorage.getItem("buyer_id");

      const response = await api.post("/api/folders", {
        name,
        buyer_id: buyerId,
      });

      const responseData = response.data;

      if (!responseData.success || !responseData.data) {
        const apiErrorMessage =
          responseData.message || "API returned success: false";
        showAlert({ type: "error", message: apiErrorMessage });
        throw new Error(apiErrorMessage);
      }

      showAlert({ type: "success", message: "Folder created successfully" });
      showAlert({ type: "success", message: "Folder created successfully" });
      return responseData.data as Folder;
    } catch (error: unknown) {
      let userMessage = "Failed to create folder. Please try again.";

      if (axios.isAxiosError(error) && error.response) {
        const serverError = error.response.data;
        if (serverError.message) {
          userMessage = serverError.message;
        } else if (serverError.errors) {
          userMessage =
            "Validation failed: " + JSON.stringify(serverError.errors);
        } else {
          userMessage = `Server error: ${error.response.status}`;
        }
      } else if (error instanceof Error) {
        userMessage = `Request failed: ${error.message}`;
      }

      showAlert({ type: "error", message: userMessage });
      throw new Error(userMessage);
    }
  };

  const renameFolderApi = async (
    id: string,
    newName: string
  ): Promise<Folder> => {
    try {
      const response = await api.put(`/api/folders/${id}`, { name: newName });
      const responseData = response.data;

      if (!responseData.success || !responseData.data) {
        const apiErrorMessage =
          responseData.message || "API returned failure renaming folder";
        showAlert({ type: "error", message: apiErrorMessage });
        throw new Error(apiErrorMessage);
      }

      showAlert({ type: "success", message: "Folder renamed successfully" });
      showAlert({ type: "success", message: "Folder renamed successfully" });
      return responseData.data as Folder;
    } catch (error: unknown) {
      let userMessage = "Failed to rename folder. Please try again.";

      if (axios.isAxiosError(error) && error.response) {
        const serverError = error.response.data;
        if (serverError.message) {
          userMessage = serverError.message;
        } else if (serverError.errors) {
          userMessage =
            "Validation failed: " + JSON.stringify(serverError.errors);
        } else {
          userMessage = `Server error: ${error.response.status}`;
        }
      } else if (error instanceof Error) {
        userMessage = `Request failed: ${error.message}`;
      }

      showAlert({ type: "error", message: userMessage });
      throw new Error(userMessage);
    }
  };

  const deleteFolderApi = async (id: string): Promise<void> => {
    try {
      const response = await api.delete(`/api/folders/${id}`);
      const responseData = response.data;

      if (!responseData.success) {
        const apiErrorMessage =
          responseData.message || "API returned failure deleting folder";
        showAlert({ type: "error", message: apiErrorMessage });
        throw new Error(apiErrorMessage);
      }

      showAlert({ type: "success", message: "Folder deleted successfully" });
      showAlert({ type: "success", message: "Folder deleted successfully" });
      return;
    } catch (error: unknown) {
      let userMessage = "Failed to delete folder. Please try again.";

      if (axios.isAxiosError(error) && error.response) {
        const serverError = error.response.data;
        if (serverError.message) {
          userMessage = serverError.message;
        } else if (serverError.errors) {
          userMessage =
            "Server responded with errors: " +
            JSON.stringify(serverError.errors);
        } else {
          userMessage = `Server error: ${error.response.status}`;
        }
      } else if (error instanceof Error) {
        userMessage = `Request failed: ${error.message}`;
      }

      showAlert({ type: "error", message: userMessage });
      throw new Error(userMessage);
    }
  };

  const fetchFoldersApi = async (): Promise<Folder[]> => {
    try {
      const buyerId = paramId || localStorage.getItem("buyer_id");
      localStorage.setItem("buyer_id", buyerId || "");
      const response = await api.get(`/api/buyers/${buyerId}/folders`);
      const responseData = response.data;

      if (!responseData.success || !Array.isArray(responseData.data)) {
        const apiErrorMessage =
          responseData.message || "API returned invalid response";
        showAlert({ type: "error", message: apiErrorMessage });
        throw new Error(apiErrorMessage);
      }

      return responseData.data as Folder[];
    } catch (error: unknown) {
      let userMessage = "Failed to load folders. Please try again.";

      if (axios.isAxiosError(error) && error.response) {
        const serverError = error.response.data;
        if (serverError.message) {
          userMessage = serverError.message;
        } else if (serverError.errors) {
          userMessage =
            "Server responded with errors: " +
            JSON.stringify(serverError.errors);
        } else {
          userMessage = `Server error: ${error.response.status}`;
        }
      } else if (error instanceof Error) {
        userMessage = `Request failed: ${error.message}`;
      }

      showAlert({ type: "error", message: userMessage });
      throw new Error(userMessage);
    }
  };

  const handleFolderSelected = (folderId: string | null) => {
    setSelectedFolderIdInParent(folderId);
    onFetchFilesCallback();
  };



  const handleFilesChange = (_files: File[]) => {

  };

  const fileUploadConfig = {
    initial: {
      title: "Choose a file or drag & drop it here for Uploading",
      subtitle: "Upload the required files",
      icon: <UploadCloudIcon />,
      primaryButton: {
        text: "Browse files",
        icon: <InitialBrowseIconSVG />,
        action: "browse",
      },
      showBadgeComponent: false,
      background: "bg-white",
    },
    selected: {
      title: (files: File[]) =>
        `${files.length} file${files.length > 1 ? "s" : ""} selected`,
      subtitle: (files: File[]) => files.map((file) => file.name).join(", "),
      icon: <UploadCloudIcon color="#0A8043" />,
      primaryButton: {
        text: "Upload",
        icon: <UploadIconSVG />,
        action: "upload",
      },
      secondaryButton: {
        text: "Choose different",
        icon: <BrowseIconSVG />,
        action: "browse",
      },
      cancelButton: {
        text: "Cancel",
        icon: <CancelIconSVG />,
        action: "cancel",
      },
      showBadgeComponent: true,
      badge: (files: File[]) =>
        `${files.length} file${files.length > 1 ? "s" : ""} ready to upload`,
      background: "bg-white",
    },
    uploading: {
      title: "Uploading...",
      subtitle: "Please wait",
      cancelButton: {
        text: "Cancel Upload",
        icon: <CancelIconSVG />,
        action: "cancel",
      },
      showBadgeComponent: true,
      badge: "Uploading...",
      background: "bg-white",
    },
    failed: {
      title: "Upload Failed",
      subtitle: "Something went wrong",
      icon: <ErrorIcon />,
      tryAgainButton: { text: "Try Again", action: "upload" },
      secondaryButton: {
        text: "Choose different",
        icon: <BrowseIconSVG />,
        action: "browse",
      },
      showBadgeComponent: false,
      background: "bg-[#fff6f6]",
    },
    success: {
      title: "Upload Complete!",
      subtitle: "Files uploaded successfully",
      icon: <SuccessIcon />,
      doneButton: { text: "Done", action: "done" },
      showBadgeComponent: true,
      badge: "Upload Successful",
      background: "bg-[#EBF9F1]",
    },
  } as const;





  const handleFileSelect = (fileId: string) => {
    setSelectedFileId((prevSelectedId) =>
      prevSelectedId === fileId ? null : fileId
    );
  };

  const handleDownloadFile = async (file: AttachmentFile) => {

    const fileId = file.id;


    try {

      const response = await api.get(`/api/files/${fileId}/download`, {
        responseType: "blob",
      });


      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });


      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      link.setAttribute("download", file.name || "downloaded_file");

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showAlert({ type: "error", message: "Failed to download file" });

    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    if (!newName.trim()) {
      alert("File name cannot be empty.");
      return;
    }

    try {
      await api.put(`/api/files/${fileId}`, { name: newName });
      alert(`File renamed to "${newName}" successfully!`);
    } catch (error: unknown) {
      let errorMessage = "Unknown error";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Error renaming file: ${errorMessage}`);
      showAlert({ type: "error", message: "Error renaming file" });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await api.delete(`/api/files/${fileId}`);
      alert("File deleted successfully!");
    } catch (error: unknown) {
      let errorMessage = "Unknown error";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Error deleting file: ${errorMessage}`);
      showAlert({ type: "error", message: "Error deleting file" });
    }
  };

  const filesForView = files.map((file) => ({
    ...file,
    isSelected: file.id === selectedFileId,
  }));

  return (
    <div className="pl-[25px] font-poppins ">
      <FileUpload
        config={fileUploadConfig}
        onFilesChange={handleFilesChange}
        uploadEndpoint="/api/files"
        folderId={selectedFolderIdInParent || undefined}
        accept=".pdf,.doc,.docx"
        multiple={true}
      />

      {/* Folders */}
      <FileManager
        fetchFolders={fetchFoldersApi}
        createFolder={createFolderApi}
        renameFolder={renameFolderApi}
        deleteFolder={deleteFolderApi}
        onCopyLink={handleCopyLinkExample}
        onDownload={handleDownloadExample}
        onShare={handleShareExample}
        onViewSize={handleViewSizeExample}
        onFolderSelect={handleFolderSelected}

      />



      <FileView
        files={filesForView}
        onFetchFiles={onFetchFilesCallback}
        onFileSelect={handleFileSelect}
        onRenameFile={handleRenameFile}
        onDeleteFile={handleDeleteFile}
        onDownloadFile={handleDownloadFile}
      />


      <div className="flex justify-between items-center flex-row gap-[916px] mt-[65px]">
        <div
          className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[93px] h-[34px]"
          style={{ width: "93px" }}
        >

          <button
            className="flex justify-center items-center flex-row gap-[4.313709259033203px] py-[5.032660484313965px] px-[6.470563888549805px] bg-[#FFF6F7] border-solid border-[#DF272A] border-[0.7664670944213867px] rounded-[49.82036209106445px] w-[100px] h-[34px]"
            style={{ width: "100px" }}
            onClick={() => navigate("/prospects?tab=investors")}
            type="button"
          >
            <svg
              width="20"
              height="19"
              viewBox="0 0 20 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="9.84214"
                cy="9.49106"
                r="8.58443"
                stroke="#DF272A"
                strokeWidth="1.22635"
              />
              <path
                d="M13.3253 6.73193L7.08203 12.9752M13.5204 13.1703L7.17867 6.82857"
                stroke="#DF272A"
                strokeWidth="1.53293"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[#DF272A] font-semibold">Cancel</span>
          </button>
        </div>

        <div className="flex justify-start items-center flex-row gap-4">


          <button
            className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#064771] rounded-[49.82036209106445px] h-[34px]"
            type="button"
            onClick={() => setActiveTab("partnership-details")}
          >
            <svg
              width="8"
              height="14"
              viewBox="0 0 8 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.71748 12.3618C8.09417 12.7366 8.09417 13.3443 7.71748 13.7191C7.34078 14.0939 6.73003 14.0939 6.35333 13.7191L0.282264 7.67829C-0.0940858 7.30381 -0.0940857 6.69667 0.282264 6.32219L6.35334 0.28136C6.73003 -0.0934614 7.34078 -0.0934612 7.71748 0.281361C8.09418 0.656182 8.09418 1.26389 7.71748 1.63871L2.32911 7.00024L7.71748 12.3618Z"
                fill="white"
              />
            </svg>

            <span className="text-[#FFF] ">Back</span>
          </button>


          <div className="flex justify-start items-end flex-row gap-[10.06532096862793px] h-[34px]">
            <button
              className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#064771] rounded-[49.82036209106445px] h-[34px]"
              onClick={() => navigate("/prospects?tab=investors")}
            >
              <span className="text-[#FFF] text-nowrap ">Publish</span>


            </button>
          </div>
        </div>
      </div>

    </div>


  );
};

export default Attachments;
