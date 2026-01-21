import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import api from '../../../config/api';
import { useTabStore } from './store/tabStore';
import { showAlert } from '../../../components/Alert';
import html2pdf from 'html2pdf.js';

const FinancialDetails: React.FC = () => {
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
  const [, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [companyInfo, setCompanyInfo] = useState({
    company_title: '',
    origin_country_flag_svg: '',
    rating: '',
    company_type: '',
    status: '',
    origin_country: '',
    buyer_id: '',
    details: '',
    updated_at: '',
    image_url: '',
  });

  type FinancialDetails = {
    default_currency: string;
    investment_budget_range: string;
    ebitda_margin_latest_year: string;
    ebitda_latest_year: string;
    expected_ebitda_requirements: string;
    ideal_profit_multiple_range: string[];
    ttm_revenue_range: string;
    ttm_profit_range: string;
    deal_structure: string;
    acquiring_structure: string;
    desirable_acquiring_percentage_range: string;
    ownership_percentage_range: string;
    total_valuation_range: string;
    growth_rate_yoy: string;
    avg_revenue_growth_last_3_years: string;
    profit_criteria: string;
    mn_sructure: string;
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res = await fetch('/api/company-informations');
        const data = await res.json();
        setCompanyInfo(data);
      } catch {
        showAlert({ type: "error", message: "Error fetching company info" });
      }
    };

    fetchCompanyInfo();
  }, []);

  const [financialDetails, setFinancialDetails] = useState<FinancialDetails | null>(null);

  useEffect(() => {
    axios.get('/api/target-preference').then((res) => {
      setFinancialDetails(res.data.financial_details);
    });
  }, []);

  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        const response = await api.get(`/api/buyer/${id}`);


        const overview = response.data.data.company_overview || {};
        const financial = response.data.data.financial_details || {};

        setCompanyInfo({
          company_title: overview.reg_name || '',
          origin_country_flag_svg: overview.origin_country_flag_svg || '',
          details: overview.details || '',
          rating: overview.rating || '',
          company_type: overview.company_type || '',
          status: overview.status || '',
          origin_country: overview.hq_country || '',
          buyer_id: response.data.data.buyer_id || '',
          updated_at: response.data.data.updated_at || '',
          image_url: response.data.data.image || '',
        });

        let fetchedCurrencyName = '';


        if (financial?.default_currency) {
          try {
            const currencyDataResponse = await api.get(
              `/api/currencies/${financial.default_currency}`
            );


            if (currencyDataResponse?.data?.currency_name) {
              fetchedCurrencyName = currencyDataResponse.data.currency_name;
            } else {
              // console.warn('Currency name not found in API response:', currencyDataResponse.data);
            }
          } catch {
            showAlert({ type: "error", message: "Error fetching currency" });
          }
        }

        setFinancialDetails({
          default_currency: fetchedCurrencyName,
          investment_budget_range: financial.investment_budget || '',
          ebitda_margin_latest_year: financial.ebitda_margin_latest || '',
          ebitda_latest_year: financial.ebitda_multiple || '',
          expected_ebitda_requirements: financial.expected_ebitda || '',
          ideal_profit_multiple_range: financial.profit_multiple || [],
          ttm_revenue_range: financial.ttm_revenue || '',
          ttm_profit_range: financial.ttm_profit || '',
          mn_sructure: financial.ma_structure || '',
          desirable_acquiring_percentage_range: financial.acquire_pct || '',
          ownership_percentage_range: financial.shareholding || '',
          total_valuation_range: financial.valuation || '',
          growth_rate_yoy: financial.growth_rate_yoy || '',
          avg_revenue_growth_last_3_years: financial.revenue_growth_avg_3y || '',
          profit_criteria: financial.profit_criteria || '',
        });
      } catch {
        showAlert({ type: "error", message: "Failed to fetch buyer" });
        setError('Failed to load buyer data.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBuyer();
    }
  }, [id]);

  const [countries, setCountries] = useState([]);
  useEffect(() => {
    api
      .get('/api/countries')
      .then((res) => {
        setCountries(res.data);
      })
      .catch(() => showAlert({ type: "error", message: "Failed to fetch countries" }))
      .finally(() => setLoading(false));
  }, []);

  const getCountryById = (id) => countries.find((c) => c.id === id);

  const countryData = getCountryById(parseInt(companyInfo.origin_country));

  return (
    <div className="ml-3 font-poppins pdf-container">
      <div className=" flex w-[1316px] mt-[30px]">
        <div className=" w-[1019px] h-[180px]">
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
                    {countryData?.svg_icon_url ? (
                      <img
                        src={countryData?.svg_icon_url}
                        alt="flag"
                        className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center"
                      />
                    ) : (
                      <span className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center">
                        N/A
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
                            d="M2.2437 5.87325C2.58773 3.53533 4.76188 1.91897 7.0998 2.263C7.89745 2.38037 8.6457 2.72072 9.25836 3.24484L8.70684 3.79637C8.52198 3.98127 8.52203 4.28103 8.70695 4.46588C8.79569 4.55461 8.91606 4.60447 9.04155 4.60449H11.2127C11.4741 4.60449 11.6861 4.39254 11.6861 4.13108V1.95998C11.686 1.69852 11.474 1.48661 11.2125 1.48665C11.0871 1.48668 10.9667 1.53654 10.8779 1.62526L10.2625 2.2407C7.91549 0.148595 4.31689 0.355198 2.22479 2.70217C1.48362 3.53362 1.00264 4.56424 0.841439 5.66636C0.777882 6.05708 1.04309 6.42535 1.4338 6.48891C1.46899 6.49463 1.50454 6.49772 1.5402 6.49816C1.89767 6.4943 2.19772 6.22776 2.2437 5.87325Z"
                            fill="#064771"
                          />
                          <path
                            d="M11.4193 6.50146C11.0618 6.50533 10.7617 6.77187 10.7158 7.12638C10.3717 9.4643 8.19759 11.0807 5.85967 10.7366C5.06202 10.6193 4.31376 10.2789 3.7011 9.75481L4.25262 9.20328C4.43748 9.01838 4.43744 8.71862 4.25251 8.53376C4.16377 8.44504 4.0434 8.39518 3.91791 8.39515H1.74685C1.48539 8.39515 1.27344 8.60711 1.27344 8.86857V11.0397C1.2735 11.3011 1.4855 11.513 1.74696 11.513C1.87245 11.513 1.99282 11.4631 2.08156 11.3744L2.697 10.7589C5.04342 12.8513 8.64175 12.6453 10.7341 10.2989C11.4757 9.46725 11.9569 8.43628 12.118 7.33376C12.1818 6.94308 11.9169 6.57463 11.5262 6.51081C11.4908 6.50502 11.4551 6.50189 11.4193 6.50146Z"
                            fill="#064771"
                          />
                        </svg>

                        <span className="text-[#064771] text-[12px] text-nowrap">Update</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-[70px] mt-[54px] ">
        <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none">
          <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
            Financial Details
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

          <div className="w-full overflow-x-auto">
            <div className="min-w-[300px] table w-full">
              <div className="table-row">
                <div className="table-cell text-[#484848] py-2 pr-6 align-top">
                  Default Currency
                </div>
                <div className="table-cell text-[#30313D] font-medium py-2">
                  {financialDetails?.default_currency || 'N/A'}
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell text-[#484848] py-2 pr-6 align-top">
                  Investment Budget Range
                </div>

                <div className="table-cell text-[#30313D] font-medium py-2">
                  {(() => {
                    try {
                      const budget = JSON.parse(financialDetails?.investment_budget_range);
                      return budget?.min && budget?.max ? `${budget.min} - ${budget.max}` : 'N/A';
                    } catch {
                      return 'N/A';
                    }
                  })()}
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell text-[#484848] py-2 pr-6 align-top">
                  EBITDA Margin Latest Year
                </div>
                <div className="table-cell text-[#30313D] font-medium py-2">
                  {financialDetails?.ebitda_margin_latest_year || 'N/A'}
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell text-[#484848] py-2 pr-6 align-top">
                  EBITDA latest year
                </div>
                <div className="table-cell py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[#30313D] font-medium">
                      {(() => {
                        const raw = financialDetails?.ebitda_latest_year;

                        if (!raw) return 'N/A';

                        try {
                          const ebitda = typeof raw === 'string' ? JSON.parse(raw) : raw;
                          return ebitda?.amount ? ` ${ebitda.amount}` : 'N/A';
                        } catch {
                          return 'N/A';
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell text-[#484848] py-2 pr-6 align-top">
                  Expected EBITDA Requirements (Times)
                </div>

                <div className="table-cell text-[#30313D] font-medium py-2">
                  {(() => {
                    try {
                      const data = JSON.parse(financialDetails?.expected_ebitda_requirements);

                      return data?.min && data?.max ? `${data.min} - ${data.max}` : 'N/A';
                    } catch {
                      return 'N/A';
                    }
                  })()}
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell text-[#484848] py-2 pr-6 align-top">
                  Ideal Profit Multiple Range (this Year)
                </div>
                <div className="table-cell text-[#30313D] font-medium py-2">
                  {(() => {
                    try {
                      const range =
                        typeof financialDetails?.ideal_profit_multiple_range === 'string'
                          ? JSON.parse(financialDetails.ideal_profit_multiple_range)
                          : null;

                      if (range && range.min && range.max) {
                        return `${range.min} - ${range.max}`;
                      }

                      return 'N/A';
                    } catch {
                      showAlert({ type: "error", message: "Failed to parse ideal_profit_multiple_range" });
                      return 'N/A';
                    }
                  })()}
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell text-[#484848] py-2 pr-6 align-top">
                  Trailing Twelve-Month (TTM) Revenue Range
                </div>
                <div className="table-cell text-[#30313D] font-medium py-2">
                  {(() => {
                    try {
                      const range =
                        typeof financialDetails?.ttm_revenue_range === 'string'
                          ? JSON.parse(financialDetails.ttm_revenue_range)
                          : null;

                      if (range && range.min && range.max) {
                        return `${range.min} - ${range.max}`;
                      }

                      return 'N/A';
                    } catch {
                      showAlert({ type: "error", message: "Failed to parse ttm_revenue_range" });
                      return 'N/A';
                    }
                  })()}
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell text-[#484848] py-2 pr-6 align-top">
                  Trailing Twelve-Month (TTM) Profit Range?
                </div>

                <div className="table-cell text-[#30313D] font-medium py-2">
                  {(() => {
                    try {
                      const range = JSON.parse(financialDetails?.ttm_profit_range);
                      return range?.min && range?.max ? `${range.min} - ${range.max}` : 'N/A';
                    } catch {
                      return 'N/A';
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none mt-[74px]">
        <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
          Deal Structure
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

        <div className="w-full" style={{ maxWidth: '840px' }}>
          <div className="flex flex-wrap py-2 ">
            <div className="w-full sm:w-1/2 text-[#484848]">M&A Structure</div>
            <div className="w-full sm:w-1/2 text-[#30313D] font-medium">
              {financialDetails?.mn_sructure || 'N/A'}
            </div>
          </div>

          <div className="flex flex-wrap py-2">
            <div className="w-full sm:w-1/2 text-[#484848]">
              Desirable Acquiring Percentage Range
            </div>

            <div className="w-full sm:w-1/2 text-[#30313D] font-medium ">
              {(() => {
                try {
                  const range = JSON.parse(financialDetails?.desirable_acquiring_percentage_range);
                  return range?.min && range?.max ? `${range.min} - ${range.max}` : 'N/A';
                } catch {
                  return 'N/A';
                }
              })()}
            </div>
          </div>

          <div className="flex flex-wrap py-2">
            <div className="w-full sm:w-1/2 text-[#484848]">Shareholding/ Ownership Percentage</div>

            <div className="w-full sm:w-1/2 text-[#30313D] font-medium">
              {(() => {
                try {
                  const r = JSON.parse(financialDetails?.ownership_percentage_range);
                  return r?.min && r?.max ? `${r.min} - ${r.max}` : 'N/A';
                } catch {
                  return 'N/A';
                }
              })()}
            </div>
          </div>

          <div className="flex flex-wrap py-2">
            <div className="w-full sm:w-1/2 text-[#484848]">Total Valuation Within</div>

            <div className="w-full sm:w-1/2 text-[#30313D] font-medium">
              {(() => {
                try {
                  const range = JSON.parse(financialDetails?.total_valuation_range);
                  return range?.min && range?.max ? `${range.min} - ${range.max}` : 'N/A';
                } catch {
                  return 'N/A';
                }
              })()}
            </div>
          </div>

          <div className="flex flex-wrap py-2">
            <div className="w-full sm:w-1/2 text-[#484848]">Growth Rate (YOY)</div>
            <div className="w-full sm:w-1/2 text-[#30313D] font-medium">
              {financialDetails?.growth_rate_yoy || 'N/A'}
            </div>
          </div>

          <div className="flex flex-wrap py-2">
            <div className="w-full sm:w-1/2 text-[#484848]">
              Revenue Growth Rate (Average Last 3 Years)
            </div>
            <div className="w-full sm:w-1/2 text-[#30313D] font-medium">
              {financialDetails?.avg_revenue_growth_last_3_years || 'N/A'}
            </div>
          </div>

          <div className="flex flex-wrap py-2">
            <div className="w-full sm:w-1/2 text-[#484848]">Profit Criteria</div>
            <div className="w-full sm:w-1/2 text-[#30313D] font-medium">
              {financialDetails?.profit_criteria || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="ml-7 mt-[110px]">
        <div className="flex justify-between items-center flex-row gap-[916px] mt-15 ml-">
          <div
            className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[93px] h-[34px]"
            style={{ width: '93px' }}
          ></div>

          <div className="flex justify-start items-center flex-row gap-4 mx-auto w-fit ml-[-350px]">
            <button
              className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#064771] rounded-[49.82036209106445px] h-[34px]"
              onClick={() => setActiveTab('target-preferences')}
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
                onClick={() => setActiveTab('partnership-details')}
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
  );
};

export default FinancialDetails;
