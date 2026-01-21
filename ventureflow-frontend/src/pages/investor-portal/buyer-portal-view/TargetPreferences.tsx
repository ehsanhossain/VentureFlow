import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../config/api';
import { useNavigate } from 'react-router-dom';
import { useTabStore } from './store/tabStore';
import { showAlert } from '../../../components/Alert';
import html2pdf from 'html2pdf.js';

const TargetPreferences: React.FC = () => {
  const handleDownloadPDF = async () => {
    const element = document.querySelector('.pdf-container');
    if (!element) {
      showAlert({ type: "error", message: "No element with class .pdf-container found" });
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

  const { id: paramId } = useParams();
  const id = paramId || localStorage.getItem('seller_id');



  const baseURL = import.meta.env.VITE_APP_URL;

  const handleCopyLinkExample = () => {
    const fullUrl = `${baseURL}/prospects/investor/${id}`;


    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        showAlert({
          type: 'success',
          message: 'Link copied to clipboard',
        });

      })
      .catch(() => {
        showAlert({ type: "error", message: "Failed to copy" });
      });
  };

  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfo] = useState<{
    company_title: string;
    origin_country_flag_svg: string;
    rating: string;
    company_type: string;
    status: string;
    origin_country: string;
    broder_industry_operations: any;
    year_founded: string;
    full_time_employee_counts: string;
    niche_industry_preferences: any[];
    buyer_id: string;
    updated_at: string;
    image_url: string;
  }>({
    company_title: '',
    origin_country_flag_svg: '',
    rating: '',
    company_type: '',
    status: '',
    origin_country: '',
    broder_industry_operations: '',
    year_founded: '',
    full_time_employee_counts: '',
    niche_industry_preferences: [],
    buyer_id: '',
    updated_at: '',
    image_url: '',
  });

  type TargetPreference = {
    operational_countries_or_customer_base: string;
    full_time_employee_counts: string;
    preferred_company_type: string;
    target_countries: any[];
    certifications: string[];
    main_market: string;
    timeline_expectations: string;
    cert: string[];
  };

  const [targetPreference, setTargetPreference] = useState<TargetPreference | null>(null);

  useEffect(() => {
    const fetchTargetPreference = async () => {
      try {
        const response = await api.get(`/api/buyer/${id}`);
        const overview = response.data.data.company_overview || {};
        const target = response.data.data.target_preference || {};

        setCompanyInfo({
          company_title: overview.reg_name || '',
          origin_country_flag_svg: overview.origin_country_flag_svg || '',
          rating: overview.rating || '',
          company_type: overview.company_type || '',
          status: overview.status || '',
          broder_industry_operations: overview.main_industry_operations || '',
          origin_country: overview.hq_country || '',
          niche_industry_preferences: overview.niche_industry || [],
          year_founded: overview.year_founded || '',
          full_time_employee_counts: overview.emp_count || '',

          buyer_id: response.data.data.buyer_id || '',
          updated_at: response.data.data.updated_at || '',
          image_url: response.data.data.image || '',
        });

        setTargetPreference({
          operational_countries_or_customer_base: target.main_market || '',
          full_time_employee_counts: target.emp_count_range || '',
          preferred_company_type: target.company_type || '',
          target_countries: target.target_countries || '',
          certifications: target.cert || [],
          main_market: target.main_market || '',
          timeline_expectations: target.timeline || '',
          cert: target.cert || [],
        });
      } catch {
        showAlert({ type: "error", message: "Error fetching data" });
      }
    };

    if (id) {
      fetchTargetPreference();
    }
  }, [id]);

  const [countries, setCountries] = useState<any[]>([]);
  useEffect(() => {
    api
      .get('/api/countries')
      .then((res) => {
        setCountries(res.data);
      })
      .catch(() => showAlert({ type: "error", message: "Failed to fetch countries" }));
  }, []);

  const getCountryById = (id: number) => countries.find((c: { id: number }) => c.id === id);

  const countryData = getCountryById(parseInt(companyInfo.origin_country || '0'));
  const MainMarketcountryData = getCountryById(parseInt(targetPreference?.main_market || '0'));

  if (!paramId && !localStorage.getItem('seller_id')) {
    return (
      <div className="p-8 text-red-600 font-semibold flex justify-center items-center h-[200px]">
        Error: No seller ID found. Please complete company overview.
      </div>
    );
  }

  return (
    <div className="ml-3 font-poppins pdf-container">
      <div className=" flex w-[1316px] mt-[30px] ">
        <div className=" w-[1019px] h-[180px] ">
          <div className="flex justify-start items-center flex-row gap-[22px] w-[1019px]">
            {companyInfo?.image_url ? (
              <img
                className="rounded-[180px] w-[180px] h-[180px]"
                src={`${import.meta.env.VITE_API_BASE_URL}/storage/${companyInfo.image_url}`}
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
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M45.7273 42.5C44.2211 42.5 43 43.7211 43 45.2273C43 46.7335 44.2211 47.9545 45.7273 47.9545H49.0524L58.773 86.837C55.9075 88.1098 53.9091 90.9805 53.9091 94.3182C53.9091 98.837 57.5722 102.5 62.0909 102.5C66.6096 102.5 70.2727 98.837 70.2727 94.3182C70.2727 93.362 70.1085 92.444 69.8072 91.5909H81.6474C81.346 92.444 81.1818 93.362 81.1818 94.3182C81.1818 98.837 84.8448 102.5 89.3636 102.5C93.8825 102.5 97.5455 98.837 97.5455 94.3182C97.5455 89.7994 93.8825 86.1364 89.3636 86.1364H64.2203L62.8567 80.6818H89.3636C94.9933 80.6818 98.3688 77.1252 100.242 73.1979C102.072 69.3601 102.71 64.7734 102.932 61.4373C103.241 56.7913 99.4008 53.4091 95.1485 53.4091H56.0385L54.3441 46.6316C53.7371 44.2034 51.5553 42.5 49.0524 42.5H45.7273ZM89.3636 75.2273H61.493L57.4021 58.8636H95.1485C96.6569 58.8636 97.5626 59.973 97.4893 61.0749C97.282 64.1878 96.7016 67.9504 95.3189 70.8497C93.9787 73.6594 92.1457 75.2273 89.3636 75.2273ZM89.3636 97.0285C87.8666 97.0285 86.6533 95.8152 86.6533 94.3182C86.6533 92.8212 87.8666 91.6078 89.3636 91.6078C90.8606 91.6078 92.074 92.8212 92.074 94.3182C92.074 95.8152 90.8606 97.0285 89.3636 97.0285ZM59.3805 94.3182C59.3805 95.8152 60.594 97.0285 62.0909 97.0285C63.5879 97.0285 64.8014 95.8152 64.8014 94.3182C64.8014 92.8212 63.5879 91.6078 62.0909 91.6078C60.594 91.6078 59.3805 92.8212 59.3805 94.3182Z"
                  fill="#064771"
                />
              </svg>
            )}

            <div className="flex justify-start items-start flex-col gap-[13px] w-[520px]">
              <div className="flex self-stretch justify-start items-center flex-row gap-[19px]">
                <p className="text-[rgba(0,0,0,0.88)] text-2xl font-semibold leading-8">
                  {companyInfo?.company_title || 'N/A'}
                </p>
                <div className="flex justify-center items-center flex-row gap-2 py-1 px-2 bg-[#0C5577] rounded-[36px]">
                  <svg
                    width="8"
                    height="9"
                    viewBox="0 0 8 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 4.5C8 6.70914 6.20914 8.5 4 8.5C1.79086 8.5 0 6.70914 0 4.5C0 2.29086 1.79086 0.5 4 0.5C6.20914 0.5 8 2.29086 8 4.5Z"
                      fill="white"
                    />
                  </svg>
                  <span className="text-[#FFFFFF] text-xs font-medium leading-[1.4]">
                    {companyInfo?.status || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex justify-start items-start flex-col gap-4 w-[344px]">
                <div className="flex justify-start items-center flex-row gap-[17px]">
                  <div className="text-[#727272] text-sm font-medium leading-5">
                    HQ / Origin Country
                  </div>
                  <div className="flex justify-start items-center flex-row gap-[8.67px]">
                    {countryData?.svg_icon_url || countryData?.flagSrc ? (
                      <img
                        src={countryData?.svg_icon_url || countryData?.flagSrc}
                        alt="flag"
                        className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center"
                      />
                    ) : (
                      <span className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center">
                        n/a
                      </span>
                    )}
                    <span className="text-[#30313D] text-sm font-semibold leading-[31.78px]">
                      {countryData?.name || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex self-stretch justify-start items-center flex-row gap-[49px]">
                  <div className="text-[#727272] text-sm font-medium leading-5">Company Type</div>
                  <span className="text-[#30313D] text-sm font-semibold leading-5">
                    {companyInfo?.company_type || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex justify-between items-end flex-col w-[132px] h-[40px] mt-[80px] mr-[50px] ml-[-100px]"
          style={{ width: '132px' }}
        >
          <span className="text-[#838383] text-sm font-medium leading-[18.860000610351562px]">
            Buyer ID
          </span>
          <div
            className="flex justify-start items-end flex-row gap-2.5 w-[89px]"
            style={{ width: '89px' }}
          >
            <span className="text-[#064771] text-sm font-semibold leading-[15px] text-nowrap mt-[-20px] ml-[30px]">
              {companyInfo?.buyer_id || 'N/A'}
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

        <div className=" h-[180px] w-[245px] ml-[12px] text-nowrap">
          <div
            className="flex justify-center items-center flex-row gap-[4px]  pr-4 bg-[#064771] rounded-[5px] w-[245px] h-[180px]"
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
                        type="button"
                        onClick={handleCopyLinkExample}
                        className="flex justify-center items-center flex-row gap-[3.044971227645874px] py-[3.5524661540985107px] px-[5.647058963775635px] bg-[#F1FBFF] border-solid border-[#064771] border-[0.3529411852359772px] rounded-[35.16731643676758px] w-[57px] h-[24px]"
                        style={{ width: '57px' }}
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
                        <span className="text-[#064771] text-[12px] text-nowrap hover:underline">
                          Share
                        </span>
                      </button>
                    </div>
                    <span className="text-[#FFFFFF] leading-[12.788783073425293px] ml-[-10px]">
                      Buyer ID
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
                        {companyInfo?.buyer_id || 'N/A'}
                      </p>
                    </div>
                    <div className="flex justify-start items-start flex-row gap-1.5">
                      <span className="text-[#AFAFAF] text-sm leading-[18.860000610351562px]">
                        Last Release
                      </span>
                      <span className="text-[#FFFFFF] text-sm font-medium leading-[10px] mt-[5px]">
                        {companyInfo?.updated_at
                          ? new Date(companyInfo.updated_at).toLocaleDateString('en-GB', {
                            month: 'short',
                            year: 'numeric',
                            day: '2-digit',
                          })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex justify-start items-center flex-row gap-1.5 w-[202px] h-[23px]"
                    style={{ width: '202px' }}
                  >
                    <div
                      className="flex justify-start items-end flex-row gap-[7.1049323081970215px] w-[114px] h-[24px]"
                      style={{ width: '114px' }}
                    >
                      <button
                        onClick={handleDownloadPDF}
                        className="flex justify-center items-center flex-row gap-[3.044971227645874px] py-[3.5524661540985107px] px-[5.647058963775635px] bg-[#F1FBFF] border-solid border-[#064771] border-[0.3529411852359772px] rounded-[35.16731643676758px] h-[24px]"
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

                        <span className="text-[#064771] text-[12px] text-nowrap">Download PDF</span>
                      </button>
                    </div>
                    <div className="flex justify-start items-end flex-row gap-[7.1049323081970215px] h-[24px]">
                      <div
                        className="flex justify-center items-center flex-row gap-[3.044971227645874px] py-[3.5524661540985107px] px-[5.647058963775635px] bg-[#FFFFFF] rounded-[35.16731643676758px] w-[82px] h-[24px]"
                        style={{ width: '82px' }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 13 13"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2.2437 5.87325C2.58773 3.53533 4.76188 1.91897 7.0998 2.263C7.89745 2.38037 8.6457 2.72072 9.25836 3.24484L8.70684 3.79637C8.52198 3.98127 8.52203 4.28103 8.70695 4.46588C8.79569 4.55461 8.91606 4.60447 9.04155 4.60449H11.2127C11.4741 4.60449 11.6861 4.39254 11.6861 4.13108V1.95998C11.686 1.69852 11.474 1.48661 11.2125 1.48665C11.0871 1.48668 10.9667 1.53654 10.8779 1.62526L10.2625 2.2407C7.91549 0.148595 4.31689 0.355198 2.22479 2.70217C1.48362 3.53362 1.00264 4.56424 0.841439 5.66636C0.777882 6.05708 1.04309 6.42535 1.43380 6.48891C1.46899 6.49463 1.50454 6.49772 1.54020 6.49816C1.89767 6.4943 2.19772 6.22776 2.24370 5.87325Z"
                            fill="#064771"
                          />
                          <path
                            d="M11.4193 6.50146C11.0618 6.50533 10.7617 6.77187 10.7158 7.12638C10.3717 9.4643 8.19759 11.0807 5.85967 10.7366C5.06202 10.6193 4.31376 10.2789 3.70110 9.75481L4.25262 9.20328C4.43748 9.01838 4.43744 8.71862 4.25251 8.53376C4.16377 8.44504 4.04340 8.39518 3.91791 8.39515H1.74685C1.48539 8.39515 1.27344 8.60711 1.27344 8.86857V11.0397C1.27350 11.3011 1.48550 11.513 1.74696 11.513C1.87245 11.513 1.99282 11.4631 2.08156 11.3744L2.69700 10.7589C5.04342 12.8513 8.64175 12.6453 10.7341 10.2989C11.4757 9.46725 11.9569 8.43628 12.1180 7.33376C12.1818 6.94308 11.9169 6.57463 11.5262 6.51081C11.4908 6.50502 11.4551 6.50189 11.4193 6.50146Z"
                            fill="#064771"
                          />
                        </svg>

                        <button
                          className="text-[#064771] text-[12px] text-nowrap"
                          onClick={() => {
                            navigate(`/prospects/edit-investor/${id}`);
                          }}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-12 ">
        <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins mb-[18px]">
          Primary Preference
        </p>
        <svg
          width="560"
          height="2"
          viewBox="0 0 560 2"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 1H560" stroke="#BCC2C5" />
        </svg>

        <div className="flex  w-[680px] h-[700px] mt-[25px] ">
          <div className=" w-[680px] ">
            <div className="flex self-stretch justify-start items-center flex-row gap-2.5 ">
              <p className="text-[#484848] leading-[19.29px] text-nowrap">
                Broader Industry Operations
              </p>

              <div className="w-[301px] ml-[135px]">
                <div className="flex flex-wrap gap-4">
                  {(() => {
                    let industries = companyInfo?.broder_industry_operations;

                    if (typeof industries === 'string' && industries.trim() !== '') {
                      try {
                        industries = JSON.parse(industries);
                      } catch {
                        industries = [];
                      }
                    }

                    if (!Array.isArray(industries)) {
                      industries = [];
                    }

                    return industries.map((industry: any) => (
                      <button
                        key={industry.id}
                        className="flex justify-center items-center gap-2.5 py-1.5 px-[7px] rounded-[49px] h-[32px] text-sm font-medium leading-4 whitespace-nowrap bg-white text-[#064771] border border-[#064771]"
                      >
                        {industry.name}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="flex justify-start items-center gap-2.5 mt-[30px] whitespace-nowrap">
              <p className="text-[#484848] leading-[19.29px]">
                Niche / Priority Industry Preferences
              </p>

              <div className="w-[301px] ml-[75px]">
                <div className="flex flex-wrap gap-4">
                  {(() => {
                    let niches = companyInfo?.niche_industry_preferences;

                    if (typeof niches === 'string') {
                      try {
                        niches = JSON.parse(niches);
                      } catch {
                        niches = [];
                      }
                    }

                    if (!Array.isArray(niches)) {
                      niches = [];
                    }

                    return niches.map((industry) => (
                      <button
                        key={industry.id}
                        className="flex justify-center items-center gap-2.5 py-1.5 px-[7px] rounded-[49px] h-[32px] text-sm font-medium leading-4 whitespace-nowrap bg-white text-[#064771] border border-[#064771]"
                      >
                        {industry.name}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="flex self-stretch justify-start items-center flex-row gap-2.5 mt-[40px]">
              <p className="text-[#484848] leading-[19.29px] text-nowrap">
                Buyer&apos;s Targeted Countries
              </p>
              <div className="ml-[150px] flex flex-wrap gap-2">
                {(() => {
                  let countries = targetPreference?.target_countries;

                  if (typeof countries === 'string' && (countries as string).trim() !== '') {
                    try {
                      countries = JSON.parse(countries);
                    } catch {
                      return <p className="text-[#30313D] font-medium">N/A</p>;
                    }
                  }

                  return Array.isArray(countries) && countries.length > 0 ? (
                    countries.map((country: any) => (
                      <div
                        key={country.id}
                        className="flex justify-start items-center flex-row gap-1 px-2 py-1 rounded-md bg-[#E6F1F9] w-fit"
                      >
                        <img
                          src={country.flagSrc || country.svg_icon_url}
                          alt={country.name}
                          className="w-[18px] h-[18px] object-contain"
                        />
                        <span className="text-[#064771] text-sm font-medium leading-4">
                          {country.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#30313D] font-medium">N/A</p>
                  );
                })()}
              </div>
            </div>

            <div className="grid gap-10 mt-[40px] bg-red">
              <div className="grid grid-cols-2 items-center">
                <p className="text-[#484848] leading-[19.29px]">Company Registered Name</p>
                <p className="text-[#30313D] font-medium leading-normal ml-[35px]">
                  {companyInfo?.company_title || 'N/A'}
                </p>
              </div>

              <div className="grid grid-cols-2 items-center">
                <p className="text-[#484848] leading-[19.29px] "> Year Founded</p>
                <p className="text-[#30313D] font-medium leading-normal ml-[35px]">
                  {companyInfo?.year_founded || 'N/A'}
                </p>
              </div>

              <div className="grid grid-cols-2 items-center">
                <p className="text-[#484848] leading-[19.29px]">
                  {' '}
                  Operational Countries/Customer Base
                </p>

                <div className="flex justify-start items-center flex-row gap-[8.67px] ml-[35px] ">
                  {MainMarketcountryData?.svg_icon_url || MainMarketcountryData?.flagSrc ? (
                    <img
                      src={MainMarketcountryData?.svg_icon_url || MainMarketcountryData?.flagSrc}
                      alt="flag"
                      className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center"
                    />
                  ) : (
                    <span className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center">
                      n/a
                    </span>
                  )}
                  <span className="text-[#30313D] text-sm font-semibold leading-[31.78px]">
                    {MainMarketcountryData?.name || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 items-center">
                <p className="text-[#484848] leading-[19.29px]">Full Time Employee Counts (FTE)</p>
                <p className="text-[#30313D] font-medium leading-normal ml-[35px]">
                  {targetPreference?.full_time_employee_counts || 'N/A'}
                </p>
              </div>
            </div>

            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins mb-[18px] mt-[100px] ">
              Additional Preference
            </p>
            <svg
              width="560"
              height="2"
              viewBox="0 0 560 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 1H560" stroke="#BCC2C5" />
            </svg>

            <div className="flex flex-col gap-6 w-full mt-[20px] ">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-[#484848] sm:min-w-[180px]">Timeline Expectations</p>
                <div className="flex items-center gap-2 ml-[150px]">
                  <svg
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.8897 6.63053C9.27323 6.63053 7.14355 8.70443 7.14355 11.2539C7.14355 13.7888 9.27323 15.8514 11.8897 15.8514C14.5062 15.8514 16.6359 13.7776 16.6359 11.2281C16.6359 8.6932 14.5062 6.63053 11.8897 6.63053ZM11.8897 14.5305C10.0204 14.5305 8.49961 13.0603 8.49961 11.2539C8.49961 9.43293 10.0204 7.95148 11.8897 7.95148C13.7591 7.95148 15.2799 9.42171 15.2799 11.2281C15.2799 13.049 13.7591 14.5305 11.8897 14.5305ZM13.0471 11.4216C13.3122 11.6799 13.3122 12.0973 13.0471 12.3555C12.9149 12.4843 12.7413 12.5491 12.5678 12.5491C12.3942 12.5491 12.2206 12.4843 12.0884 12.3555L11.4104 11.6951C11.2829 11.5709 11.2117 11.4031 11.2117 11.2281V9.90716C11.2117 9.54257 11.5148 9.24668 11.8897 9.24668C12.2647 9.24668 12.5678 9.54257 12.5678 9.90716V10.9547L13.0471 11.4216ZM16.6359 4.62334V5.94429C16.6359 6.30888 16.3329 6.60477 15.9579 6.60477C15.583 6.60477 15.2799 6.30888 15.2799 5.94429V4.62334C15.2799 3.53091 14.3673 2.64191 13.2458 2.64191H3.75342C2.63196 2.64191 1.71934 3.53091 1.71934 4.62334V5.28382H7.82158C8.19585 5.28382 8.49961 5.57971 8.49961 5.94429C8.49961 6.30888 8.19585 6.60477 7.82158 6.60477H1.71934V12.5491C1.71934 13.6415 2.63196 14.5305 3.75342 14.5305H6.46552C6.83979 14.5305 7.14355 14.8264 7.14355 15.191C7.14355 15.5556 6.83979 15.8514 6.46552 15.8514H3.75342C1.8841 15.8514 0.363281 14.37 0.363281 12.5491V4.62334C0.363281 2.8024 1.8841 1.32095 3.75342 1.32095H4.43144V0.660477C4.43144 0.295894 4.7352 0 5.10947 0C5.48374 0 5.7875 0.295894 5.7875 0.660477V1.32095H11.2117V0.660477C11.2117 0.295894 11.5148 0 11.8897 0C12.2647 0 12.5678 0.295894 12.5678 0.660477V1.32095H13.2458C15.1151 1.32095 16.6359 2.8024 16.6359 4.62334Z"
                      fill="#005E80"
                    />
                  </svg>
                  <p className="text-[#30313D] font-medium">
                    {targetPreference?.timeline_expectations
                      ? new Date(targetPreference.timeline_expectations)
                        .toLocaleDateString('en-GB')
                        .replace(/\//g, '-')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-nowrap">
                <p className="text-[#484848] sm:min-w-[180px]">Preferred Company Type</p>
                <p className="text-[#30313D] font-medium ml-[150px]">
                  {targetPreference?.preferred_company_type || 'N/A'}
                </p>
              </div>

              <div>
                {(() => {
                  let certifications: string[] = [];

                  try {
                    const raw = targetPreference?.certifications;
                    certifications = typeof raw === 'string' ? JSON.parse(raw) : raw;
                  } catch {
                    showAlert({ type: "error", message: "Failed to parse certifications" });
                  }

                  return Array.isArray(certifications) && certifications.length > 0
                    ? certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 py-3"
                      >
                        <p className="text-[#484848] sm:min-w-[180px]">
                          {index + 1}. Certification/License
                        </p>
                        <p className="text-[#30313D] font-medium ml-[150px]">{cert || 'N/A'}</p>
                      </div>
                    ))
                    : [1, 2, 3, 4].map((num) => (
                      <div
                        key={num}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 py-3"
                      >
                        <p className="text-[#484848] sm:min-w-[180px]">
                          {num}. Certification/License
                        </p>
                        <p className="text-[#30313D] font-medium ml-[150px]">N/A</p>
                      </div>
                    ));
                })()}
              </div>
            </div>

            <div className="ml-[200px] mt-[10px]  pb-[20px]">
              <div className="flex justify-between items-center flex-row gap-[916px] mt-15 ml-">
                <div
                  className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[93px] h-[34px]"
                  style={{ width: '93px' }}
                ></div>

                <div className="flex justify-start items-center flex-row gap-4 mx-auto w-fit ml-[-350px]">
                  <button
                    className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#064771] rounded-[49.82036209106445px] h-[34px]"
                    onClick={() => setActiveTab('company-overview')}
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
                      onClick={() => setActiveTab('financial-details')}
                    >
                      <span className="text-[#FFF] ">Next</span>

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
                          d="M0.282523 1.63847C-0.0941745 1.26364 -0.0941745 0.655938 0.282523 0.281116C0.659221 -0.0937055 1.26997 -0.0937055 1.64667 0.281116L7.71774 6.32195C8.09409 6.69643 8.09409 7.30357 7.71774 7.67805L1.64667 13.7189C1.26997 14.0937 0.659221 14.0937 0.282523 13.7189C-0.0941745 13.3441 -0.0941745 12.7364 0.282523 12.3615L5.67089 7L0.282523 1.63847Z"
                          fill="white"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetPreferences;
