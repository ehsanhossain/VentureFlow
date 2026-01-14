import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import api from '../../../config/api';
import { FileManager, Folder } from '../../../components/FileManager';
import { useNavigate } from 'react-router-dom';
import FileView from '../../../components/FileView';
import { showAlert } from '../../../components/Alert';
import html2pdf from 'html2pdf.js';
import { useTranslation } from 'react-i18next';

interface ApiFile {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  previewImageUrl?: string;
}

interface AttachmentFile {
  id: string;
  name: string;
  mime_type?: string;
  size?: number;
  previewImageUrl?: string;
  isSelected?: boolean;
}

const Attachments: React.FC = () => {
  const { t } = useTranslation();
  const { id: paramId } = useParams();
  const id = paramId || localStorage.getItem('seller_id');

  // All hooks must be called at the top level
  const navigate = useNavigate();

  const [companyInfo, setCompanyInfo] = useState({
    company_title: '',
    origin_country_flag_svg: '',
    rating: '',
    company_type: '',
    status: '',
    origin_country: '',
    partner_id: '',
    updated_at: '',
    image_url: '',
  });

  interface Country {
    id: number;
    name: string;
    svg_icon_url: string;
  }

  const [countries, setCountries] = useState<Country[]>([]);
  // Removed unused states: partner, loading, error, refreshTrigger
  const [selectedFolderIdInParent, setSelectedFolderIdInParent] = useState<string | null>(null);
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const mapApiFileToFile = (apiFile: ApiFile): AttachmentFile => {
    return {
      id: apiFile.id,
      name: apiFile.name,
      mime_type: apiFile.mime_type,
      size: apiFile.size,
      previewImageUrl: apiFile.previewImageUrl,
    };
  };

  const handleDownloadPDF = async () => {
    const element = document.querySelector<HTMLElement>('.pdf-container');
    if (!element) {
      showAlert({ type: "error", message: t('settings.partners.error.pdfElementNotFound') });
      return;
    }
    await document.fonts.ready;

    const options = {
      margin: 0.1,
      filename: 'Ventureflow.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: window.devicePixelRatio * 2 || 2,
        scrollY: 0,
        letterRendering: true,
        useCORS: true,
      },
      jsPDF: {
        unit: 'in',
        format: [18, 10.5],
        orientation: 'landscape',
      },
    };


    html2pdf().set(options).from(element).save();
  };

  const baseURL = import.meta.env.VITE_APP_URL;

  const handleCopyLinkExample = (linkId: string) => {
    const fullUrl = `${baseURL}/partner-portal/view/${linkId}`;


    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        showAlert({
          type: 'success',
          message: t('settings.partners.success.linkCopied'),
        });

      })
      .catch(() => {
        showAlert({ type: "error", message: t('settings.partners.error.copyLinkFailed') });
      });
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res = await fetch('/api/company-informations'); // Replace with your actual API
        const data = await res.json();
        setCompanyInfo(data);
      } catch {
        showAlert({ type: "error", message: t('settings.partners.error.fetchCompanyInfo') });
      }
    };

    fetchCompanyInfo();
  }, [t]);

  useEffect(() => {
    api
      .get('/api/countries')
      .then((res) => {
        setCountries(res.data);
      })
      .catch(() => showAlert({ type: "error", message: t('settings.partners.error.fetchCountries') }));
  }, [t]);

  const getCountryById = useCallback((countryId: number) => countries.find((c) => c.id === countryId), [countries]);

  useEffect(() => {
    if (!id || countries.length === 0) return;
    const fetchPartner = async () => {
      try {
        const response = await api.get(`/api/partners/${id}`);
        // setPartner(response.data);

        const rawCountryId = response.data.data.partner_overview?.hq_country;
        const countryId = rawCountryId ? parseInt(rawCountryId, 10) : null;
        const country = countryId ? getCountryById(countryId) : null;

        setCompanyInfo((prev) => ({
          ...prev,
          company_title: response.data.data.partner_overview?.reg_name || '',
          rating: response.data.data.partner_overview?.rating || '',
          company_type: response.data.data.partner_overview?.company_type || '',
          origin_country: country?.name || '',
          origin_country_flag_svg: country?.svg_icon_url || '',
          status:
            Number(response.data.data.partnership_structure?.status) === 1 ? t('settings.partners.active') : t('settings.partners.inactive'),
          partner_id: response.data.data.partner_id || '',
          updated_at: response.data.data.updated_at || '',
          image_url: response.data.data.partner_image || '',
        }));
      } catch {
        showAlert({ type: "error", message: t('settings.partners.error.fetchPartner') });
      }
    };

    if (id) {
      fetchPartner();
    }
  }, [id, countries, getCountryById]);


  const onFetchFilesCallback = useCallback(async () => {

    try {
      const response = await api.get<{ data: ApiFile[] }>('/api/files', {
        params: {
          folder_id: selectedFolderIdInParent || undefined,
        },
      });

      const apiFiles = response.data.data || [];
      const fetchedFiles = apiFiles.map(mapApiFileToFile);
      setFiles(fetchedFiles);
      return fetchedFiles;
    } catch (error: unknown) {
      showAlert({ type: "error", message: t('settings.partners.error.fetchFiles') });
      setFiles([]);
      throw error;
    }
  }, [selectedFolderIdInParent, t]);

  const fetchFoldersApi = async (): Promise<Folder[]> => {


    try {
      const response = await api.get(`/api/partners/${id}/folders`);

      const responseData = response.data;

      if (!responseData.success || !Array.isArray(responseData.data)) {
        const apiErrorMessage =
          responseData.message || 'API returned success: false or data is not an array';
        showAlert({ type: "error", message: t('settings.partners.error.fetchFolders') });

        throw new Error(apiErrorMessage);
      }



      return responseData.data as Folder[];
    } catch (error: unknown) {
      showAlert({ type: "error", message: "Error during API call to fetch folders" });

      let userMessage = 'Failed to load folders. Please try again.';

      if (axios.isAxiosError(error) && error.response) {
        const serverError = error.response.data;
        if (serverError.message) {
          userMessage = serverError.message;
        } else if (serverError.errors) {
          userMessage = 'Server responded with errors: ' + JSON.stringify(serverError.errors);
        } else {
          userMessage = `Server error: ${error.response.status}`;
        }
        showAlert({ type: "error", message: "Server error occurred" });
      } else if (error instanceof Error) {
        userMessage = `Request failed: ${error.message}`;
      }

      throw new Error(userMessage);
    }
  };

  const createFolderApi = async (name: string): Promise<Folder> => {

    try {
      const partnerId = localStorage.getItem('partner_id');
      const response = await api.post('/api/folders', {
        name: name,
        partner_id: partnerId,
      });

      const responseData = response.data;

      if (!responseData.success || !responseData.data) {
        const apiErrorMessage = responseData.message || 'API returned success: false';
        showAlert({ type: "error", message: "API indicated failure creating folder" });

        throw new Error(apiErrorMessage);
      }



      return responseData.data as Folder;
    } catch (error: unknown) {
      showAlert({ type: "error", message: "Error during API call to create folder" });

      let userMessage = 'Failed to create folder. Please try again.';

      if (axios.isAxiosError(error) && error.response) {
        const serverError = error.response.data;
        if (serverError.message) {
          userMessage = serverError.message;
        } else if (serverError.errors) {
          userMessage = 'Validation failed: ' + JSON.stringify(serverError.errors);
        } else {
          userMessage = `Server error: ${error.response.status}`;
        }
        showAlert({ type: "error", message: "Server error occurred" });
      } else if (error instanceof Error) {
        userMessage = `Request failed: ${error.message}`;
      }

      throw new Error(userMessage);
    }
  };

  const renameFolderApi = async (id: string, newName: string): Promise<Folder> => {

    try {
      const response = await api.put(`/api/folders/${id}`, { name: newName });

      const responseData = response.data;

      if (!responseData.success || !responseData.data) {
        const apiErrorMessage = responseData.message || 'API returned failure renaming folder';
        showAlert({ type: "error", message: "API indicated failure renaming folder" });
        throw new Error(apiErrorMessage);
      }



      return responseData.data as Folder;
    } catch (error: unknown) {
      showAlert({ type: "error", message: "Error during API call to rename folder" });

      let userMessage = 'Failed to rename folder. Please try again.';

      if (axios.isAxiosError(error) && error.response) {
        const serverError = error.response.data;
        if (serverError.message) {
          userMessage = serverError.message;
        } else if (serverError.errors) {
          userMessage = 'Validation failed: ' + JSON.stringify(serverError.errors);
        } else {
          userMessage = `Server error: ${error.response.status}`;
        }
        showAlert({ type: "error", message: "Server error occurred" });
      } else if (error instanceof Error) {
        userMessage = `Request failed: ${error.message}`;
      }

      throw new Error(userMessage);
    }
  };

  const deleteFolderApi = async (id: string): Promise<void> => {

    try {
      const response = await api.delete(`/api/folders/${id}`);

      const responseData = response.data;

      if (!responseData.success) {
        const apiErrorMessage = responseData.message || 'API returned failure deleting folder';
        showAlert({ type: "error", message: "API indicated failure deleting folder" });
        throw new Error(apiErrorMessage);
      }


      return;
    } catch (error: unknown) {
      showAlert({ type: "error", message: "Error during API call to delete folder" });

      let userMessage = 'Failed to delete folder. Please try again.';

      if (axios.isAxiosError(error) && error.response) {
        const serverError = error.response.data;
        if (serverError.message) {
          userMessage = serverError.message;
        } else if (serverError.errors) {
          userMessage = 'Server responded with errors: ' + JSON.stringify(serverError.errors);
        } else {
          userMessage = `Server error: ${error.response.status}`;
        }
        showAlert({ type: "error", message: "Server error occurred" });
      } else if (error instanceof Error) {
        userMessage = `Request failed: ${error.message}`;
      }

      throw new Error(userMessage);
    }
  };

  const handleFolderSelected = (folderId: string | null) => {
    setSelectedFolderIdInParent(folderId);
    onFetchFilesCallback();
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFileId((prevSelectedId) => (prevSelectedId === fileId ? null : fileId));
  };


  const filesForView = files.map((file) => ({
    ...file,
    isSelected: file.id === selectedFileId,
  }));

  const handleDownloadFile = async (file: AttachmentFile) => {
    const fileId = file.id;

    try {
      const response = await api.get(`/api/files/${fileId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      link.setAttribute('download', file.name || 'downloaded_file');

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showAlert({ type: "error", message: "Failed to download file" });
    }
  };

  if (!paramId && !localStorage.getItem('seller_id')) {
    return (
      <div className="p-8 text-red-600 font-semibold flex justify-center items-center h-[200px]">
        {t('settings.partners.error.noSellerId')}
      </div>
    );
  }

  return (
    <div className="ml-3 font-poppins pdf-container">
      <div className=" flex w-full mt-[30px]">
        <div className="w-[1019px] h-[180px]">
          <div className="flex justify-start items-center flex-row gap-[22px] w-[1019px]">
            {companyInfo?.image_url ? (
              <img
                className="rounded-[180px] w-[180px] h-[180px]"
                src={`${import.meta.env.VITE_API_BASE_URL}${companyInfo.image_url}`}
                style={{ objectFit: 'cover', width: '180px' }}
                alt="Buyer"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="145"
                height="145"
                viewBox="0 0 145 145"
                fill="none"
              >
                <rect x="1" y="1" width="143" height="143" rx="71.5" fill="#F1FBFF" />
                <rect
                  x="1"
                  y="1"
                  width="143"
                  height="143"
                  rx="71.5"
                  stroke="#064771"
                  strokeWidth="2"
                />
                <path
                  d="M99.7904 71.1303L107.763 65.2264L100.872 42L65.3978 43.1369L61.9803 48.4439L49.8312 45.5217L37 72.012L42.8447 77.0426L39.7588 81.8182C38.7841 83.3266 38.4552 85.1242 38.8327 86.88C39.21 88.6358 40.2486 90.1394 41.7569 91.1141C42.8575 91.8253 44.1123 92.1926 45.3924 92.1926C45.7293 92.1926 46.0678 92.166 46.4059 92.1145C46.8339 93.6367 47.7945 95.0153 49.2237 95.9388C50.349 96.6661 51.6122 97.0133 52.8618 97.0133C53.1993 97.0133 53.5353 96.9848 53.8677 96.9349C54.3097 98.516 55.2995 99.8649 56.6903 100.764C57.8158 101.491 59.0789 101.838 60.3284 101.838C62.536 101.838 64.7012 100.754 65.9859 98.7656L66.9028 97.3465L72.2726 100.906L72.295 100.921C73.3956 101.632 74.6504 102 75.9305 102C76.4045 102 76.8823 101.95 77.3568 101.848C79.1126 101.47 80.6162 100.432 81.5909 98.9235C82.2768 97.8619 82.6241 96.6777 82.6613 95.4979C83.0053 95.4777 83.3503 95.4319 83.6937 95.3581C85.4495 94.9806 86.9531 93.942 87.9278 92.4338C88.6002 91.3934 88.9649 90.215 89.0026 89.008C89.3453 88.9877 89.6886 88.9419 90.0304 88.8684C91.7863 88.491 93.2899 87.4526 94.2646 85.9442C94.9512 84.8816 95.2985 83.6959 95.335 82.5151C97.4044 82.395 99.3925 81.3252 100.601 79.4545C101.576 77.9461 101.905 76.1486 101.527 74.3928C101.259 73.1439 100.656 72.0227 99.7904 71.1303ZM67.934 47.6145L97.5035 46.6669L102.487 63.4634L95.8589 68.3716L70.512 51.868L63.3171 62.7881L63.306 62.8051C62.6572 63.8085 61.3136 64.0972 60.3102 63.4492C59.3068 62.8008 59.0179 61.4569 59.6682 60.4504L67.934 47.6145ZM47.2256 86.6431C46.5768 87.6466 45.2329 87.9354 44.2299 87.2872C43.7438 86.973 43.4091 86.4884 43.2874 85.9226C43.1659 85.3568 43.2718 84.7776 43.5861 84.2915L48.143 77.239C48.5572 76.5982 49.2546 76.2489 49.9663 76.2489C50.3689 76.2489 50.7762 76.3609 51.1388 76.5951C51.6249 76.9093 51.9595 77.3937 52.0812 77.9595C52.2028 78.5254 52.0968 79.1047 51.7828 79.5908L47.2256 86.6431ZM54.6924 91.4679C54.0436 92.4713 52.6998 92.7599 51.6965 92.1118C50.6931 91.4634 50.4043 90.1195 51.0527 89.1161L55.6098 82.0637C56.024 81.4228 56.7214 81.0735 57.4331 81.0735C57.8357 81.0735 58.243 81.1855 58.6056 81.4199C59.609 82.0682 59.8979 83.4122 59.2495 84.4156L54.6924 91.4679ZM66.7159 89.2402L62.1589 96.2926C61.5105 97.2963 60.1666 97.5848 59.1633 96.9365C58.6772 96.6224 58.3425 96.1378 58.221 95.572C58.0994 95.0062 58.2052 94.4269 58.5194 93.9407L63.0764 86.8883C63.3906 86.4022 63.875 86.0676 64.4408 85.946C64.5938 85.9132 64.7477 85.8969 64.9002 85.8969C65.3128 85.8969 65.7172 86.0154 66.0719 86.2446C67.0754 86.893 67.3642 88.2368 66.7159 89.2402ZM96.774 76.9811C96.4599 77.4672 95.9754 77.8018 95.4096 77.9235C94.8438 78.0452 94.2644 77.9391 93.7785 77.6251L92.2666 76.6482L92.2665 76.6481L85.2139 72.091L82.741 75.918L84.2531 76.8952L89.7936 80.4754C90.2797 80.7895 90.6143 81.2739 90.7359 81.8398C90.8575 82.4056 90.7515 82.985 90.4375 83.4711C90.1235 83.9571 89.6388 84.2919 89.0731 84.4135C88.5072 84.535 87.9281 84.4291 87.4418 84.1151L80.3894 79.5581L77.9166 83.3851L83.457 86.965C84.4604 87.6133 84.7492 88.9572 84.1009 89.9607C83.7867 90.4468 83.3022 90.7815 82.7365 90.9031C82.1705 91.0246 81.5914 90.9188 81.1053 90.6047L75.0852 86.7148L72.6123 90.5419L77.1203 93.4548C78.1237 94.1034 78.4127 95.4471 77.7643 96.4506C77.4501 96.9367 76.9657 97.2714 76.3998 97.3931C75.8376 97.5139 75.2621 97.4099 74.778 97.1005L69.3766 93.5196L70.5435 91.7135C72.5554 88.5997 71.6591 84.4295 68.5454 82.4178C67.1151 81.4936 65.4621 81.1847 63.8975 81.4207C63.4699 79.8972 62.5091 78.5172 61.0789 77.593C59.6495 76.6695 57.9979 76.3603 56.4344 76.5955C55.9922 75.015 55.0025 73.6666 53.6121 72.7682C51.0386 71.105 47.744 71.4309 45.5419 73.352L42.629 70.8449L52.3334 50.8103L59.3679 52.5021L55.8398 57.9806C53.8279 61.0944 54.7241 65.2644 57.8379 67.2763C60.9484 69.2865 65.1135 68.3935 67.1279 65.2872L71.8241 58.1595L96.1311 73.9856C96.617 74.2997 96.9518 74.7842 97.0734 75.35C97.1942 75.9157 97.0882 76.4949 96.774 76.9811Z"
                  fill="#064771"
                />
              </svg>
            )}

            <div className="flex justify-start items-start flex-col gap-[13px] w-[520px]">
              <div className="flex self-stretch justify-start items-center flex-row gap-[19px]">
                <p className="text-[rgba(0,0,0,0.88)] text-2xl font-semibold leading-8">
                  {companyInfo?.company_title || t('common.na')}
                </p>
                <div className="flex justify-center items-center flex-row gap-2 py-1 px-2 bg-[#0C5577] rounded-[36px]">
                  <svg
                    width="8"
                    height="9"
                    viewBox="0 0 8 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="4" cy="4.5" r="4" fill="white" />
                  </svg>
                  <span className="text-[#FFFFFF] text-xs font-medium leading-[1.4]">
                    {companyInfo?.status || t('common.na')}
                  </span>
                </div>
              </div>

              <div className="flex justify-start items-start flex-col gap-4 w-[344px]">
                <div className="flex justify-start items-center flex-row gap-[17px]">
                  <div className="text-[#727272] text-sm font-medium leading-5">
                    {t('settings.partners.hqOrigin')}
                  </div>
                  <div className="flex justify-start items-center flex-row gap-[8.67px]">
                    {companyInfo?.origin_country_flag_svg ? (
                      <img
                        src={companyInfo.origin_country_flag_svg}
                        alt="flag"
                        className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center"
                      />
                    ) : (
                      <span className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center">
                        {t('common.na')}
                      </span>
                    )}
                    <span className="text-[#30313D] text-sm font-semibold leading-[31.78px]">
                      {companyInfo?.origin_country || t('common.na')}
                    </span>
                  </div>
                </div>

                <div className="flex self-stretch justify-start items-center flex-row gap-[49px]">
                  <div className="text-[#727272] text-sm font-medium leading-5">{t('settings.partners.companyType')}</div>
                  <span className="text-[#30313D] text-sm font-semibold leading-5">
                    {companyInfo?.company_type || t('common.na')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-end flex-col h-[40px] mt-[80px] mr-[50px]">
          <span className="text-[#838383] text-sm font-medium leading-[18.86px]">{t('settings.partners.partnerID')}</span>
          <div className="flex justify-start items-end flex-row gap-2.5 w-[89px]">
            <span className="text-[#064771] text-sm font-semibold leading-[15px] text-nowrap mt-[-20px] ml-auto text-right block">
              {companyInfo?.partner_id || t('common.na')}
            </span>
          </div>
        </div>

        <div className="mt-[80px] mr-[52px] ml-[-30px]">
          <svg
            width="2"
            height="44"
            viewBox="0 0 2 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1 1V43" stroke="#94989C" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="h-[180px] w-[245px] ml-[12px] text-nowrap">
          <div
            className="flex justify-center items-center flex-row gap-[4px]  pr-2 bg-[#064771] rounded-[5px] w-[245px] h-[180px]"
            style={{ width: '245px' }}
          >
            <div className="flex justify-between items-center flex-col gap-1.5 h-[158px]">
              <div className="flex justify-start items-end flex-col gap-[29px] h-[158px]">
                <div
                  className="flex justify-center items-end flex-col gap-1.5 w-[202px]"
                  style={{ width: '202px' }}
                >
                  <div className="flex self-stretch justify-between items-center flex-row gap-[107px]">
                    <div className="flex justify-start items-end flex-row gap-[7.1049323081970215px] h-[24px]">
                      <button
                        onClick={() => handleCopyLinkExample(id || '')}
                        className="flex items-center gap-1 py-1 px-2 bg-[#F1FBFF] border border-[#064771] rounded-full w-[57px] h-6"
                      >
                        <svg
                          width="15"
                          height="16"
                          viewBox="0 0 15 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5.50127 7.99966C5.50127 9.09163 4.61605 9.97686 3.52407 9.97686C2.4321 9.97686 1.54688 9.09163 1.54688 7.99966C1.54688 6.90769 2.4321 6.02246 3.52407 6.02246C4.61605 6.02246 5.50127 6.90769 5.50127 7.99966Z"
                            stroke="#064771"
                            strokeWidth="1.2"
                          />
                          <path
                            d="M9.4544 3.6499L5.5 6.41798"
                            stroke="#064771"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M9.4544 12.3511L5.5 9.58301"
                            stroke="#064771"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M13.4114 13.1403C13.4114 14.2323 12.5262 15.1175 11.4342 15.1175C10.3423 15.1175 9.45703 14.2323 9.45703 13.1403C9.45703 12.0483 10.3423 11.1631 11.4342 11.1631C12.5262 11.1631 13.4114 12.0483 13.4114 13.1403Z"
                            stroke="#064771"
                            strokeWidth="1.2"
                          />
                          <path
                            d="M13.4114 2.85952C13.4114 3.9515 12.5262 4.83672 11.4342 4.83672C10.3423 4.83672 9.45703 3.9515 9.45703 2.85952C9.45703 1.76755 10.3423 0.882324 11.4342 0.882324C12.5262 0.882324 13.4114 1.76755 13.4114 2.85952Z"
                            stroke="#064771"
                            strokeWidth="1.2"
                          />
                        </svg>
                        <span className="text-[#064771] text-[12px] text-nowrap hover:underline">Share</span>
                      </button>
                    </div>
                    <span className="text-[#FFFFFF] leading-[12.788783073425293px] ml-[-26px]">
                      Partner ID
                    </span>
                  </div>
                </div>
                <div className="flex justify-start items-end flex-col gap-[33px] h-[105px] mt-[-10px]">
                  <div className="flex justify-start items-end flex-col gap-3">
                    <div
                      className="flex justify-start items-center flex-row gap-[10.231026649475098px] w-[179px]"
                      style={{ width: '179px' }}
                    >
                      <svg
                        width="25"
                        height="27"
                        viewBox="0 0 25 27"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M1.54886 0C0.945866 0 0.457031 0.549475 0.457031 1.22727C0.457031 1.90507 0.945866 2.45455 1.54886 2.45455H2.88005L6.77158 19.9517C5.62441 20.5244 4.82436 21.8162 4.82436 23.3182C4.82436 25.3517 6.29085 27 8.09985 27C9.90885 27 11.3753 25.3517 11.3753 23.3182C11.3753 22.8879 11.3096 22.4748 11.189 22.0909H15.929C15.8084 22.4748 15.7427 22.8879 15.7427 23.3182C15.7427 25.3517 17.2091 27 19.0182 27C20.8272 27 22.2937 25.3517 22.2937 23.3182C22.2937 21.2847 20.8272 19.6364 19.0182 19.6364H8.95233L8.40642 17.1818H19.0182C21.2719 17.1818 22.6233 15.5813 23.3732 13.8141C24.106 12.087 24.361 10.023 24.45 8.52179C24.5738 6.43108 23.0364 4.90909 21.3341 4.90909H5.67684L4.99852 1.85923C4.75549 0.766542 3.88206 0 2.88005 0H1.54886ZM19.0182 14.7273H7.8605L6.22275 7.36364H21.3341C21.9379 7.36364 22.3005 7.86283 22.2712 8.35868C22.1882 9.75952 21.9558 11.4527 21.4023 12.7574C20.8658 14.0217 20.1319 14.7273 19.0182 14.7273ZM19.0182 24.5378C18.4189 24.5378 17.9331 23.9918 17.9331 23.3182C17.9331 22.6445 18.4189 22.0985 19.0182 22.0985C19.6175 22.0985 20.1032 22.6445 20.1032 23.3182C20.1032 23.9918 19.6175 24.5378 19.0182 24.5378ZM7.01476 23.3182C7.01476 23.9918 7.50057 24.5378 8.09985 24.5378C8.69914 24.5378 9.18495 23.9918 9.18495 23.3182C9.18495 22.6445 8.69914 22.0985 8.09985 22.0985C7.50057 22.0985 7.01476 22.6445 7.01476 23.3182Z"
                          fill="#F9F8FA"
                        />
                      </svg>
                      <p className="text-[#FFFFFF] text-[28.646873474121094px] font-semibold leading-[30.69308090209961px]">
                        {companyInfo?.partner_id || t('common.na')}
                      </p>
                    </div>
                    <div className="flex justify-start items-start flex-row gap-1.5">
                      <span className="text-[#AFAFAF] text-sm leading-[18.860000610351562px]">
                        {t('settings.partners.lastRelease')}
                      </span>
                      <span className="text-[#FFFFFF] text-sm font-medium leading-[10px] mt-[5px]">
                        {companyInfo?.updated_at
                          ? new Date(companyInfo.updated_at).toLocaleDateString('en-GB', {
                            month: 'short',
                            year: 'numeric',
                            day: '2-digit',
                          })
                          : t('common.na')}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex justify-start items-center flex-row gap-1.5 w-[202px] h-[23px]"
                    style={{ width: '202px' }}
                  >
                    <button
                      onClick={handleDownloadPDF}
                      className="flex justify-center items-center flex-row gap-[3.044971227645874px] py-[3.5524661540985107px] px-[5.647058963775635px] bg-[#F1FBFF] border-solid border-[#064771] border-[0.3529411852359772px] rounded-[35.16731643676758px] w-[114px] h-[24px]"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.6272 10.8206C12.5558 8.89194 12.5558 5.76138 10.6272 3.83272C8.6985 1.90407 5.56793 1.90407 3.63928 3.83272C1.71062 5.76138 1.71062 8.89194 3.63928 10.8206"
                          stroke="#064771"
                          strokeWidth="0.988235"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7.13499 8.02268L7.13497 13.7527"
                          stroke="#064771"
                          strokeWidth="0.988235"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5.44517 12.6265L7.13274 14.314L8.82031 12.6265"
                          stroke="#064771"
                          strokeWidth="0.988235"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-[#064771] text-[12px] text-nowrap">{t('common.downloadPdf')}</span>
                    </button>
                    <button
                      className="flex justify-center items-center flex-row gap-[3.044971227645874px] py-[3.5524661540985107px] px-[5.647058963775635px] bg-[#FFFFFF] rounded-[35.16731643676758px] w-[82px] h-[24px]"
                      style={{ width: '82px' }}
                      onClick={() => navigate(`/partner-portal/edit/${id}`)}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.2437 5.87325C2.58773 3.53533 4.76188 1.91897 7.0998 2.263C7.89745 2.38037 8.6457 2.72072 9.25836 3.24484L8.70684 3.79637C8.52198 3.98127 8.52203 4.28103 8.70695 4.46588C8.79569 4.55461 8.91606 4.60447 9.04155 4.60449H11.2127C11.4741 4.60449 11.6861 4.39254 11.6861 4.13108V1.95998C11.686 1.69852 11.474 1.48661 11.2125 1.48665C11.0871 1.48668 10.9667 1.53654 10.8779 1.62526L10.2625 2.2407C7.91549 0.148595 4.31689 0.355198 2.22479 2.70217C1.48362 3.53362 1.00264 4.56424 0.841439 5.66636C0.777882 6.05708 1.04309 6.42535 1.4338 6.48891C1.46899 6.49463 1.50454 6.49772 1.5402 6.49816C1.89767 6.4943 2.19772 6.22776 2.2437 5.87325Z"
                          fill="#064771"
                        />
                        <path
                          d="M11.4193 6.50146C11.0618 6.50533 10.7617 6.77187 10.7158 7.12638C10.3717 9.4643 8.19759 11.0807 5.85967 10.7366C5.06202 10.6193 4.31376 10.2789 3.7011 9.75481L4.25262 9.20328C4.43748 9.01838 4.43744 8.71862 4.25251 8.53376C4.16377 8.44504 4.0434 8.39518 3.91791 8.39515H1.74685C1.48539 8.39515 1.27344 8.60711 1.27344 8.86857V11.0397C1.2735 11.3011 1.4855 11.513 1.74696 11.513C1.87245 11.513 1.99282 11.4631 2.08156 11.3744L2.697 10.7589C5.04342 12.8513 8.64175 12.6453 10.7341 10.2989C11.4757 9.46725 11.9569 8.43628 12.118 7.33376C12.1818 6.94308 11.9169 6.57463 11.5262 6.51081C11.4908 6.50502 11.4551 6.50189 11.4193 6.50146Z"
                          fill="#064771"
                        />
                      </svg>
                      <span className="text-[#064771] text-[12px] text-nowrap">{t('common.update')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FileManager
        fetchFolders={fetchFoldersApi}
        createFolder={createFolderApi}
        renameFolder={renameFolderApi}
        deleteFolder={deleteFolderApi}
        onFolderSelect={handleFolderSelected}
      />

      <FileView
        files={filesForView}
        onFetchFiles={onFetchFilesCallback}
        onFileSelect={handleFileSelect}
        onDownloadFile={handleDownloadFile}
      />

      <div className="ml-7 mt-[110px]">
        <div className="flex justify-between items-center flex-row gap-[916px] mt-15 ml-">
          <div
            className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[93px] h-[34px]"
            style={{ width: '93px' }}
          ></div>

          <div className="flex justify-start items-center flex-row gap-4 mx-auto w-fit ml-[-350px]">
            <button className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#064771] rounded-[49.82036209106445px] h-[34px] ">
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

              <span className="text-[#FFF] ">{t('common.back')}</span>
            </button>

            <div className="flex justify-start items-end flex-row gap-[10.06532096862793px] h-[34px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attachments;
