import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../config/api';
import { useNavigate } from 'react-router-dom';
import { useTabStore } from './store/tabStore';
import { showAlert } from '../../../components/Alert';
import html2pdf from 'html2pdf.js';

type PartnerInfo = {
  referral_bonus_criteria: string;
  success_fee: string;
  referral_bonus_amount: string;
  mou: string;
  partnership_affiliation: string;
  partner: string;

  mou_status: boolean;
  specific_remarks: string;
};

const PartnershipDetails: React.FC = () => {
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

  const handleCopyLinkExample = (buyerId?: string | null) => {
    const resolvedBuyerId = buyerId ?? id;

    if (!resolvedBuyerId) {
      showAlert({ type: 'error', message: 'No buyer ID available to share' });
      return;
    }

    const fullUrl = `${baseURL}/prospects/investor/${resolvedBuyerId}`;

    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        showAlert({
          type: 'success',
          message: 'Link copied to clipboard',
        });
      })
      .catch(() => {
        showAlert({ type: 'error', message: 'Failed to copy' });
      });
  };

  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const [, setLoading] = useState(true);
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfo] = useState({
    company_title: '',
    origin_country_flag_svg: '',
    rating: '',
    company_type: '',
    status: '',
    origin_country: '',

    general_contact: '',
    company_email: '',
    contact_number: '',
    partner_website: '',
    hq_address: '',
    contact_persons: [],

    contact_person_name: '',

    contact_person_designation: '',
    contact_person_email: '',
    contact_person_numbers: [],
    buyer_id: '',
    updated_at: '',
    image_url: '',
  });

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

  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);

  // Buyer partner data now sourced from `/api/buyer/:id`; no extra API call needed.

  useEffect(() => {
    const fetchBuyerPartnerData = async () => {
      try {
        const response = await api.get(`/api/buyer/${id}`);


        const overview = response.data.data.company_overview || {};
        const partner = response.data.data.partnership_details || {};

        setCompanyInfo({
          company_title: overview.reg_name || '',
          origin_country_flag_svg: overview.origin_country_flag_svg || '',
          rating: overview.rating || '',
          company_type: overview.company_type || '',
          status: overview.status || '',
          origin_country: overview.hq_country || '',

          company_email: overview.email || '',
          contact_number: overview.phone || '',

          contact_persons: overview.contact_persons || [],

          contact_person_name: overview.seller_contact_name || '',
          contact_person_designation: overview.seller_designation || '',
          contact_person_email: overview.seller_email || '',
          contact_person_numbers: overview.seller_phone || [],
          buyer_id: response.data.data.buyer_id || '',
          updated_at: response.data.data.updated_at || '',
          image_url: response.data.data.image || '',
        });

        setPartnerInfo({
          referral_bonus_criteria: partner.referral_bonus_criteria || '',
          success_fee: partner.success_fee || '',
          referral_bonus_amount: partner.referral_bonus_amount || '',
          mou: partner.mou_status || '',
          partnership_affiliation: partner.partnership_affiliation || '',
          mou_status: partner.mou_status || false,
          specific_remarks: partner.specific_remarks || '',
          partner: partner.partner || '',
        });
      } catch {
        showAlert({ type: "error", message: "Failed to fetch buyer partner data" });
      }
    };

    if (id) {
      fetchBuyerPartnerData();
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

  const getCountryById = (id: number) => countries.find((c: { id: number }) => c.id === id);

  const countryData = getCountryById(parseInt(companyInfo.origin_country));


  const [selectedPartnerDetails, setSelectedPartnerDetails] =
    useState<Record<string, unknown> | null>(null);
  const partnerId = partnerInfo?.partner;
  const normalizedPartnerId =
    partnerId && partnerId !== 'undefined' && partnerId !== 'null' ? partnerId : null;

  useEffect(() => {
    const fetchPartnerDetails = async () => {
      if (!normalizedPartnerId) return;
      try {
        const response = await api.get(`/api/partner/${normalizedPartnerId}`);
        setSelectedPartnerDetails(response.data.data);
      } catch (error: unknown) {
        if (error instanceof Error && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 404) {
          setSelectedPartnerDetails(null);
          return;
        }

        showAlert({ type: 'error', message: 'Failed to fetch partner details' });
      }
    };

    fetchPartnerDetails();
  }, [normalizedPartnerId]);

  const partnerCountryData = getCountryById(
    parseInt(selectedPartnerDetails?.partner_overview?.hq_country)
  );

  if (!paramId && !localStorage.getItem('seller_id')) {
    return (
      <div className="p-8 text-red-600 font-semibold flex justify-center items-center h-[200px]">
        Error: No seller ID found. Please complete company overview.
      </div>
    );
  }

  if (partnerInfo?.partnership_affiliation == '1') {
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
              <span className="text-[#064771] text-sm font-semibold leading-[15px] text-nowrap mt-[-20px]">
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
                          onClick={() => handleCopyLinkExample()}
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
                          <span className="text-[#064771] text-[12px] text-nowrap">Share</span>
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
                      className="flex justify-start items-center flex-row gap-[7.1049323081970215px] w-[202px] h-[23px]"
                      style={{ width: '202px' }}
                    >
                      <button
                        onClick={handleDownloadPDF}
                        className="flex justify-center items-center flex-row gap-[3.044971227645874px] py-[3.5524661540985107px] px-[5.647058963775635px] bg-[#F1FBFF] border-solid border-[#064771] border-[0.3529411852359772px] rounded-[35.16731643676758px] h-[24px]"
                        style={{ width: '114px' }}
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
                      <button
                        className="flex justify-center items-center flex-row gap-[3.044971227645874px] py-[3.5524661540985107px] px-[5.647058963775635px] bg-[#FFFFFF] rounded-[35.16731643676758px] w-[82px] h-[24px]"
                        style={{ width: '82px' }}
                        onClick={() => {
                          navigate(`/prospects/edit-investor/${id}`);
                        }}
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
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-[70px] mt-[54px] ">
          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none">
            <p className="self-stretch text-[#064771] text-lg font-medium leading-5">
              Partnership Affiliation for This Project ?
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

            <div
              className="flex justify-between items-start flex-col gap-[71px] w-[560px] h-[849px] text-nowrap"
              style={{ width: '560px' }}
            >
              <div className="flex self-stretch justify-start items-start flex-col gap-[41px]">
                <div
                  className="flex justify-start items-start flex-col gap-3.5 w-[560px]"
                  style={{ width: '560px' }}
                >
                  <div
                    className="flex justify-start items-start flex-col gap-3.5 w-[586px]"
                    style={{ width: '586px' }}
                  ></div>

                  <p>
                    {partnerInfo?.partnership_affiliation == '1'
                      ? 'Managed by Partner'
                      : 'Managed by Us'}
                  </p>
                </div>
                <div
                  className="flex justify-start items-center flex-row gap-4 w-[219px] h-[111px]"
                  style={{ width: '219px' }}
                >
                  <img
                    src={
                      selectedPartnerDetails?.partner_image
                        ? `${import.meta.env.VITE_API_BASE_URL}${selectedPartnerDetails?.partner_image
                        }`
                        : `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="145" height="145" viewBox="0 0 145 145" fill="none">
<rect x="1" y="1" width="143" height="143" rx="71.5" fill="#F1FBFF"/>
<rect x="1" y="1" width="143" height="143" rx="71.5" stroke="#064771" stroke-width="2"/>
<path d="M99.7904 71.1303L107.763 65.2264L100.872 42L65.3978 43.1369L61.9803 48.4439L49.8312 45.5217L37 72.012L42.8447 77.0426L39.7588 81.8182C38.7841 83.3266 38.4552 85.1242 38.8327 86.88C39.21 88.6358 40.2486 90.1394 41.7569 91.1141C42.8575 91.8253 44.1123 92.1926 45.3924 92.1926C45.7293 92.1926 46.0678 92.166 46.4059 92.1145C46.8339 93.6367 47.7945 95.0153 49.2237 95.9388C50.349 96.6661 51.6122 97.0133 52.8618 97.0133C53.1993 97.0133 53.5353 96.9848 53.8677 96.9349C54.3097 98.516 55.2995 99.8649 56.6903 100.764C57.8158 101.491 59.0789 101.838 60.3284 101.838C62.536 101.838 64.7012 100.754 65.9859 98.7656L66.9028 97.3465L72.2726 100.906L72.295 100.921C73.3956 101.632 74.6504 102 75.9305 102C76.4045 102 76.8823 101.95 77.3568 101.848C79.1126 101.47 80.6162 100.432 81.5909 98.9235C82.2768 97.8619 82.6241 96.6777 82.6613 95.4979C83.0053 95.4777 83.3503 95.4319 83.6937 95.3581C85.4495 94.9806 86.9531 93.942 87.9278 92.4338C88.6002 91.3934 88.9649 90.215 89.0026 89.008C89.3453 88.9877 89.6886 88.9419 90.0304 88.8684C91.7863 88.491 93.2899 87.4526 94.2646 85.9442C94.9512 84.8816 95.2985 83.6959 95.335 82.5151C97.4044 82.395 99.3925 81.3252 100.601 79.4545C101.576 77.9461 101.905 76.1486 101.527 74.3928C101.259 73.1439 100.656 72.0227 99.7904 71.1303ZM67.934 47.6145L97.5035 46.6669L102.487 63.4634L95.8589 68.3716L70.512 51.868L63.3171 62.7881L63.306 62.8051C62.6572 63.8085 61.3136 64.0972 60.3102 63.4492C59.3068 62.8008 59.0179 61.4569 59.6682 60.4504L67.934 47.6145ZM47.2256 86.6431C46.5768 87.6466 45.2329 87.9354 44.2299 87.2872C43.7438 86.973 43.4091 86.4884 43.2874 85.9226C43.1659 85.3568 43.2718 84.7776 43.5861 84.2915L48.143 77.239C48.5572 76.5982 49.2546 76.2489 49.9663 76.2489C50.3689 76.2489 50.7762 76.3609 51.1388 76.5951C51.6249 76.9093 51.9595 77.3937 52.0812 77.9595C52.2028 78.5254 52.0968 79.1047 51.7828 79.5908L47.2256 86.6431ZM54.6924 91.4679C54.0436 92.4713 52.6998 92.7599 51.6965 92.1118C50.6931 91.4634 50.4043 90.1195 51.0527 89.1161L55.6098 82.0637C56.024 81.4228 56.7214 81.0735 57.4331 81.0735C57.8357 81.0735 58.243 81.1855 58.6056 81.4199C59.609 82.0682 59.8979 83.4122 59.2495 84.4156L54.6924 91.4679ZM66.7159 89.2402L62.1589 96.2926C61.5105 97.2963 60.1666 97.5848 59.1633 96.9365C58.6772 96.6224 58.3425 96.1378 58.221 95.572C58.0994 95.0062 58.2052 94.4269 58.5194 93.9407L63.0764 86.8883C63.3906 86.4022 63.875 86.0676 64.4408 85.946C64.5938 85.9132 64.7477 85.8969 64.9002 85.8969C65.3128 85.8969 65.7172 86.0154 66.0719 86.2446C67.0754 86.893 67.3642 88.2368 66.7159 89.2402ZM96.774 76.9811C96.4599 77.4672 95.9754 77.8018 95.4096 77.9235C94.8438 78.0452 94.2644 77.9391 93.7785 77.6251L92.2666 76.6482L92.2665 76.6481L85.2139 72.091L82.741 75.918L84.2531 76.8952L89.7936 80.4754C90.2797 80.7895 90.6143 81.2739 90.7359 81.8398C90.8575 82.4056 90.7515 82.985 90.4375 83.4711C90.1235 83.9571 89.6388 84.2919 89.0731 84.4135C88.5072 84.535 87.9281 84.4291 87.4418 84.1151L80.3894 79.5581L77.9166 83.3851L83.457 86.965C84.4604 87.6133 84.7492 88.9572 84.1009 89.9607C83.7867 90.4468 83.3022 90.7815 82.7365 90.9031C82.1705 91.0246 81.5914 90.9188 81.1053 90.6047L75.0852 86.7148L72.6123 90.5419L77.1203 93.4548C78.1237 94.1034 78.4127 95.4471 77.7643 96.4506C77.4501 96.9367 76.9657 97.2714 76.3998 97.3931C75.8376 97.5139 75.2621 97.4099 74.778 97.1005L69.3766 93.5196L70.5435 91.7135C72.5554 88.5997 71.6591 84.4295 68.5454 82.4178C67.1151 81.4936 65.4621 81.1847 63.8975 81.4207C63.4699 79.8972 62.5091 78.5172 61.0789 77.593C59.6495 76.6695 57.9979 76.3603 56.4344 76.5955C55.9922 75.015 55.0025 73.6666 53.6121 72.7682C51.0386 71.105 47.744 71.4309 45.5419 73.352L42.629 70.8449L52.3334 50.8103L59.3679 52.5021L55.8398 57.9806C53.8279 61.0944 54.7241 65.2644 57.8379 67.2763C60.9484 69.2865 65.1135 68.3935 67.1279 65.2872L71.8241 58.1595L96.1311 73.9856C96.617 74.2997 96.9518 74.7842 97.0734 75.35C97.1942 75.9157 97.0882 76.4949 96.774 76.9811Z" fill="#064771"/>
</svg>`)}`
                    }
                    alt="Test Profile"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="flex justify-start items-start flex-col gap-4 w-[271px]"
                    style={{ width: '271px' }}
                  >
                    <p className="self-stretch text-[#30313D] text-xl font-semibold leading-[30px]">
                      {selectedPartnerDetails?.partner_overview?.reg_name
                        ? selectedPartnerDetails.partner_overview.reg_name.length > 30
                          ? `${selectedPartnerDetails.partner_overview.reg_name.slice(0, 30)}...`
                          : selectedPartnerDetails.partner_overview.reg_name
                        : 'N/A'}
                    </p>
                    <div className="flex justify-start items-center flex-row gap-[8.666666030883789px]">
                      <div className="w-[20px] h-[20px]" style={{ width: '20px' }}></div>

                      <div className="flex justify-start items-center flex-row gap-[8.67px] ml-[-40px]">
                        {partnerCountryData?.svg_icon_url ? (
                          <img
                            src={partnerCountryData?.svg_icon_url}
                            alt="flag"
                            className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center"
                          />
                        ) : (
                          <span className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-800 text-[10px] flex items-center justify-center">
                            n/a
                          </span>
                        )}
                        <span className="text-[#30313D] text-sm font-semibold leading-[31.78px] ">
                          {partnerCountryData?.name || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex self-stretch justify-start items-start flex-col gap-6 h-[249px]">
                <div className="flex self-stretch justify-start items-center flex-row gap-[13px]">
                  <div
                    className="flex justify-center items-center flex-col gap-2.5 py-[7px] px-1.5 bg-[#FFFFFF] border-solid border-[#064771] border-[0.5px] rounded-[20.5px] w-[34px] h-[34px]"
                    style={{ width: '34px' }}
                  >
                    <svg
                      width="22"
                      height="20"
                      viewBox="0 0 22 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19.3346 9.73544L21.7589 7.94027L19.6633 0.87793L8.87697 1.22363L7.83782 2.83729L4.14372 1.94876L0.242188 10.0035L2.01937 11.5332L1.08104 12.9853C0.784685 13.4439 0.684666 13.9905 0.799435 14.5244C0.914163 15.0582 1.22998 15.5154 1.68859 15.8118C2.02324 16.0281 2.40478 16.1398 2.79401 16.1398C2.89647 16.1398 2.99939 16.1316 3.10218 16.116C3.23233 16.5788 3.5244 16.998 3.95898 17.2788C4.30115 17.5 4.68525 17.6055 5.0652 17.6055C5.16782 17.6055 5.26998 17.5969 5.37105 17.5817C5.50545 18.0625 5.80643 18.4726 6.22932 18.7459C6.57153 18.9671 6.9556 19.0726 7.33554 19.0726C8.0068 19.0726 8.66516 18.7429 9.05578 18.1384L9.33457 17.7069L10.9674 18.7893L10.9742 18.7938C11.3088 19.0101 11.6904 19.1218 12.0796 19.1218C12.2237 19.1218 12.369 19.1065 12.5133 19.0755C13.0472 18.9608 13.5044 18.6449 13.8007 18.1864C14.0093 17.8636 14.1149 17.5035 14.1262 17.1448C14.2308 17.1386 14.3357 17.1247 14.4401 17.1022C14.974 16.9875 15.4312 16.6717 15.7275 16.2131C15.932 15.8967 16.0429 15.5384 16.0544 15.1714C16.1586 15.1652 16.2629 15.1513 16.3669 15.129C16.9008 15.0142 17.358 14.6985 17.6543 14.2398C17.8631 13.9167 17.9687 13.5562 17.9798 13.1971C18.6091 13.1606 19.2136 12.8354 19.581 12.2665C19.8774 11.8079 19.9774 11.2613 19.8627 10.7274C19.7811 10.3477 19.5979 10.0068 19.3346 9.73544ZM9.64812 2.5851L18.6392 2.29698L20.1546 7.4042L18.1391 8.89663L10.432 3.87845L8.24428 7.19887L8.24092 7.20404C8.04366 7.50914 7.63509 7.59693 7.32999 7.39987C7.0249 7.20274 6.93706 6.79409 7.13479 6.48806L9.64812 2.5851ZM3.35143 14.4523C3.15417 14.7575 2.74552 14.8453 2.44054 14.6482C2.29274 14.5527 2.19096 14.4053 2.15398 14.2333C2.11704 14.0612 2.14923 13.8851 2.24479 13.7373L3.63039 11.5929C3.75634 11.398 3.96839 11.2918 4.18478 11.2918C4.3072 11.2918 4.43104 11.3259 4.54132 11.3971C4.68912 11.4926 4.79086 11.6399 4.82784 11.812C4.86482 11.984 4.83259 12.1602 4.73711 12.308L3.35143 14.4523ZM5.62182 15.9194C5.42455 16.2245 5.01594 16.3122 4.71089 16.1152C4.40579 15.918 4.31796 15.5094 4.51514 15.2043L5.90078 13.0599C6.02672 12.865 6.23878 12.7588 6.45517 12.7588C6.57758 12.7588 6.70143 12.7929 6.8117 12.8641C7.1168 13.0613 7.20463 13.4699 7.0075 13.775L5.62182 15.9194ZM9.27776 15.242L7.89212 17.3864C7.69498 17.6916 7.28633 17.7793 6.98127 17.5822C6.83347 17.4867 6.73169 17.3394 6.69475 17.1673C6.65777 16.9953 6.68996 16.8191 6.78548 16.6713L8.17112 14.5269C8.26664 14.3791 8.41394 14.2773 8.58599 14.2404C8.63251 14.2304 8.67928 14.2254 8.72568 14.2254C8.85112 14.2254 8.97409 14.2615 9.08192 14.3312C9.38706 14.5283 9.47489 14.9369 9.27776 15.242ZM18.4174 11.5145C18.3219 11.6623 18.1746 11.764 18.0025 11.801C17.8305 11.838 17.6543 11.8057 17.5065 11.7103L17.0468 11.4132L17.0468 11.4132L14.9023 10.0276L14.1504 11.1912L14.6102 11.4883L16.2949 12.5769C16.4427 12.6725 16.5444 12.8198 16.5814 12.9918C16.6184 13.1639 16.5862 13.34 16.4907 13.4878C16.3952 13.6356 16.2478 13.7374 16.0758 13.7744C15.9037 13.8113 15.7276 13.7791 15.5798 13.6837L13.4354 12.298L12.6835 13.4617L14.3681 14.5502C14.6732 14.7474 14.7611 15.156 14.5639 15.4611C14.4684 15.6089 14.3211 15.7107 14.1491 15.7477C13.977 15.7846 13.8009 15.7524 13.6531 15.6569L11.8226 14.4741L11.0707 15.6378L12.4414 16.5235C12.7465 16.7207 12.8344 17.1293 12.6372 17.4345C12.5416 17.5823 12.3944 17.684 12.2223 17.721C12.0513 17.7577 11.8764 17.7261 11.7291 17.6321L10.0868 16.5432L10.4416 15.9941C11.0533 15.0473 10.7808 13.7793 9.83404 13.1676C9.39912 12.8865 8.89651 12.7926 8.42079 12.8644C8.29076 12.4012 7.99861 11.9815 7.56374 11.7005C7.12912 11.4197 6.62692 11.3257 6.1515 11.3972C6.01706 10.9166 5.71612 10.5066 5.29335 10.2335C4.51085 9.72775 3.50906 9.82684 2.83948 10.411L1.95377 9.64866L4.90454 3.55684L7.04347 4.07126L5.97071 5.73708C5.35895 6.68386 5.63148 7.95183 6.57826 8.56358C7.52407 9.17479 8.79052 8.90327 9.40303 7.95876L10.831 5.79146L18.2219 10.6036C18.3696 10.6992 18.4714 10.8464 18.5084 11.0185C18.5451 11.1905 18.5129 11.3666 18.4174 11.5145Z"
                        fill="#064771"
                      />
                    </svg>
                  </div>
                  <div
                    className="flex justify-start items-start flex-col gap-[9px] w-[472px]"
                    style={{ width: '472px' }}
                  >
                    <span className="text-[#727272] text-sm">Referral Bonus Criteria</span>
                    <p className="self-stretch text-[#30313D] text-lg font-medium">
                      {partnerInfo?.referral_bonus_criteria || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex self-stretch justify-start items-start flex-col gap-2.5">
                  <div className="flex justify-start items-center flex-row gap-2.5">
                    <span className="text-[#727272] text-sm leading-[18.860000610351562px]">
                      Referral Bonus Amount / Percentage
                    </span>
                  </div>
                  <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                    <svg
                      width="22"
                      height="19"
                      viewBox="0 0 22 19"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19.0924 8.85751L21.5167 7.06234L19.4211 0L8.63478 0.345695L7.59563 1.95936L3.90153 1.07083L0 9.12559L1.77718 10.6552L0.838856 12.1073C0.542497 12.566 0.442478 13.1126 0.557248 13.6464C0.671975 14.1803 0.987791 14.6375 1.44641 14.9339C1.78105 15.1501 2.16259 15.2618 2.55183 15.2618C2.65428 15.2618 2.7572 15.2537 2.85999 15.2381C2.99014 15.7009 3.28222 16.1201 3.71679 16.4009C4.05896 16.622 4.44306 16.7276 4.82301 16.7276C4.92563 16.7276 5.0278 16.719 5.12887 16.7038C5.26326 17.1845 5.56424 17.5947 5.98714 17.868C6.32934 18.0891 6.71341 18.1947 7.09335 18.1947C7.76462 18.1947 8.42297 17.865 8.81359 17.2604L9.09239 16.8289L10.7252 17.9114L10.732 17.9159C11.0666 18.1322 11.4482 18.2439 11.8374 18.2439C11.9815 18.2439 12.1268 18.2286 12.2711 18.1976C12.805 18.0828 13.2622 17.767 13.5585 17.3084C13.7671 16.9856 13.8727 16.6256 13.884 16.2668C13.9886 16.2607 14.0935 16.2468 14.1979 16.2243C14.7318 16.1095 15.189 15.7937 15.4854 15.3352C15.6898 15.0188 15.8007 14.6605 15.8122 14.2935C15.9164 14.2873 16.0208 14.2734 16.1247 14.251C16.6586 14.1363 17.1158 13.8205 17.4121 13.3619C17.6209 13.0388 17.7265 12.6783 17.7376 12.3192C18.3669 12.2827 18.9714 11.9574 19.3389 11.3886C19.6352 10.93 19.7352 10.3834 19.6206 9.8495C19.5389 9.46977 19.3557 9.12886 19.0924 8.85751ZM9.40593 1.70717L18.397 1.41905L19.9124 6.52627L17.8969 8.0187L10.1898 3.00052L8.0021 6.32094L7.99874 6.32611C7.80147 6.63121 7.39291 6.719 7.08781 6.52194C6.78271 6.32481 6.69488 5.91616 6.8926 5.61013L9.40593 1.70717ZM3.10924 13.5744C2.91198 13.8795 2.50333 13.9673 2.19836 13.7702C2.05055 13.6747 1.94877 13.5274 1.91179 13.3553C1.87485 13.1833 1.90704 13.0072 2.0026 12.8594L3.3882 10.715C3.51415 10.5201 3.72621 10.4139 3.94259 10.4139C4.06501 10.4139 4.18886 10.4479 4.29913 10.5192C4.44693 10.6147 4.54867 10.762 4.58565 10.934C4.62264 11.1061 4.5904 11.2823 4.49492 11.4301L3.10924 13.5744ZM5.37963 15.0414C5.18236 15.3465 4.77376 15.4343 4.4687 15.2372C4.1636 15.0401 4.07577 14.6315 4.27295 14.3264L5.65859 12.182C5.78454 11.9871 5.99659 11.8809 6.21298 11.8809C6.3354 11.8809 6.45924 11.9149 6.56952 11.9862C6.87462 12.1833 6.96245 12.592 6.76531 12.8971L5.37963 15.0414ZM9.03557 14.3641L7.64993 16.5085C7.45279 16.8137 7.04414 16.9014 6.73909 16.7043C6.59129 16.6088 6.4895 16.4614 6.45256 16.2894C6.41558 16.1173 6.44777 15.9412 6.54329 15.7934L7.92893 13.649C8.02445 13.5012 8.17175 13.3994 8.3438 13.3624C8.39032 13.3525 8.4371 13.3475 8.48349 13.3475C8.60893 13.3475 8.7319 13.3835 8.83973 13.4533C9.14488 13.6504 9.23271 14.059 9.03557 14.3641ZM18.1752 10.6365C18.0797 10.7843 17.9324 10.8861 17.7603 10.9231C17.5883 10.9601 17.4121 10.9278 17.2643 10.8323L16.8046 10.5353L16.8046 10.5353L14.6602 9.14962L13.9083 10.3133L14.368 10.6104L16.0527 11.699C16.2005 11.7945 16.3022 11.9418 16.3392 12.1139C16.3762 12.2859 16.344 12.4621 16.2485 12.6099C16.153 12.7577 16.0056 12.8595 15.8336 12.8965C15.6615 12.9334 15.4854 12.9012 15.3376 12.8057L13.1932 11.4201L12.4413 12.5838L14.1259 13.6723C14.431 13.8694 14.5189 14.278 14.3217 14.5832C14.2262 14.731 14.0789 14.8328 13.9069 14.8697C13.7348 14.9067 13.5587 14.8745 13.4109 14.779L11.5804 13.5962L10.8285 14.7599L12.1992 15.6456C12.5043 15.8428 12.5922 16.2514 12.395 16.5565C12.2995 16.7043 12.1522 16.8061 11.9801 16.8431C11.8092 16.8798 11.6342 16.8482 11.487 16.7541L9.84459 15.6653L10.1994 15.1161C10.8112 14.1694 10.5386 12.9013 9.59185 12.2896C9.15694 12.0086 8.65432 11.9147 8.1786 11.9865C8.04858 11.5232 7.75642 11.1036 7.32155 10.8226C6.88693 10.5418 6.38473 10.4478 5.90931 10.5193C5.77487 10.0387 5.47393 9.62871 5.05116 9.35555C4.26866 8.84982 3.26688 8.94891 2.5973 9.53306L1.71158 8.77073L4.66235 2.67891L6.80128 3.19333L5.72852 4.85915C5.11676 5.80593 5.38929 7.0739 6.33607 7.68565C7.28188 8.29686 8.54834 8.02534 9.16084 7.08083L10.5888 4.91353L17.9797 9.7257C18.1275 9.82122 18.2292 9.96852 18.2662 10.1406C18.3029 10.3126 18.2707 10.4887 18.1752 10.6365Z"
                        fill="#064771"
                      />
                    </svg>
                    <p className="text-[#30313D] text-lg font-medium">
                      {partnerInfo?.referral_bonus_amount || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex self-stretch justify-start items-start flex-col gap-2.5">
                  <div className="flex justify-start items-center flex-row gap-2.5">
                    <span className="text-[#727272] text-sm leading-[18.860000610351562px]">
                      MOU status
                    </span>
                  </div>
                  <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                    <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                      {partnerInfo?.mou === 'Mou Signed' ? (
                        <>
                          <svg
                            width="16"
                            height="17"
                            viewBox="0 0 16 17"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 16.2441C12.4 16.2441 16 12.6441 16 8.24414C16 3.84414 12.4 0.244141 8 0.244141C3.6 0.244141 0 3.84414 0 8.24414C0 12.6441 3.6 16.2441 8 16.2441Z"
                              fill="#064771"
                            />
                            <path
                              d="M4.60156 8.24639L6.86556 10.5104L11.4016 5.98242"
                              stroke="white"
                              strokeWidth="1.45001"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-green-600 font-medium">Mou signed</span>
                        </>
                      ) : (
                        <>
                          <svg
                            width="16"
                            height="17"
                            viewBox="0 0 16 17"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="8" cy="8.24414" r="8" fill="#D32F2F" />
                            <path
                              d="M5 5.24414L11 11.2441"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M11 5.24414L5 11.2441"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="text-red-600 font-medium">
                            {partnerInfo?.mou || 'N/A'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex self-stretch justify-start items-center flex-row gap-2.5 h-[69px]">
                  <p className="text-[#484848] leading-[19.28569984436035px]">Specific Remarks</p>
                  <span className="text-[#30313D] font-medium leading-normal ml-auto">
                    {partnerInfo?.specific_remarks || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex self-stretch justify-start items-start flex-col gap-6">
                <div
                  className="flex justify-start items-start flex-col gap-4 w-[560px]"
                  style={{ width: '560px' }}
                >
                  <p className="self-stretch text-[#064771] text-lg font-medium leading-5">
                    Partner’s General Contact
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
                </div>
                <div className="flex self-stretch justify-start items-start flex-col gap-[26px]">
                  <div className="flex self-stretch justify-start items-start flex-col gap-5">
                    <div className="flex self-stretch justify-between items-center flex-row gap-2.5">
                      <p className="text-[#484848] leading-[19.28569984436035px]">Company Email</p>
                      <div className="flex justify-start items-center flex-row gap-[9px]">
                        <svg
                          width="20"
                          height="18"
                          viewBox="0 0 20 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M2.45148 2.31358C1.81896 2.90091 1.39535 3.85391 1.39535 5.34884V11.8605C1.39535 13.3553 1.81896 14.3084 2.45148 14.8957C3.09335 15.4917 4.06044 15.814 5.34884 15.814H14.6512C15.9395 15.814 16.9066 15.4917 17.5486 14.8957C18.181 14.3084 18.6047 13.3553 18.6047 11.8605V5.34884C18.6047 3.85391 18.181 2.90091 17.5486 2.31358C16.9066 1.71755 15.9395 1.39535 14.6512 1.39535H5.34884C4.06044 1.39535 3.09335 1.71755 2.45148 2.31358ZM1.50201 1.29107C2.48805 0.37547 3.84654 0 5.34884 0H14.6512C16.1535 0 17.512 0.37547 18.498 1.29107C19.4934 2.21537 20 3.58795 20 5.34884V11.8605C20 13.6214 19.4934 14.994 18.498 15.9182C17.512 16.8339 16.1535 17.2093 14.6512 17.2093H5.34884C3.84654 17.2093 2.48805 16.8339 1.50201 15.9182C0.506623 14.994 0 13.6214 0 11.8605V5.34884C0 3.58795 0.506623 2.21537 1.50201 1.29107Z"
                            fill="#064771"
                          />
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M16.8489 4.24183C17.0845 4.54672 17.0283 4.98488 16.7235 5.22047L11.5634 9.20773C10.6421 9.91954 9.35639 9.91954 8.43509 9.20773L3.27503 5.22047C2.97013 4.98488 2.91395 4.54672 3.14955 4.24183C3.38515 3.93693 3.8233 3.88075 4.1282 4.11635L9.28821 8.10354C9.707 8.42717 10.2915 8.42717 10.7102 8.10354L15.8703 4.11635C16.1752 3.88075 16.6133 3.93693 16.8489 4.24183Z"
                            fill="#064771"
                          />
                        </svg>
                        <div className="flex justify-start items-center flex-row gap-1.5">
                          <span className="text-[#064771] text-sm font-medium leading-[22px]">
                            {selectedPartnerDetails?.partner_overview?.company_email
                              ? selectedPartnerDetails.partner_overview.company_email.length > 30
                                ? `${selectedPartnerDetails.partner_overview.company_email.slice(
                                  0,
                                  30
                                )}...`
                                : selectedPartnerDetails.partner_overview.company_email
                              : 'N/A'}
                          </span>
                          <button>
                            <svg
                              width="13"
                              height="17"
                              viewBox="0 0 13 17"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12.4507 2.93149L10.9661 1.39814C10.7838 1.21091 10.5659 1.06198 10.3253 0.960077C10.0847 0.858171 9.82608 0.805342 9.56475 0.804688H6.5C5.75106 0.805633 5.02536 1.06475 4.44519 1.53835C3.86502 2.01196 3.46586 2.67111 3.315 3.40469H3.25C2.38836 3.40572 1.56231 3.74846 0.953043 4.35773C0.343773 4.967 0.00103211 5.79305 0 6.65469V13.1547C0.00103211 14.0163 0.343773 14.8424 0.953043 15.4516C1.56231 16.0609 2.38836 16.4037 3.25 16.4047H7.15C8.01163 16.4037 8.83769 16.0609 9.44695 15.4516C10.0562 14.8424 10.399 14.0163 10.4 13.1547V13.0897C11.1336 12.9388 11.7927 12.5397 12.2663 11.9595C12.7399 11.3793 12.9991 10.6536 13 9.90469V4.28869C13.001 3.78196 12.8039 3.29491 12.4507 2.93149ZM7.15 15.1047H3.25C2.73283 15.1047 2.23684 14.8992 1.87114 14.5335C1.50545 14.1678 1.3 13.6719 1.3 13.1547V6.65469C1.3 6.13751 1.50545 5.64152 1.87114 5.27583C2.23684 4.91013 2.73283 4.70469 3.25 4.70469V9.90469C3.25103 10.7663 3.59377 11.5924 4.20304 12.2016C4.81231 12.8109 5.63836 13.1537 6.5 13.1547H9.1C9.1 13.6719 8.89455 14.1678 8.52886 14.5335C8.16316 14.8992 7.66717 15.1047 7.15 15.1047ZM9.75 11.8547H6.5C5.98283 11.8547 5.48684 11.6492 5.12114 11.2835C4.75544 10.9178 4.55 10.4219 4.55 9.90469V4.05469C4.55 3.53751 4.75544 3.04152 5.12114 2.67583C5.48684 2.31013 5.98283 2.10469 6.5 2.10469H9.1V3.40469C9.1 3.74947 9.23696 4.08013 9.48076 4.32393C9.72456 4.56772 10.0552 4.70469 10.4 4.70469H11.7V9.90469C11.7 10.4219 11.4946 10.9178 11.1289 11.2835C10.7632 11.6492 10.2672 11.8547 9.75 11.8547Z"
                                fill="#4F4F4F"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex self-stretch justify-between items-center flex-row gap-2.5">
                      <p className="text-[#484848] leading-[19.28569984436035px]">Contact Number</p>
                      <div className="flex justify-start items-center flex-row gap-[9px]">
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 17 17"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.10327 0.878303C9.10327 0.701201 9.17727 0.531352 9.30899 0.406122C9.44071 0.280893 9.61936 0.210539 9.80564 0.210539C11.6678 0.212483 13.4531 0.916642 14.7698 2.16852C16.0866 3.4204 16.8272 5.11775 16.8293 6.88817C16.8293 7.06528 16.7553 7.23512 16.6235 7.36035C16.4918 7.48558 16.3132 7.55594 16.1269 7.55594C15.9406 7.55594 15.762 7.48558 15.6303 7.36035C15.4985 7.23512 15.4245 7.06528 15.4245 6.88817C15.4229 5.47185 14.8303 4.11399 13.777 3.11249C12.7236 2.111 11.2953 1.54766 9.80564 1.54607C9.61936 1.54607 9.44071 1.47571 9.30899 1.35048C9.17727 1.22525 9.10327 1.0554 9.10327 0.878303ZM9.80564 4.21712C10.5507 4.21712 11.2653 4.49853 11.7922 4.99945C12.3191 5.50037 12.6151 6.17977 12.6151 6.88817C12.6151 7.06528 12.6891 7.23512 12.8208 7.36035C12.9525 7.48558 13.1312 7.55594 13.3175 7.55594C13.5037 7.55594 13.6824 7.48558 13.8141 7.36035C13.9458 7.23512 14.0198 7.06528 14.0198 6.88817C14.0187 5.82589 13.5743 4.80742 12.7843 4.05627C11.9942 3.30512 10.923 2.88265 9.80564 2.88159C9.61936 2.88159 9.44071 2.95195 9.30899 3.07718C9.17727 3.20241 9.10327 3.37225 9.10327 3.54936C9.10327 3.72646 9.17727 3.89631 9.30899 4.02154C9.44071 4.14677 9.61936 4.21712 9.80564 4.21712ZM16.1922 11.3882C16.5992 11.7763 16.8278 12.3019 16.8278 12.85C16.8278 13.398 16.5992 13.9237 16.1922 14.3117L15.5531 15.0122C9.80072 20.2481 -4.19738 6.94293 1.22487 1.45659L2.03258 0.788822C2.4412 0.412656 2.98915 0.204562 3.55791 0.209561C4.12666 0.214559 4.67048 0.432249 5.07171 0.815533C5.09348 0.836233 6.39496 2.44354 6.39496 2.44354C6.78114 2.82926 6.99612 3.34163 6.9952 3.87416C6.99429 4.40668 6.77755 4.91839 6.39004 5.3029L5.57671 6.27517C6.02682 7.31495 6.68859 8.25993 7.52402 9.0558C8.35944 9.85167 9.35204 10.4828 10.4448 10.9128L11.4737 10.1348C11.8782 9.76671 12.4164 9.56089 12.9763 9.56015C13.5363 9.5594 14.075 9.76378 14.4806 10.1308C14.4806 10.1308 16.1705 11.3675 16.1922 11.3882ZM15.2258 12.3592C15.2258 12.3592 13.545 11.1298 13.5232 11.1091C13.3785 10.9727 13.183 10.8962 12.9793 10.8962C12.7755 10.8962 12.58 10.9727 12.4353 11.1091C12.4163 11.1278 10.9997 12.2009 10.9997 12.2009C10.9042 12.2731 10.7906 12.3205 10.67 12.3383C10.5494 12.3561 10.4261 12.3437 10.312 12.3024C8.8964 11.8013 7.61057 11.0168 6.54164 10.002C5.47271 8.98724 4.64566 7.7659 4.1165 6.42074C4.06958 6.31086 4.05428 6.19109 4.07218 6.07373C4.09008 5.95637 4.14053 5.84566 4.21834 5.75298C4.21834 5.75298 5.34704 4.40543 5.366 4.38807C5.50947 4.2505 5.58997 4.06461 5.58997 3.87088C5.58997 3.67716 5.50947 3.49127 5.366 3.3537C5.34423 3.33367 4.05118 1.73438 4.05118 1.73438C3.90431 1.60917 3.71264 1.54212 3.51545 1.54697C3.31825 1.55181 3.13048 1.62818 2.99061 1.76042L2.18289 2.42818C-1.77984 6.95829 10.3507 17.8515 14.5262 14.1L15.1661 13.3989C15.316 13.2668 15.4061 13.0845 15.4172 12.8905C15.4284 12.6965 15.3597 12.5059 15.2258 12.3592Z"
                            fill="#064771"
                          />
                        </svg>
                        <div className="flex justify-start items-center flex-row gap-1.5">
                          <span className="text-[#064771] text-sm font-medium leading-[22px]">
                            {selectedPartnerDetails?.partner_overview?.company_phone
                              ? selectedPartnerDetails.partner_overview.company_phone.length > 30
                                ? `${selectedPartnerDetails.partner_overview.company_phone.slice(
                                  0,
                                  30
                                )}...`
                                : selectedPartnerDetails.partner_overview.company_phone
                              : 'N/A'}
                          </span>
                          <button>
                            <svg
                              width="13"
                              height="17"
                              viewBox="0 0 13 17"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12.4507 2.93149L10.9661 1.39814C10.7838 1.21091 10.5659 1.06198 10.3253 0.960077C10.0847 0.858171 9.82608 0.805342 9.56475 0.804688H6.5C5.75106 0.805633 5.02536 1.06475 4.44519 1.53835C3.86502 2.01196 3.46586 2.67111 3.315 3.40469H3.25C2.38836 3.40572 1.56231 3.74846 0.953043 4.35773C0.343773 4.967 0.00103211 5.79305 0 6.65469V13.1547C0.00103211 14.0163 0.343773 14.8424 0.953043 15.4516C1.56231 16.0609 2.38836 16.4037 3.25 16.4047H7.15C8.01163 16.4037 8.83769 16.0609 9.44695 15.4516C10.0562 14.8424 10.399 14.0163 10.4 13.1547V13.0897C11.1336 12.9388 11.7927 12.5397 12.2663 11.9595C12.7399 11.3793 12.9991 10.6536 13 9.90469V4.28869C13.001 3.78196 12.8039 3.29491 12.4507 2.93149ZM7.15 15.1047H3.25C2.73283 15.1047 2.23684 14.8992 1.87114 14.5335C1.50545 14.1678 1.3 13.6719 1.3 13.1547V6.65469C1.3 6.13751 1.50545 5.64152 1.87114 5.27583C2.23684 4.91013 2.73283 4.70469 3.25 4.70469V9.90469C3.25103 10.7663 3.59377 11.5924 4.20304 12.2016C4.81231 12.8109 5.63836 13.1537 6.5 13.1547H9.1C9.1 13.6719 8.89455 14.1678 8.52886 14.5335C8.16316 14.8992 7.66717 15.1047 7.15 15.1047ZM9.75 11.8547H6.5C5.98283 11.8547 5.48684 11.6492 5.12114 11.2835C4.75544 10.9178 4.55 10.4219 4.55 9.90469V4.05469C4.55 3.53751 4.75544 3.04152 5.12114 2.67583C5.48684 2.31013 5.98283 2.10469 6.5 2.10469H9.1V3.40469C9.1 3.74947 9.23696 4.08013 9.48076 4.32393C9.72456 4.56772 10.0552 4.70469 10.4 4.70469H11.7V9.90469C11.7 10.4219 11.4946 10.9178 11.1289 11.2835C10.7632 11.6492 10.2672 11.8547 9.75 11.8547Z"
                                fill="#4F4F4F"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex self-stretch justify-between items-center flex-row gap-3.5">
                      <p className="text-[#484848] leading-[19.28569984436035px]">
                        Partner’s Website
                      </p>
                      <div className="flex justify-start items-center flex-row gap-2">
                        <div className="flex justify-start items-center flex-row gap-1.5">
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 17 17"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9.27515 0.878303C9.27515 0.701201 9.34915 0.531352 9.48087 0.406122C9.61258 0.280893 9.79123 0.210539 9.97751 0.210539C11.8397 0.212483 13.625 0.916642 14.9417 2.16852C16.2585 3.4204 16.9991 5.11775 17.0011 6.88817C17.0011 7.06528 16.9271 7.23512 16.7954 7.36035C16.6637 7.48558 16.4851 7.55594 16.2988 7.55594C16.1125 7.55594 15.9339 7.48558 15.8021 7.36035C15.6704 7.23512 15.5964 7.06528 15.5964 6.88817C15.5947 5.47185 15.0022 4.11399 13.9488 3.11249C12.8954 2.111 11.4672 1.54766 9.97751 1.54607C9.79123 1.54607 9.61258 1.47571 9.48087 1.35048C9.34915 1.22525 9.27515 1.0554 9.27515 0.878303ZM9.97751 4.21712C10.7226 4.21712 11.4372 4.49853 11.9641 4.99945C12.491 5.50037 12.787 6.17977 12.787 6.88817C12.787 7.06528 12.861 7.23512 12.9927 7.36035C13.1244 7.48558 13.303 7.55594 13.4893 7.55594C13.6756 7.55594 13.8543 7.48558 13.986 7.36035C14.1177 7.23512 14.1917 7.06528 14.1917 6.88817C14.1906 5.82589 13.7462 4.80742 12.9562 4.05627C12.1661 3.30512 11.0948 2.88265 9.97751 2.88159C9.79123 2.88159 9.61258 2.95195 9.48087 3.07718C9.34915 3.20241 9.27515 3.37225 9.27515 3.54936C9.27515 3.72646 9.34915 3.89631 9.48087 4.02154C9.61258 4.14677 9.79123 4.21712 9.97751 4.21712ZM16.3641 11.3882C16.7711 11.7763 16.9997 12.3019 16.9997 12.85C16.9997 13.398 16.7711 13.9237 16.3641 14.3117L15.7249 15.0122C9.97259 20.2481 -4.0255 6.94293 1.39674 1.45659L2.20446 0.788822C2.61307 0.412656 3.16103 0.204562 3.72978 0.209561C4.29854 0.214559 4.84236 0.432249 5.24358 0.815533C5.26536 0.836233 6.56684 2.44354 6.56684 2.44354C6.95302 2.82926 7.16799 3.34163 7.16708 3.87416C7.16616 4.40668 6.94942 4.91839 6.56192 5.3029L5.74858 6.27517C6.19869 7.31495 6.86047 8.25993 7.69589 9.0558C8.53131 9.85167 9.52391 10.4828 10.6167 10.9128L11.6456 10.1348C12.0501 9.76671 12.5882 9.56089 13.1482 9.56015C13.7081 9.5594 14.2469 9.76378 14.6524 10.1308C14.6524 10.1308 16.3423 11.3675 16.3641 11.3882ZM15.3976 12.3592C15.3976 12.3592 13.7169 11.1298 13.6951 11.1091C13.5504 10.9727 13.3549 10.8962 13.1511 10.8962C12.9474 10.8962 12.7519 10.9727 12.6072 11.1091C12.5882 11.1278 11.1715 12.2009 11.1715 12.2009C11.0761 12.2731 10.9624 12.3205 10.8419 12.3383C10.7213 12.3561 10.5979 12.3437 10.4839 12.3024C9.06827 11.8013 7.78244 11.0168 6.71351 10.002C5.64459 8.98724 4.81753 7.7659 4.28837 6.42074C4.24145 6.31086 4.22616 6.19109 4.24405 6.07373C4.26195 5.95637 4.3124 5.84566 4.39021 5.75298C4.39021 5.75298 5.51891 4.40543 5.53787 4.38807C5.68134 4.2505 5.76184 4.06461 5.76184 3.87088C5.76184 3.67716 5.68134 3.49127 5.53787 3.3537C5.5161 3.33367 4.22305 1.73438 4.22305 1.73438C4.07619 1.60917 3.88451 1.54212 3.68732 1.54697C3.49013 1.55181 3.30235 1.62818 3.16248 1.76042L2.35477 2.42818C-1.60797 6.95829 10.5225 17.8515 14.6981 14.1L15.3379 13.3989C15.4879 13.2668 15.5779 13.0845 15.5891 12.8905C15.6002 12.6965 15.5316 12.5059 15.3976 12.3592Z"
                              fill="#064771"
                            />
                          </svg>
                          <span className="text-[#064771] text-sm font-medium leading-[22px]">
                            {selectedPartnerDetails?.partner_overview?.website
                              ? selectedPartnerDetails.partner_overview.website.length > 30
                                ? `${selectedPartnerDetails.partner_overview.website.slice(
                                  0,
                                  30
                                )}...`
                                : selectedPartnerDetails.partner_overview.website
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-start items-center flex-row gap-2.5">
                          <div className="flex justify-start items-center flex-row gap-2.5">
                            <button>
                              <svg
                                width="13"
                                height="16"
                                viewBox="0 0 13 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12.4507 2.53647L10.9661 1.00312C10.7838 0.815895 10.5659 0.666964 10.3253 0.565058C10.0847 0.463152 9.82608 0.410322 9.56475 0.409668H6.5C5.75106 0.410613 5.02536 0.669726 4.44519 1.14333C3.86502 1.61694 3.46586 2.27609 3.315 3.00967H3.25C2.38836 3.0107 1.56231 3.35344 0.953043 3.96271C0.343773 4.57198 0.00103211 5.39803 0 6.25967V12.7597C0.00103211 13.6213 0.343773 14.4474 0.953043 15.0566C1.56231 15.6659 2.38836 16.0086 3.25 16.0097H7.15C8.01163 16.0086 8.83769 15.6659 9.44695 15.0566C10.0562 14.4474 10.399 13.6213 10.4 12.7597V12.6947C11.1336 12.5438 11.7927 12.1446 12.2663 11.5645C12.7399 10.9843 12.9991 10.2586 13 9.50967V3.89367C13.001 3.38694 12.8039 2.89989 12.4507 2.53647ZM7.15 14.7097H3.25C2.73283 14.7097 2.23684 14.5042 1.87114 14.1385C1.50545 13.7728 1.3 13.2768 1.3 12.7597V6.25967C1.3 5.74249 1.50545 5.2465 1.87114 4.88081C2.23684 4.51511 2.73283 4.30967 3.25 4.30967V9.50967C3.25103 10.3713 3.59377 11.1974 4.20304 11.8066C4.81231 12.4159 5.63836 12.7586 6.5 12.7597H9.1C9.1 13.2768 8.89455 13.7728 8.52886 14.1385C8.16316 14.5042 7.66717 14.7097 7.15 14.7097ZM9.75 11.4597H6.5C5.98283 11.4597 5.48684 11.2542 5.12114 10.8885C4.75544 10.5228 4.55 10.0268 4.55 9.50967V3.65967C4.55 3.14249 4.75544 2.64651 5.12114 2.28081C5.48684 1.91511 5.98283 1.70967 6.5 1.70967H9.1V3.00967C9.1 3.35445 9.23696 3.68511 9.48076 3.92891C9.72456 4.1727 10.0552 4.30967 10.4 4.30967H11.7V9.50967C11.7 10.0268 11.4946 10.5228 11.1289 10.8885C10.7632 11.2542 10.2672 11.4597 9.75 11.4597Z"
                                  fill="#4F4F4F"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex self-stretch justify-start items-center flex-row gap-2.5 h-[93px]">
                      <p className="text-[#484848] leading-[19.28569984436035px]">HQ Address</p>
                      <span className="text-[#30313D] text-right font-medium leading-normal ml-auto">
                        {selectedPartnerDetails?.partner_overview?.hq_address
                          ? selectedPartnerDetails.partner_overview.hq_address.length > 30
                            ? `${selectedPartnerDetails.partner_overview.hq_address.slice(
                              0,
                              30
                            )}...`
                            : selectedPartnerDetails.partner_overview.hq_address
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none ml-[94px] text-nowrap ">
            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
              Contact Person
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
            <div
              className="flex justify-start items-start flex-col gap-10 w-[377px]"
              style={{ width: '377px' }}
            >
              <div className="flex self-stretch justify-start items-start flex-col gap-6">
                <div className="flex self-stretch justify-start items-center flex-row gap-[13px]">
                  <div
                    className="flex justify-start items-start flex-col gap-[9px] w-[173px]"
                    style={{ width: '173px' }}
                  >
                    <p className="self-stretch text-[#838383] text-sm">Contact Person</p>
                    <div className="flex self-stretch justify-start items-start flex-row gap-[9px]">
                      <span className="text-[#30313D] text-lg font-medium">
                        {selectedPartnerDetails?.partner_overview?.contact_person_name ?? 'N/A'}
                      </span>
                      <div
                        className="flex justify-center items-center flex-col gap-[4.81751823425293px] py-[4.335766315460205px] px-[14.934307098388672px] bg-[#064771] rounded-[4.335766315460205px] w-[93px]"
                        style={{ width: '93px' }}
                      >
                        <div className="flex justify-start items-start flex-row gap-[4.81751823425293px]">
                          <span className="text-[#FFFFFF] text-[13.676398277282715px] font-semibold leading-[19.53771209716797px]">
                            Key Person
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex self-stretch justify-start items-start flex-col gap-6">
                  <div className="flex self-stretch justify-start items-start flex-col gap-2.5">
                    <div className="flex justify-start items-center flex-row gap-2.5">
                      <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                        Designation/Position
                      </span>
                    </div>
                    <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                      <span className="text-[#064771] text-sm font-medium leading-[22px]">
                        {selectedPartnerDetails?.partner_overview?.contact_person_position ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex self-stretch justify-start items-start flex-col gap-2.5">
                    <div className="flex justify-start items-center flex-row gap-2.5">
                      <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                        Person’s Contact Emails
                      </span>
                      <svg
                        width="12"
                        height="15"
                        viewBox="0 0 12 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.6949 2.70773L9.41964 1.39062C9.26302 1.2298 9.07587 1.10187 8.86917 1.01434C8.66246 0.9268 8.44035 0.881421 8.21587 0.880859H5.58333C4.94002 0.881671 4.31665 1.10424 3.8183 1.51106C3.31995 1.91788 2.97709 2.48406 2.8475 3.11419H2.79167C2.05154 3.11508 1.34199 3.40948 0.818639 3.93283C0.295292 4.45618 0.000886554 5.16573 0 5.90586V11.4892C0.000886554 12.2293 0.295292 12.9389 0.818639 13.4622C1.34199 13.9856 2.05154 14.28 2.79167 14.2809H6.14166C6.88179 14.28 7.59134 13.9856 8.11469 13.4622C8.63804 12.9389 8.93244 12.2293 8.93333 11.4892V11.4334C9.56346 11.3038 10.1296 10.9609 10.5365 10.4626C10.9433 9.9642 11.1659 9.34084 11.1667 8.69752V3.87352C11.1675 3.43826 10.9982 3.0199 10.6949 2.70773ZM6.14166 13.1642H2.79167C2.34743 13.1642 1.92139 12.9877 1.60726 12.6736C1.29314 12.3595 1.11667 11.9334 1.11667 11.4892V5.90586C1.11667 5.46162 1.29314 5.03558 1.60726 4.72145C1.92139 4.40733 2.34743 4.23086 2.79167 4.23086V8.69752C2.79255 9.43765 3.08696 10.1472 3.61031 10.6705C4.13365 11.1939 4.84321 11.4883 5.58333 11.4892H7.81666C7.81666 11.9334 7.64019 12.3595 7.32607 12.6736C7.01195 12.9877 6.5859 13.1642 6.14166 13.1642ZM8.375 10.3725H5.58333C5.13909 10.3725 4.71305 10.196 4.39893 9.88193C4.0848 9.5678 3.90833 9.14176 3.90833 8.69752V3.67252C3.90833 3.22829 4.0848 2.80224 4.39893 2.48812C4.71305 2.174 5.13909 1.99753 5.58333 1.99753H7.81666V3.11419C7.81666 3.41035 7.93431 3.69438 8.14373 3.90379C8.35314 4.11321 8.63717 4.23086 8.93333 4.23086H10.05V8.69752C10.05 9.14176 9.87352 9.5678 9.5594 9.88193C9.24528 10.196 8.81923 10.3725 8.375 10.3725Z"
                          fill="#838383"
                        />
                      </svg>
                    </div>
                    <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                      <svg
                        width="15"
                        height="13"
                        viewBox="0 0 15 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.875 0.28125H3.125C2.2965 0.282116 1.50222 0.569731 0.916387 1.08101C0.330551 1.59228 0.000992411 2.28547 0 3.00852L0 9.55398C0.000992411 10.277 0.330551 10.9702 0.916387 11.4815C1.50222 11.9928 2.2965 12.2804 3.125 12.2812H11.875C12.7035 12.2804 13.4978 11.9928 14.0836 11.4815C14.6695 10.9702 14.999 10.277 15 9.55398V3.00852C14.999 2.28547 14.6695 1.59228 14.0836 1.08101C13.4978 0.569731 12.7035 0.282116 11.875 0.28125ZM3.125 1.37216H11.875C12.2492 1.3728 12.6147 1.47117 12.9243 1.6546C13.234 1.83803 13.4737 2.09813 13.6125 2.40143L8.82625 6.57907C8.47402 6.88524 7.99714 7.05714 7.5 7.05714C7.00287 7.05714 6.52598 6.88524 6.17375 6.57907L1.3875 2.40143C1.52634 2.09813 1.76601 1.83803 2.07565 1.6546C2.3853 1.47117 2.75076 1.3728 3.125 1.37216ZM11.875 11.1903H3.125C2.62772 11.1903 2.15081 11.0179 1.79917 10.7111C1.44754 10.4042 1.25 9.98797 1.25 9.55398V3.8267L5.29 7.35034C5.87664 7.86103 6.67141 8.14782 7.5 8.14782C8.32859 8.14782 9.12336 7.86103 9.71 7.35034L13.75 3.8267V9.55398C13.75 9.98797 13.5525 10.4042 13.2008 10.7111C12.8492 11.0179 12.3723 11.1903 11.875 11.1903Z"
                          fill="#064771"
                        />
                      </svg>
                      <span className="text-[#064771] text-sm font-medium leading-[22px]">
                        {selectedPartnerDetails?.partner_overview?.contact_person_email ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex self-stretch justify-start items-start flex-col gap-2.5">
                    <div className="flex justify-start items-center flex-row gap-2.5">
                      <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                        Person’s Contact
                      </span>
                      <svg
                        width="12"
                        height="14"
                        viewBox="0 0 12 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.6949 2.10812L9.41964 0.791008C9.26302 0.630189 9.07587 0.502261 8.86917 0.414726C8.66246 0.327191 8.44035 0.281812 8.21587 0.28125H5.58333C4.94002 0.282062 4.31665 0.504634 3.8183 0.911451C3.31995 1.31827 2.97709 1.88445 2.8475 2.51458H2.79167C2.05154 2.51547 1.34199 2.80987 0.818639 3.33322C0.295292 3.85657 0.000886554 4.56612 0 5.30625V10.8896C0.000886554 11.6297 0.295292 12.3393 0.818639 12.8626C1.34199 13.386 2.05154 13.6804 2.79167 13.6812H6.14166C6.88179 13.6804 7.59134 13.386 8.11469 12.8626C8.63804 12.3393 8.93244 11.6297 8.93333 10.8896V10.8337C9.56346 10.7042 10.1296 10.3613 10.5365 9.86294C10.9433 9.36459 11.1659 8.74123 11.1667 8.09791V3.27392C11.1675 2.83865 10.9982 2.42029 10.6949 2.10812ZM6.14166 12.5646H2.79167C2.34743 12.5646 1.92139 12.3881 1.60726 12.074C1.29314 11.7599 1.11667 11.3338 1.11667 10.8896V5.30625C1.11667 4.86201 1.29314 4.43597 1.60726 4.12184C1.92139 3.80772 2.34743 3.63125 2.79167 3.63125V8.09791C2.79255 8.83804 3.08696 9.54759 3.61031 10.0709C4.13365 10.5943 4.84321 10.8887 5.58333 10.8896H7.81666C7.81666 11.3338 7.64019 11.7599 7.32607 12.074C7.01195 12.3881 6.5859 12.5646 6.14166 12.5646ZM8.375 9.77291H5.58333C5.13909 9.77291 4.71305 9.59644 4.39893 9.28232C4.0848 8.96819 3.90833 8.54215 3.90833 8.09791V3.07292C3.90833 2.62868 4.0848 2.20264 4.39893 1.88851C4.71305 1.57439 5.13909 1.39792 5.58333 1.39792H7.81666V2.51458C7.81666 2.81074 7.93431 3.09477 8.14373 3.30418C8.35314 3.5136 8.63717 3.63125 8.93333 3.63125H10.05V8.09791C10.05 8.54215 9.87352 8.96819 9.5594 9.28232C9.24528 9.59644 8.81923 9.77291 8.375 9.77291Z"
                          fill="#838383"
                        />
                      </svg>
                    </div>
                    <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                      <span className="text-[#064771] text-sm leading-[22px]">
                        {selectedPartnerDetails?.partner_overview?.contact_person_phone ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
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
                onClick={() => setActiveTab('financial-details')}
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
                  onClick={() => setActiveTab('attachments')}
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
  } else {
    return (
      <div className="ml-3 font-poppins pdf-container ">
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
              <span className="text-[#064771] text-sm font-semibold leading-[15px] text-nowrap mt-[-20px] ml-[30px] ">
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
                          onClick={() => handleCopyLinkExample(id)}
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
                      className="flex justify-start items-center flex-row gap-[7.1049323081970215px] w-[202px] h-[23px]"
                      style={{ width: '202px' }}
                    >
                      <button
                        onClick={handleDownloadPDF}
                        className="flex justify-center items-center flex-row gap-[3.044971227645874px] py-[3.5524661540985107px] px-[5.647058963775635px] bg-[#F1FBFF] border-solid border-[#064771] border-[0.3529411852359772px] rounded-[35.16731643676758px] h-[24px]"
                        style={{ width: '114px' }}
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
                      <button
                        className="flex justify-center items-center flex-row gap-[3.044971227645874px] py-[3.5524661540985107px] px-[5.647058963775635px] bg-[#FFFFFF] rounded-[35.16731643676758px] w-[82px] h-[24px]"
                        style={{ width: '82px' }}
                        onClick={() => {
                          navigate(`/prospects/edit-investor/${id}`);
                        }}
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
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-[70px] mt-[54px]">
          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none">
            <p className="self-stretch text-[#064771] text-lg font-medium leading-5">
              Partnership Affiliation for This Project ?
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

            <div
              className="flex justify-between items-start flex-col gap-[71px] w-[560px] h-[350px] text-nowrap"
              style={{ width: '560px' }}
            >
              <div className="flex self-stretch justify-start items-start flex-col gap-[41px]">
                <div
                  className="flex justify-start items-start flex-col gap-3.5 w-[560px]"
                  style={{ width: '560px' }}
                >
                  <div
                    className="flex justify-start items-start flex-col gap-3.5 w-[586px]"
                    style={{ width: '586px' }}
                  ></div>
                  <p className="self-stretch text-[#000000] text-sm">
                    This project is independently managed by our team and the operates without any{' '}
                    <br />
                    affiliation or association with external entities.
                  </p>
                </div>
              </div>

              <div className="ml-7 mt-[-700px]">
                <div className="flex justify-between items-center flex-row gap-[916px]">
                  <div
                    className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[93px] h-[34px]"
                    style={{ width: '93px' }}
                  ></div>

                  <div className="flex justify-start items-center flex-row gap-4 mx-auto w-fit ml-[-350px]">
                    <button
                      className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#064771] rounded-[49.82036209106445px] h-[34px] "
                      onClick={() => setActiveTab('financial-details')}
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
                        onClick={() => setActiveTab('attachments')}
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
  }
};

export default PartnershipDetails;
