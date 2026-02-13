import { useState, useEffect, useRef, useCallback } from "react";
import { showAlert } from "./Alert";


export interface Folder {
  id: string;
  name: string;
  size?: number;
}

interface FolderManagerProps {
  fetchFolders: () => Promise<Folder[]>;
  createFolder: (name: string) => Promise<Folder>;
  renameFolder: (id: string, newName: string) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  onCopyLink?: (folderId: string) => void;
  onDownload?: (folderId: string) => void;
  onShare?: (folderId: string) => void;
  onViewSize?: (folderId: string) => void;
  initialLoading?: boolean;
  onFolderSelect?: (folderId: string | null) => void;
}

const contextMenuOptions = [
  {
    label: "Copy Link",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.5237 7.47634C9.22193 6.17457 7.1114 6.17457 5.80965 7.47634L2.47631 10.8097C1.17456 12.1114 1.17456 14.2219 2.47631 15.5237C3.77806 16.8254 5.88861 16.8254 7.19037 15.5237L8.10834 14.6058M7.47634 10.5237C8.77809 11.8254 10.8886 11.8254 12.1903 10.5237L15.5237 7.19037C16.8254 5.88861 16.8254 3.77806 15.5237 2.47631C14.2219 1.17456 12.1114 1.17456 10.8097 2.47631L9.89334 3.39265"
          stroke="#1C274C"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Download",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.4 16H13.6C16.1456 16 17.4183 16 18.2092 15.1888C19 14.3777 19 13.072 19 10.4608V9.53759C19 6.92641 19 5.62082 18.2092 4.8096C17.5176 4.10022 16.4575 4.01118 14.5 4M5.5 4C3.54247 4.01118 2.48235 4.10022 1.79081 4.80959C1 5.62082 1 6.92641 1 9.53759V10.4608C1 13.072 1 14.3777 1.79081 15.1888C2.06063 15.4656 2.38656 15.6479 2.8 15.7681"
          stroke="#1C274C"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10 1V12M10 12L8 9.03846M10 12L12 9.03846"
          stroke="#1C274C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Rename",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="19"
        viewBox="0 0 20 19"
        fill="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.34999 13.2643C2.82559 13.2643 2.40001 12.859 2.40001 12.3596V6.93099C2.40001 6.43156 2.82559 6.02623 3.34999 6.02623C3.87439 6.02623 4.30001 5.62089 4.30001 5.12147C4.30001 4.62204 3.87439 4.2167 3.34999 4.2167H2.40001C1.35026 4.2167 0.5 5.02647 0.5 6.02623V13.2643C0.5 14.2641 1.35026 15.0738 2.40001 15.0738H3.34999C3.87439 15.0738 4.30001 14.6685 4.30001 14.1691C4.30001 13.6697 3.87439 13.2643 3.34999 13.2643ZM17.6 4.2167H10.95C10.4256 4.2167 10 4.62204 10 5.12147C10 5.62089 10.4256 6.02623 10.95 6.02623H16.65C17.1744 6.02623 17.6 6.43156 17.6 6.93099V12.3596C17.6 12.859 17.1744 13.2643 16.65 13.2643H10.95C10.4256 13.2643 10 13.6697 10 14.1691C10 14.6685 10.4256 15.0738 10.95 15.0738H17.6C18.6497 15.0738 19.5 14.2641 19.5 13.2643V6.02623C19.5 5.02647 18.6497 4.2167 17.6 4.2167ZM10 17.7881C10 18.2876 9.57441 18.6929 9.05001 18.6929H5.25C4.7256 18.6929 4.30001 18.2876 4.30001 17.7881C4.30001 17.2887 4.7256 16.8834 5.25 16.8834H6.19999V2.40718H5.25C4.7256 2.40718 4.30001 2.00185 4.30001 1.50242C4.30001 1.00299 4.7256 0.597656 5.25 0.597656H9.05001C9.57441 0.597656 10 1.00299 10 1.50242C10 2.00185 9.57441 2.40718 9.05001 2.40718H8.09999V16.8834H9.05001C9.57441 16.8834 10 17.2887 10 17.7881Z"
          fill="#30313D"
        />
      </svg>
    ),
  },
  {
    label: "Share",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.5018 4.77778C11.5018 3.24365 12.7512 2 14.2923 2C15.8333 2 17.0827 3.24365 17.0827 4.77778C17.0827 6.3119 15.8333 7.55556 14.2923 7.55556C13.5141 7.55556 12.8108 7.2383 12.3053 6.72789L8.44243 9.35792C8.4781 9.53542 8.49685 9.71875 8.49685 9.906C8.49685 10.2768 8.42351 10.6313 8.29067 10.9553L12.5263 13.7382C13.007 13.3468 13.6221 13.1111 14.2923 13.1111C15.8333 13.1111 17.0827 14.3547 17.0827 15.8889C17.0827 17.423 15.8333 18.6667 14.2923 18.6667C12.7512 18.6667 11.5018 17.423 11.5018 15.8889C11.5018 15.4871 11.5878 15.1046 11.7424 14.7592L7.54107 11.9989C7.05098 12.4248 6.40902 12.6838 5.70642 12.6838C4.16532 12.6838 2.91602 11.4401 2.91602 9.906C2.91602 8.37186 4.16532 7.12821 5.70642 7.12821C6.5926 7.12821 7.38146 7.53937 7.89222 8.17932L11.6359 5.63035C11.5488 5.36133 11.5018 5.07467 11.5018 4.77778Z"
          fill="#1C274C"
        />
      </svg>
    ),
  },
  {
    label: "Size",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_1501_37098)">
          <path
            d="M10 14.167V9.16699"
            stroke="#1C274C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9.99935 5.83333C10.4596 5.83333 10.8327 6.20643 10.8327 6.66667C10.8327 7.1269 10.4596 7.5 9.99935 7.5C9.53911 7.5 9.16602 7.1269 9.16602 6.66667C9.16602 6.20643 9.53911 5.83333 9.99935 5.83333Z"
            fill="#1C274C"
          />
          <path
            d="M5.83268 2.78184C7.05841 2.0728 8.48152 1.66699 9.99935 1.66699C14.6017 1.66699 18.3327 5.39795 18.3327 10.0003C18.3327 14.6027 14.6017 18.3337 9.99935 18.3337C5.39697 18.3337 1.66602 14.6027 1.66602 10.0003C1.66602 8.48249 2.07182 7.05938 2.78087 5.83366"
            stroke="#1C274C"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_1501_37098">
            <rect width="20" height="20" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    label: "Delete",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="21" viewBox="0 0 18 21" fill="none">
        <path d="M2.55882 5.9267V17.5738C2.55882 18.7433 3.50693 19.6914 4.67647 19.6914H13.1471C14.3166 19.6914 15.2647 18.7433 15.2647 17.5738V5.9267M2.55882 5.9267H1.5M2.55882 5.9267H4.67647M15.2647 5.9267H16.3235M15.2647 5.9267H13.1471M4.67647 5.9267V3.80905C4.67647 2.63951 5.62457 1.69141 6.79412 1.69141H11.0294C12.199 1.69141 13.1471 2.63951 13.1471 3.80905V5.9267M4.67647 5.9267H13.1471M6.79412 10.162V15.4561M11.0294 10.162V15.4561" stroke="#DF272A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export const FileManager = ({
  fetchFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  onCopyLink,
  onDownload,
  onShare,
  onViewSize,
  initialLoading = true,
  onFolderSelect,
}: FolderManagerProps): JSX.Element => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const folderBeingRenamed = useRef<string | null>(null);
  const [renameInputId, setRenameInputId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);




  useEffect(() => {
    const loadFolders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchFolders();
        setFolders(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to fetch folders" });
        setError("Failed to load folders. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFolders();
  }, [fetchFolders]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
        // Ensure rename input is closed if the dropdown is the trigger point
        if (renameInputId !== null) {
          setRenameInputId(null);
          setNewFolderName("");
          folderBeingRenamed.current = null;
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, renameInputId]);

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        setIsLoading(true);
        setError(null);
        const newFolder = await createFolder(newFolderName.trim());
        setFolders((prevFolders) => [...prevFolders, newFolder]);
        setNewFolderName("");
        setIsModalOpen(false);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to create folder" });
        setError("Failed to create folder. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDropdownToggle = useCallback(
    (folderId: string) => {
      setActiveDropdown(activeDropdown === folderId ? null : folderId);
      // Close rename input if it's open for this folder when toggling dropdown
      if (renameInputId === folderId) {
        setRenameInputId(null);
        setNewFolderName("");
        folderBeingRenamed.current = null;
      } else {
        // Only close rename input if toggling a DIFFERENT dropdown or closing
        setRenameInputId(null);
        setNewFolderName("");
        folderBeingRenamed.current = null;
      }
    },
    [activeDropdown, renameInputId]
  );

  const handleRenameClick = useCallback((folder: Folder) => {
    setActiveDropdown(null); // Close dropdown
    folderBeingRenamed.current = folder.id;
    setNewFolderName(folder.name); // Pre-fill input
    setRenameInputId(folder.id); // Show rename input for this folder
  }, []);

  const handleRenameFolder = async (folderId: string) => {
    if (
      newFolderName.trim() &&
      newFolderName.trim() !== folders.find((f) => f.id === folderId)?.name
    ) {
      try {
        setIsLoading(true);
        setError(null);
        const updatedFolder = await renameFolder(
          folderId,
          newFolderName.trim()
        );
        setFolders(
          folders.map((folder) =>
            folder.id === folderId ? updatedFolder : folder
          )
        );
        setRenameInputId(null);
        setNewFolderName("");
        folderBeingRenamed.current = null;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to rename folder" });
        setError("Failed to rename folder. Please try again.");
        // Optionally reset to original name on error
      } finally {
        setIsLoading(false);
      }
    } else {
      // If the new name is empty or the same as the old one, just cancel renaming
      setRenameInputId(null);
      setNewFolderName("");
      folderBeingRenamed.current = null;
    }
  };

  const handleDeleteFolder = useCallback(async (folderId: string) => {
    setActiveDropdown(null); // Close dropdown
    // Add a confirmation dialog here in a real application
    if (window.confirm("Are you sure you want to delete this folder?")) {
      try {
        setIsLoading(true);
        setError(null);
        await deleteFolder(folderId);
        setFolders(folders.filter((folder) => folder.id !== folderId));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to delete folder" });
        setError("Failed to delete folder. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [deleteFolder, folders]);





















  const handleContextMenuAction = useCallback(
    (optionLabel: string, folderId: string) => {
      setActiveDropdown(null); // Close dropdown after action is initiated
      switch (optionLabel) {
        case "Copy Link":
          onCopyLink?.(folderId);
          // handleCopyLink(folderId);
          break;
        case "Download":
          onDownload?.(folderId);
          break;
        case "Rename":
          // Handled by separate click handler on the option itself (handleRenameClick)
          break;
        case "Share":
          onShare?.(folderId);
          break;
        case "Size": {
          onViewSize?.(folderId);
          const folder = folders.find((f) => f.id === folderId);
          alert(`Folder Size: ${folder?.size || "Fetching..."}`);
          break;
        }
        case "Delete":
          handleDeleteFolder(folderId);
          break;
        default:
        // console.warn(`Unknown context menu action: ${optionLabel}`);
      }
    },
    [onCopyLink, onDownload, onShare, onViewSize, handleDeleteFolder, folders]
  );

  const handleFolderClick = useCallback(async (folderId: string) => {
    // Deselect if clicking the already selected folder
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
      onFolderSelect?.(null);
      // Optionally provide feedback that selection was cleared
      // alert("Folder deselected.");
    } else {
      // Select the new folder
      setSelectedFolderId(folderId);
      onFolderSelect?.(folderId);
      // Copy the folder ID to clipboard
      try {
        await navigator.clipboard.writeText(folderId);
        // Provide feedback that the ID was copied
        // alert(`Folder ID copied: ${folderId}`);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to copy folder ID" });
        // Optionally provide error feedback to the user
        // alert("Failed to copy folder ID.");
      }
    }
    // Close any open dropdown when a folder is clicked
    setActiveDropdown(null);
    // Close rename input if open
    if (renameInputId !== null) {
      setRenameInputId(null);
      setNewFolderName("");
      folderBeingRenamed.current = null;
    }

  }, [selectedFolderId, onFolderSelect, renameInputId]);




















  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-full px-[25px] py-10">
        <div className="w-full">
          <div className="w-full">
            <div className="flex flex-col w-full items-start gap-5">
              <div className="flex flex-col items-start gap-4 w-full">
                <div className="flex items-center gap-4">
                  <h2 className="font-medium text-[#0c5577] text-lg leading-5">
                    Folders
                  </h2>
                  {!isLoading && !error && folders.length > 0 ? (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="h-[34px] flex items-center gap-2 px-4 py-1 bg-[#064771] rounded-[49.82px] text-white text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      <svg
                        width="21"
                        height="16"
                        viewBox="0 0 21 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.5 6.78962V10.6468M12.5 8.71819H8.5M3.5 14.5039H17.5C18.6046 14.5039 19.5 13.6405 19.5 12.5753V4.86105C19.5 3.79593 18.6046 2.93248 17.5 2.93248H10.8284C10.298 2.93248 9.7893 2.72929 9.4142 2.36761L8.5858 1.56878C8.21071 1.20709 7.70201 1.00391 7.17157 1.00391H3.5C2.39543 1.00391 1.5 1.86736 1.5 2.93248V12.5753C1.5 13.6405 2.39543 14.5039 3.5 14.5039Z"
                          stroke="white"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Create</span>
                    </button>
                  ) : (
                    <div style={{ height: "34px" }} />
                  )}
                </div>
                <div className="w-full h-[1px] bg-[#dadce0]" />
              </div>
              {/* Simplified Conditional Rendering */}
              {isLoading && (
                <div className="flex justify-center items-center w-full py-20">
                  <p className="text-gray-500 text-lg">Loading folders...</p>
                </div>
              )}
              {error && (
                <div className="flex justify-center items-center w-full py-20 text-red-600 text-lg">
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && folders.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 bg-[#F7F7F7] border border-dashed border-[#727272] rounded-lg h-60 w-full ">
                  <div className="flex flex-col items-center gap-6 text-center w-full">
                    <svg
                      width="61"
                      height="49"
                      viewBox="0 0 61 49"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M24.0703 21.3502L36.9275 34.2073M36.9275 21.3502L24.0703 34.2073M30.7004 5.4804L30.2973 5.07707C29.1855 3.96522 28.6295 3.40931 27.9808 3.01177C27.4055 2.65929 26.7783 2.39954 26.1226 2.24208C25.3827 2.06445 24.5965 2.06445 23.0241 2.06445H11.856C8.2557 2.06445 6.45551 2.06445 5.08038 2.76513C3.87074 3.38144 2.8873 4.36489 2.27099 5.57452C1.57031 6.94965 1.57031 8.74981 1.57031 12.3502V36.7787C1.57031 40.3791 1.57031 42.1794 2.27099 43.5545C2.8873 44.764 3.87074 45.7476 5.08038 46.3637C6.45551 47.0645 8.25567 47.0645 11.856 47.0645H49.1417C52.7421 47.0645 54.5424 47.0645 55.9175 46.3637C57.127 45.7476 58.1106 44.764 58.7267 43.5545C59.4275 42.1794 59.4275 40.3791 59.4275 36.7787V18.7787C59.4275 15.1784 59.4275 13.3782 58.7267 12.0031C58.1106 10.7935 57.127 9.81001 55.9175 9.19371C54.5424 8.49302 52.7421 8.49302 49.1417 8.49302H37.9737C36.4013 8.49302 35.6151 8.49302 34.8751 8.3154C34.2194 8.15793 33.5923 7.89819 33.017 7.54571C32.3683 7.14817 31.8122 6.59226 30.7004 5.4804Z"
                        stroke="#BBBBBB"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-900 text-base font-medium">
                        No Folders to show
                      </span>
                      <span className="text-gray-500 text-sm">
                        Create a Folder under this prospect to see the folders
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="h-[34px] flex items-center gap-2 px-4 py-1 bg-[#064771] rounded-[49.82px] text-white text-base font-medium transition-colors hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      <svg
                        width="21"
                        height="16"
                        viewBox="0 0 21 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.5 6.78962V10.6468M12.5 8.71819H8.5M3.5 14.5039H17.5C18.6046 14.5039 19.5 13.6405 19.5 12.5753V4.86105C19.5 3.79593 18.6046 2.93248 17.5 2.93248H10.8284C10.298 2.93248 9.7893 2.72929 9.4142 2.36761L8.5858 1.56878C8.21071 1.20709 7.70201 1.00391 7.17157 1.00391H3.5C2.39543 1.00391 1.5 1.86736 1.5 2.93248V12.5753C1.5 13.6405 2.39543 14.5039 3.5 14.5039Z"
                          stroke="white"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Create</span>
                    </button>
                  </div>
                </div>
              )}
              {!isLoading && !error && folders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 w-full">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      // Add onClick to select folder and copy ID
                      onClick={() => handleFolderClick(folder.id)}
                      className={`flex items-center justify-between gap-4 px-4 py-3 rounded-md border border-solid bg-white relative hover:shadow-sm transition-shadow cursor-pointer
                        ${selectedFolderId === folder.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-[#dadce0]'}` // Conditional classes for selection
                      }
                    >
                      <div className="flex items-center min-w-0 flex-grow">
                        <svg
                          width="27"
                          height="22"
                          viewBox="0 0 27 22"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1.375 5.93366C1.375 4.44018 1.375 3.69345 1.66565 3.12302C1.92131 2.62125 2.32925 2.2133 2.83103 1.95765C3.40145 1.66699 4.1482 1.66699 5.64167 1.66699H10.2744C10.9266 1.66699 11.2527 1.66699 11.5597 1.74067C11.8317 1.80599 12.0918 1.91374 12.3305 2.05995C12.5995 2.22486 12.8302 2.45546 13.2914 2.91667L13.4586 3.08398C13.9198 3.54519 14.1505 3.77579 14.4195 3.9407C14.6582 4.08691 14.9183 4.19466 15.1903 4.25998C15.4973 4.33366 15.8234 4.33366 16.4757 4.33366H21.1083C22.6018 4.33366 23.3486 4.33366 23.919 4.62431C24.4207 4.87997 24.8287 5.28791 25.0843 5.78969C25.375 6.36011 25.375 7.10686 25.375 8.60033V16.067C25.375 17.5605 25.375 18.3073 25.0843 18.8777C24.8287 19.3794 24.4207 19.7874 23.919 20.043C23.3486 20.3337 22.6018 20.3337 21.1083 20.3337H5.64167C4.14819 20.3337 3.40145 20.3337 2.83103 20.043C2.32925 19.7874 1.92131 19.3794 1.66565 18.8777C1.375 18.3073 1.375 17.5605 1.375 16.067V5.93366Z"
                            fill="#8DC6EC"
                            stroke="#064771"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {renameInputId === folder.id ? (
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onBlur={() => handleRenameFolder(folder.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameFolder(folder.id);
                              } else if (e.key === "Escape") {
                                setRenameInputId(null);
                                setNewFolderName("");
                                folderBeingRenamed.current = null;
                              }
                            }}
                            className="ml-4 text-[13px] font-medium text-gray-900 flex-grow outline-none border-b border-blue-500 bg-transparent"
                            onClick={(e) => e.stopPropagation()} // Stop propagation on input click
                            autoFocus
                            aria-label="Rename folder"
                            title="Rename folder"
                          />
                        ) : (
                          <div className="ml-4 text-[13px] font-medium text-gray-900 truncate flex-grow">
                            {folder.name}
                          </div>
                        )}
                      </div>

                      {/* Action button container - kept relative */}
                      <div className="relative flex-shrink-0">
                        {/* Button is always visible */}
                        <button
                          // Click handler to toggle the dropdown
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent click from affecting parent elements
                            handleDropdownToggle(folder.id); // Toggle dropdown for this folder
                          }}
                          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                          aria-label="Folder actions"
                          // Disable button if renaming is active for this folder
                          disabled={renameInputId === folder.id}
                        >
                          <svg
                            width="4"
                            height="16"
                            viewBox="0 0 4 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M2 4C3.1 4 4 3.1 4 2C4 0.9 3.1 0 2 0C0.9 0 0 0.9 0 2C0 3.1 0.9 4 2 4ZM2 6C0.9 6 0 6.9 0 8C0 9.1 0.9 10 2 10C3.1 10 4 9.1 4 8C4 6.9 3.1 6 2 6ZM2 12C0.9 12 0 12.9 0 14C0 15.1 0.9 16 2 16C3.1 16 4 15.1 4 14C4 12.9 3.1 12 2 12Z"
                              fill="#717171"
                            />
                          </svg>
                        </button>

                        {/* Dropdown conditional on click trigger, relative to button container */}
                        {/* Also hide dropdown if rename input is active for this folder */}
                        {activeDropdown === folder.id &&
                          renameInputId !== folder.id && (
                            <div
                              ref={dropdownRef}
                              className="absolute left-0 top-[calc(100%+8px)] w-[255px] bg-white rounded-[10px] shadow-lg p-2 z-50 border border-gray-200" // Changed right-0 to left-0
                              style={{
                                boxShadow:
                                  "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
                              }}
                              // Keep stopPropagation here to prevent outside click handler interfering
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex flex-col">
                                {contextMenuOptions.map((option, index) => {
                                  if (option.label === "Rename") {
                                    return (
                                      <button
                                        key={index}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md w-full text-left"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRenameClick(folder);
                                        }} // Stop propagation on click inside menu
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" viewBox="0 0 20 19" fill="none">
                                          <path fillRule="evenodd" clipRule="evenodd" d="M3.34999 13.2643C2.82559 13.2643 2.40001 12.859 2.40001 12.3596V6.93099C2.40001 6.43156 2.82559 6.02623 3.34999 6.02623C3.87439 6.02623 4.30001 5.62089 4.30001 5.12147C4.30001 4.62204 3.87439 4.2167 3.34999 4.2167H2.40001C1.35026 4.2167 0.5 5.02647 0.5 6.02623V13.2643C0.5 14.2641 1.35026 15.0738 2.40001 15.0738H3.34999C3.87439 15.0738 4.30001 14.6685 4.30001 14.1691C4.30001 13.6697 3.87439 13.2643 3.34999 13.2643ZM17.6 4.2167H10.95C10.4256 4.2167 10 4.62204 10 5.12147C10 5.62089 10.4256 6.02623 10.95 6.02623H16.65C17.1744 6.02623 17.6 6.43156 17.6 6.93099V12.3596C17.6 12.859 17.1744 13.2643 16.65 13.2643H10.95C10.4256 13.2643 10 13.6697 10 14.1691C10 14.6685 10.4256 15.0738 10.95 15.0738H17.6C18.6497 15.0738 19.5 14.2641 19.5 13.2643V6.02623C19.5 5.02647 18.6497 4.2167 17.6 4.2167ZM10 17.7881C10 18.2876 9.57441 18.6929 9.05001 18.6929H5.25C4.7256 18.6929 4.30001 18.2876 4.30001 17.7881C4.30001 17.2887 4.7256 16.8834 5.25 16.8834H6.19999V2.40718H5.25C4.7256 2.40718 4.30001 2.00185 4.30001 1.50242C4.30001 1.00299 4.7256 0.597656 5.25 0.597656H9.05001C9.57441 0.597656 10 1.00299 10 1.50242C10 2.00185 9.57441 2.40718 9.05001 2.40718H8.09999V16.8834H9.05001C9.57441 16.8834 10 17.2887 10 17.7881Z" fill="#30313D" />
                                        </svg>
                                        <span className=" font-medium text-gray-900 text-sm leading-5 whitespace-nowrap">
                                          {option.label}
                                        </span>
                                      </button>
                                    );
                                  }

                                  return (
                                    <button
                                      key={index}
                                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md w-full text-left"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContextMenuAction(
                                          option.label,
                                          folder.id
                                        );
                                      }} // Stop propagation on click inside menu
                                    >
                                      {option.icon}
                                      <span className=" font-medium text-gray-900 text-sm leading-5 whitespace-nowrap">
                                        {option.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}{" "}
              {/* Closing conditional for folders.length > 0 */}
            </div>{" "}
            {/* Closes div with flex-col items-start gap-5 */}
          </div>{" "}
          {/* Closes div with w-full */}
        </div>{" "}
        {/* Closes div with w-full max-w-[1553px] */}
      </div>{" "}
      {/* Closes div with bg-white w-full max-w-[1745px] ... */}
      {/* Modal conditional rendering */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="w-[520px] bg-white rounded-2xl animate-fade-in-down">
            <div className="px-6 py-4 border-b border-[#e0e2e5]">
              <h2 className="font-medium text-gray-900 text-lg leading-7">
                Create Folder
              </h2>
              <p className=" font-normal text-gray-900 text-[13px] leading-5">
                Make new folder to store files
              </p>
            </div>

            <div className="p-6">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter Folder Name"
                className="w-full h-10 px-5 py-[13px] rounded-[5px] border-[0.5px] border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder();
                  } else if (e.key === "Escape") {
                    setIsModalOpen(false);
                    setNewFolderName("");
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e0e2e5]">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewFolderName("");
                }}
                className="min-w-[79px] h-[34px] font-medium text-gray-600 rounded-[49.82px] border-[0.77px] border-[#717171] px-4 py-1 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="min-w-[106px] h-[34px] font-medium text-[#064771] rounded-[49.82px] border-[0.77px] border-[#064771] px-4 py-1 transition-colors hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !newFolderName.trim()}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Style block */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
