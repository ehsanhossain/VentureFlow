/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from "react";
import { showAlert } from "./Alert";

interface File {
  id: string;
  name: string;
  size?: number;
  type?: string;
  mime_type?: string;
  isSelected?: boolean;
  previewImageUrl?: string;
}

interface FileViewProps {
  files?: File[];
  onFetchFiles?: () => Promise<File[]>;
  onFileSelect?: (fileId: string) => void;
  onRenameFile?: (fileId: string, newName: string) => void;
  onDeleteFile?: (fileId: string) => void;
  onDownloadFile: (file: File) => void;
}

const getFileIcon = (mimeType: string | undefined): JSX.Element => {
  const baseSvg = (pathD: string, fill: string) => (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 mr-2"
    >
      <path d={pathD} fill={fill} />
    </svg>
  );

  const defaultIconPath =
    "M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z";
  const defaultColor = "#5F6368";

  if (!mimeType) {
    return baseSvg(defaultIconPath, defaultColor);
  }

  if (mimeType === "application/vnd.google-apps.document") {
    return baseSvg(defaultIconPath, "#4285F4");
  } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
    return baseSvg(defaultIconPath, "#34A853");
  } else if (mimeType === "application/vnd.google-apps.presentation") {
    return baseSvg(defaultIconPath, "#F9AB00");
  } else if (mimeType === "application/pdf") {
    return baseSvg(defaultIconPath, "#EA4335");
  } else if (mimeType.startsWith("image/")) {
    return baseSvg(
      "M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2l-.01-12zM19 14H5V6h14v8zm-4.5-2.5l-2.5 3.01L9.5 12l-2.5 4h10l-3-4z",
      "#795548"
    );
  } else if (mimeType.startsWith("video/")) {
    return baseSvg(
      "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
      "#E53935"
    );
  } else if (mimeType.startsWith("audio/")) {
    return baseSvg(
      "M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z",
      "#1E88E5"
    );
  }

  return baseSvg(defaultIconPath, defaultColor);
};

const FileView: React.FC<FileViewProps> = ({
  files: initialFilesFromProps = [],
  onFetchFiles,
  onFileSelect,
  onRenameFile,
  onDeleteFile,
  onDownloadFile,
}) => {
 
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");

  const [displayedFiles, setDisplayedFiles] = useState<File[]>(
    initialFilesFromProps
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
        if (
          renamingFileId !== null &&
          !(event.target as HTMLElement).classList.contains("file-rename-input")
        ) {
          handleCancelRename();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef, renamingFileId]);

  useEffect(() => {
    if (typeof onFetchFiles === "function") {
      setIsLoading(true);
      setFetchError(null);
      onFetchFiles()
        .then((fetchedData: File[]) => {
          if (!Array.isArray(fetchedData)) {
            showAlert({
              type: "error",
              message: "Data from onFetchFiles is not an array",
            });
            setFetchError(
              "Invalid data format from onFetchFiles. Expected an array of files."
            );
            setDisplayedFiles([]);
          } else {
            setDisplayedFiles(fetchedData);
          }
        })
        .catch((err) => {
          showAlert({ type: "error", message: "Error calling onFetchFiles" });
          setFetchError(
            err.message || "An error occurred while fetching files."
          );
          setDisplayedFiles([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [onFetchFiles]);

  useEffect(() => {
    if (typeof onFetchFiles !== "function") {
      setDisplayedFiles(initialFilesFromProps);
      setIsLoading(false);
      setFetchError(null);
    }
  }, [initialFilesFromProps, onFetchFiles]);

  const toggleDropdown = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === fileId ? null : fileId);
  };

  const handleRename = (file: File) => {
    setRenamingFileId(file.id);
    setNewFileName(file.name);
    setOpenDropdownId(null);
    setTimeout(() => {
      const input = document.getElementById(`rename-input-${file.id}`);
      input?.focus();
      if (input instanceof HTMLInputElement) {
        input.select();
      }
    }, 0);
  };

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewFileName(event.target.value);
  };

  const handleSaveRename = () => {
    if (renamingFileId !== null && newFileName.trim() !== "") {
      if (onRenameFile) {
        onRenameFile(renamingFileId, newFileName.trim());
        setDisplayedFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === renamingFileId ? { ...f, name: newFileName.trim() } : f
          )
        );
      }
    }
    setRenamingFileId(null);
    setNewFileName("");
  };

  const handleCancelRename = () => {
    setRenamingFileId(null);
    setNewFileName("");
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSaveRename();
    } else if (event.key === "Escape") {
      handleCancelRename();
    }
  };

  const handleDelete = (fileId: string) => {
    setOpenDropdownId(null);
    if (onDeleteFile) {
      onDeleteFile(fileId);
      setDisplayedFiles((prevFiles) =>
        prevFiles.filter((f) => f.id !== fileId)
      );
    }
  };

  const handleDownload = (file: File) => {

    onDownloadFile(file);
    setOpenDropdownId(null);
  };

  return (
    <div className="p-4" ref={containerRef}>
      <span className="text-[18px] leading-[20px] font-medium text-[#0C5577] font-[Poppins] block py-4">
        Files
      </span>
      <div className="w-full h-px bg-[#BCC2C5]"></div>
      <div className="mb-4"></div>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <svg
            className="animate-spin h-8 w-8 text-[#0C5577]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-3 text-gray-600">Loading files...</span>
        </div>
      )}

      {fetchError && !isLoading && (
        <div className="flex flex-col justify-center items-center py-10 text-center bg-red-50 p-4 rounded-lg border border-red-200">
          <svg
            className="h-10 w-10 text-red-500 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-red-700 font-semibold text-lg">
            Failed to load files
          </div>
          <div className="text-sm text-red-600 mt-1">{fetchError}</div>
        </div>
      )}

      {!isLoading && !fetchError && displayedFiles.length === 0 && (
        <div className="flex self-stretch justify-center items-center flex-col gap-[4.745220184326172px] bg-[#FFFFFF] border-dashed border-[#064771] border-[1.8980880975723267px] rounded-[12.337573051452637px] h-[240px] mt-[33px]">
          <div
            className="flex justify-center items-center flex-col gap-[23px] w-[1259px]"
            style={{ width: "1259px" }}
          >
            <div className="flex justify-start items-center flex-col gap-4">
              {/* SVG Logo */}
              <svg
                width="49"
                height="49"
                viewBox="0 0 49 49"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.99219 2.06519L47.0039 47.0769M6.99349 7.06649V39.0748C6.99349 41.8758 6.99349 43.2764 7.53861 44.3462C8.01808 45.2872 8.78318 46.0524 9.72425 46.5318C10.7941 47.0769 12.1946 47.0769 14.9956 47.0769H37.0013C39.7635 47.0769 42.0026 44.8378 42.0026 42.0756M42.0026 17.0691L26.9987 2.06519M42.0026 17.0691H30.9997C29.5991 17.0691 28.8989 17.0691 28.3641 16.7965C27.8934 16.5568 27.5111 16.1742 27.2713 15.7037C26.9987 15.1688 26.9987 14.4685 26.9987 13.0681V2.06519M42.0026 17.0691V29.5723M26.9987 2.06519H15.7458"
                  stroke="#BBBBBB"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Text Section */}
              <div className="flex justify-start items-center flex-col gap-[7.1178297996521px]">
                <span className="text-gray-900 text-center font-medium">
                  No Files to show
                </span>
                <span className="text-gray-500 text-sm text-center">
                  Upload file to view here
                </span>
              </div>

              {/* Upload Button Area */}
              {/* <div
                className="flex justify-center items-center flex-row gap-3 w-[423px] h-[40px]"
                style={{ width: "423px" }}
              >
                <div
                  className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#064771] rounded-[49.82036209106445px] w-[152px] h-[34px]"
                  style={{ width: "152px" }}
                >
                  <button className="flex flex-1 justify-center items-center flex-row gap-2 py-[5.032660484313965px] px-[6.470563888549805px] bg-[#064771] rounded-[49.82036209106445px] h-[34px]">
                    <svg
                      width="21"
                      height="20"
                      viewBox="0 0 21 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.5008 14.3454V8.04541V14.3454ZM10.5008 8.04541L13.2008 10.7454L10.5008 8.04541ZM10.5008 8.04541L7.80078 10.7454L10.5008 8.04541Z"
                        fill="white"
                      />
                      <path
                        d="M10.5008 14.3454V8.04541M10.5008 8.04541L13.2008 10.7454M10.5008 8.04541L7.80078 10.7454"
                        stroke="white"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14.0984 5.34546H10.4984H6.89844"
                        stroke="white"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M1.5 9.84595C1.5 5.6033 1.5 3.48198 2.81802 2.16397C4.13604 0.845947 6.25736 0.845947 10.5 0.845947C14.7426 0.845947 16.864 0.845947 18.1819 2.16397C19.5 3.48198 19.5 5.6033 19.5 9.84595C19.5 14.0885 19.5 16.2099 18.1819 17.5279C16.864 18.8459 14.7426 18.8459 10.5 18.8459C6.25736 18.8459 4.13604 18.8459 2.81802 17.5279C1.5 16.2099 1.5 14.0885 1.5 9.84595Z"
                        stroke="white"
                        strokeWidth="1.4"
                      />
                    </svg>
                    <span className="text-[#FFF] text-nowrap">Browse File</span>
                  </button>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !fetchError && displayedFiles.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {displayedFiles.map((file, index) => (
            <div
              key={file.id || `${file.name || "file"}-${index}`}
              className={`
                relative flex flex-col rounded-xl border flex-shrink-0
                w-[240.64px] h-[240.64px] bg-[#f0f4f9] border-[#f0f4f9]
                ${
                  file.isSelected
                    ? "border-2 border-blue-500 shadow-md"
                    : "hover:shadow-lg"
                }
                cursor-pointer transition-all duration-200 ease-in-out
                overflow-hidden group
              `}
              onClick={() => {
                if (renamingFileId !== file.id) {
                  if (onFileSelect) {
                    onFileSelect(file.id);
                  }
                }
              }}
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center flex-grow min-w-0 mr-2">
                  {getFileIcon(file.mime_type)}
                  {renamingFileId === file.id ? (
                    <input
                      id={`rename-input-${file.id}`}
                      type="text"
                      value={newFileName}
                      onChange={handleFileNameChange}
                      onKeyDown={handleInputKeyDown}
                      onBlur={handleSaveRename}
                      className="file-rename-input flex-grow text-sm text-gray-900 font-medium border-b-2 border-blue-500 outline-none bg-transparent focus:ring-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div
                      className="text-sm text-gray-900 font-medium truncate"
                      title={file.name}
                    >
                      {file.name}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    className="flex-shrink-0 cursor-pointer p-1 rounded-full hover:bg-gray-200 group-hover:opacity-100 opacity-0 transition-opacity"
                    onClick={(e) => toggleDropdown(file.id, e)}
                    aria-label="File options"
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-500"
                      >
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </div>
                  </button>

                  {openDropdownId === file.id && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-md shadow-xl z-20 border border-gray-200">
                      <ul className="py-1">
                        <li
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="21"
                            height="21"
                            viewBox="0 0 21 21"
                            fill="none"
                          >
                            <g clipPath="url(#clip0_611_49047)">
                              <path
                                d="M6.9 16.5977H14.1C16.6456 16.5977 17.9183 16.5977 18.7092 15.7864C19.5 14.9753 19.5 13.6696 19.5 11.0584V10.1352C19.5 7.52407 19.5 6.21847 18.7092 5.40726C18.0176 4.69788 16.9575 4.60884 15 4.59766M6 4.59766C4.04247 4.60884 2.98235 4.69788 2.29081 5.40725C1.5 6.21847 1.5 7.52407 1.5 10.1352V11.0584C1.5 13.6696 1.5 14.9753 2.29081 15.7864C2.56063 16.0632 2.88656 16.2455 3.3 16.3657"
                                stroke="#30313D"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M10.5 1.59766V12.5977M10.5 12.5977L8.5 9.63612M10.5 12.5977L12.5 9.63612"
                                stroke="#30313D"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_611_49047">
                                <rect
                                  width="20"
                                  height="20"
                                  fill="white"
                                  transform="translate(0.5 0.597656)"
                                />
                              </clipPath>
                            </defs>
                          </svg>
                          <span className="ml-2"> Download</span>
                        </li>

                        <li
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRename(file);
                          }}
                        >
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
                          <span className="ml-2"> Rename</span>
                        </li>
                        <li
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file.id);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="21"
                            viewBox="0 0 18 21"
                            fill="none"
                          >
                            <path
                              d="M2.55882 5.9267V17.5738C2.55882 18.7433 3.50693 19.6914 4.67647 19.6914H13.1471C14.3166 19.6914 15.2647 18.7433 15.2647 17.5738V5.9267M2.55882 5.9267H1.5M2.55882 5.9267H4.67647M15.2647 5.9267H16.3235M15.2647 5.9267H13.1471M4.67647 5.9267V3.80905C4.67647 2.63951 5.62457 1.69141 6.79412 1.69141H11.0294C12.199 1.69141 13.1471 2.63951 13.1471 3.80905V5.9267M4.67647 5.9267H13.1471M6.79412 10.162V15.4561M11.0294 10.162V15.4561"
                              stroke="#DF272A"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="ml-2"> Delete</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-grow flex justify-center items-center p-1 overflow-hidden">
                <div
                  className="w-full h-full rounded-md bg-cover bg-center flex justify-center items-center text-gray-500 text-sm"
                  style={{
                    backgroundImage: file.previewImageUrl
                      ? `url(${file.previewImageUrl})`
                      : "none",
                    backgroundColor: !file.previewImageUrl
                      ? "#e2e8f0"
                      : "transparent",
                  }}
                >
                  {!file.previewImageUrl && (
                    <div className="flex flex-col justify-center items-center text-center p-2">
                      <div className="transform scale-150 mb-3">
                        {getFileIcon(file.mime_type)}
                      </div>
                      <div className="mt-1 text-xs text-gray-700 capitalize break-all px-1">
                        {file.type ||
                          (file.mime_type
                            ? file.mime_type.split("/")[1].split(".").pop()
                            : "File")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default FileView;
