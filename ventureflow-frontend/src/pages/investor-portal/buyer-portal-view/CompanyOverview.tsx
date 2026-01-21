import React, { useState, useEffect } from 'react';
import api from '../../../config/api';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTabStore } from './store/tabStore';
import { showAlert } from '../../../components/Alert';
import html2pdf from 'html2pdf.js';

const CompanyOverview: React.FC = () => {
  const handleDownloadPDF = async () => {
    const element = document.querySelector('.pdf-container') as HTMLElement;
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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const navigate = useNavigate();

  const [companyInfo, setCompanyInfo] = useState<any>({
    company_title: '',
    origin_country_flag_svg: '',
    rating: '',
    company_type: '',
    status: '',
    origin_country: '',
    company_registered_name: '',
    year_founded: '',
    operational_countries_customer_base: '',
    full_time_employee_counts: '',
    company_email: '',
    contact_number: '',
    hq_address: '',
    reason_for_mna: '',
    potential_synergies: '',
    project_start_date: '',
    expected_transaction_timeline: '',
    tcf_person_in_charge: '',
    contact_person_name: '',
    designation_position: '',
    email_address: '',
    contact_person_contact_number: '',
    shareholders: [],
    description: '',
    buyer_id: '',
    details: '',
    image_url: '',
    website: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    youtube: '',
    updated_at: '',
    industry_ops: [],
    no_pic_needed: false,
  });

  const [focusedIndustries, setFocusedIndustries] = useState<string[]>([]);

  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        const response = await api.get(`/api/buyer/${id}`);
        const buyerData = response.data?.data || {};
        const overview = buyerData.company_overview || {};
        const target_preference = buyerData.target_preference || {};



        const prefs = target_preference?.b_ind_prefs;


        if (prefs) {
          try {
            const parsed = JSON.parse(prefs);
            if (Array.isArray(parsed)) {
              const industryNames = parsed.map((item: any) => item?.name).filter(Boolean);
              setFocusedIndustries(industryNames);
            }
          } catch {
            console.error("Failed to parse b_ind_prefs", prefs);
          }
        }

        setCompanyInfo({
          image_url: buyerData.image || '',
          company_title: overview.reg_name || '',
          origin_country_flag_svg: overview.origin_country_flag_svg || '',
          rating: overview.rating || '',
          details: overview.details || '',
          company_type: overview.company_type || '',
          status: overview.status || '',
          origin_country: overview.hq_country || '',
          company_registered_name: overview.reg_name || '',
          year_founded: overview.year_founded || '',
          industry_ops: overview.main_industry_operations || [],
          operational_countries_customer_base: target_preference.target_countries || '',
          full_time_employee_counts: overview.emp_count || '',
          company_email: overview.email || '',
          contact_number: overview.phone || '',
          hq_address: overview.hq_address || '',
          reason_for_mna: overview.reason_ma || '',
          potential_synergies: overview.potential_synergies || '',
          project_start_date: overview.proj_start_date || '',
          expected_transaction_timeline: overview.txn_timeline || '',
          tcf_person_in_charge: overview.incharge_name || '',
          contact_person_name: overview.seller_contact_name || '',
          designation_position: overview.seller_designation || '',
          email_address: overview.seller_email || '',
          contact_person_contact_number: overview.phone || '',
          shareholders: Array.isArray(overview.shareholder_name) ? overview.shareholder_name : [],
          description: overview.details || '',
          website: overview.website || '',
          linkedin: overview.linkedin || '',
          twitter: overview.twitter || '',
          facebook: overview.facebook || '',
          instagram: overview.instagram || '',
          youtube: overview.youtube || '',
          buyer_id: response.data.data.buyer_id || '',
          updated_at: response.data.data.updated_at || '',
          no_pic_needed: overview.no_pic_needed || false,
        });
      } catch {
        showAlert({ type: "error", message: "Failed to fetch buyer" });
      }
    };

    if (id) {
      fetchBuyer();
    }
  }, [id]);





  const Icon = () => (
    <svg width="26" height="27" viewBox="0 0 26 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="0.302326"
        y="0.511798"
        width="25.3953"
        height="25.3953"
        rx="12.3953"
        fill="#064771"
      />
      <rect
        x="0.302326"
        y="0.511798"
        width="25.3953"
        height="25.3953"
        rx="12.3953"
        stroke="#CBD5E1"
        strokeWidth="0.604651"
      />
      <path
        d="M13.0001 13.2091C14.9174 13.2091 16.4767 11.6498 16.4767 9.73246C16.4767 7.81511 14.9174 6.25586 13.0001 6.25586C11.0827 6.25586 9.52346 7.81511 9.52346 9.73246C9.52346 11.6498 11.0827 13.2091 13.0001 13.2091ZM13.0001 7.41473C14.2783 7.41473 15.3178 8.45423 15.3178 9.73246C15.3178 11.0107 14.2783 12.0502 13.0001 12.0502C11.7218 12.0502 10.6823 11.0107 10.6823 9.73246C10.6823 8.45423 11.7218 7.41473 13.0001 7.41473ZM18.215 19.5828C18.215 19.9027 17.9559 20.1623 17.6355 20.1623C17.3151 20.1623 17.0561 19.9027 17.0561 19.5828C17.0561 17.8335 15.9407 16.3438 14.3855 15.7759L13.5065 17.0947L14.1398 19.4067C14.2458 19.7926 13.9051 20.1628 13.4439 20.1628H12.5562C12.095 20.1628 11.7549 19.7926 11.8603 19.4067L12.4936 17.0947L11.6146 15.7759C10.0594 16.3438 8.94402 17.8335 8.94402 19.5834C8.94402 19.9032 8.68444 20.1628 8.36459 20.1628C8.04474 20.1628 7.78516 19.9032 7.78516 19.5834C7.78516 16.7083 10.1249 14.3685 13.0001 14.3685C15.8752 14.3685 18.215 16.7077 18.215 19.5828Z"
        fill="white"
      />
    </svg>
  );

  const [countries, setCountries] = useState<any[]>([]);
  useEffect(() => {
    api
      .get('/api/countries')
      .then((res) => {
        setCountries(res.data);
      })
      .catch(() => showAlert({ type: "error", message: "Failed to fetch countries" }));
  }, []);

  const getCountryById = (id: number) => countries.find((c) => c.id === id);

  const countryData = getCountryById(parseInt(companyInfo.origin_country));

  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    api
      .get('/api/employees/fetch')
      .then((res) => {
        setEmployees(res.data);
      })
      .catch(() => showAlert({ type: "error", message: "Failed to fetch employees" }));
  }, []);

  const getEmployeeById = (id: number) => employees.find((e) => e.id === id);

  const employeeData = getEmployeeById(parseInt(companyInfo.tcf_person_in_charge));

  const [employee, setEmployee] = useState<any>({});
  useEffect(() => {
    const personInChargeId = companyInfo?.tcf_person_in_charge;
    if (!personInChargeId) {
      setEmployee({});
      return;
    }

    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/api/employees/${personInChargeId}`);
        setEmployee(response.data);
      } catch (err) {
        // Hide 404s since some older records may reference missing employees
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status !== 404) {
          showAlert({ type: "error", message: "Failed to fetch employee" });
        }
        setEmployee({});
      }
    };

    fetchEmployee();
  }, [companyInfo?.tcf_person_in_charge]);

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
      <div className="flex gap-[73px] w-[1316px] mt-[50px]">
        <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none ">
          <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
            Buyer&apos;s Business Overview
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

          <div className="self-stretch text-[#30313D] text-justify mt-[24px]">
            {companyInfo?.details ? (
              <div dangerouslySetInnerHTML={{ __html: companyInfo.details }} />
            ) : (
              'N/A'
            )}
          </div>
        </div>

        <div className="pt-12">
          <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins mb-[18px]">
            Business Overview
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

          <div className="flex  w-[680px]  mt-[25px]">
            <div className=" w-[680px]">
              <div className="">
                <div className="flex self-stretch justify-start items-center flex-row gap-x-10">
                  <p className="text-[#484848] leading-[19.28569984436035px] text-nowrap">
                    Company Registered Name
                  </p>
                  <p className="text-[#30313D] font-medium leading-normal ml-[110px]">
                    {companyInfo?.company_registered_name || 'N/A'}
                  </p>
                </div>

                <div className="flex self-stretch justify-start items-center flex-row gap-x-10 mt-[40px]">
                  <p className="text-[#484848] leading-[19.28569984436035px]">Year Founded</p>
                  <p className="text-[#30313D] font-medium leading-normal ml-[225px]">
                    {companyInfo?.year_founded || 'N/A'}
                  </p>
                </div>

                <div className="flex self-stretch justify-start items-center flex-row gap-x-10 mt-[40px]">
                  <p className="text-[#484848] leading-[19.28569984436035px]">
                    Full Time Employee Counts (FTE)
                  </p>
                  <p className="text-[#30313D] font-medium leading-normal ml-[70px]">
                    {companyInfo?.full_time_employee_counts || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex self-stretch justify-start items-center flex-row gap-2.5 mt-[40px]">
                <p className="text-[#484848] leading-[19.29px] text-nowrap">
                  Broader Industry Operations
                </p>

                <div className="flex flex-col gap-2 w-[401px] ml-[125px]">
                  <div className="flex flex-wrap gap-4">
                    {Array.isArray(companyInfo?.industry_ops) && companyInfo.industry_ops.flatMap((industry: any) => {
                      if (!industry?.name) return [];
                      return industry.name.split(',').map((name: string, index: number) => (
                        <div
                          key={`${industry.id}-${index}`}
                          className="flex justify-center items-center gap-2.5 py-1.5 px-[7px] border border-solid rounded-[49px] h-[32px] text-sm font-medium leading-4 bg-white text-[#064771] border-[#064771]"
                        >
                          {name.trim()}
                        </div>
                      ));
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-start items-center gap-2.5 mt-[30px] text-nowrap">
                <p className="text-[#484848] leading-[19.29px]">Focused Industry</p>

                <div className="w-[301px] ml-[215px]">
                  <div className="flex flex-wrap gap-4">
                    {focusedIndustries.map((industry) => {
                      return (
                        <div
                          key={industry}
                          className="flex justify-center items-center gap-2.5 py-1.5 px-[7px] rounded-[49px] h-[32px] text-sm font-medium leading-4 whitespace-nowrap  text-white bg-[#064771]"
                        >
                          {industry}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-[60px]">
                <div className="flex self-stretch justify-start items-center flex-row gap-x-10">
                  <p className="text-[#484848] leading-[19.28569984436035px]">Reason for M&A</p>
                  <p className="text-[#30313D] font-medium leading-normal ml-[200px]">
                    {companyInfo?.reason_for_mna || 'N/A'}
                  </p>
                </div>

                <div className="flex self-stretch justify-start items-center flex-row gap-x-10 mt-[40px]">
                  <p className="text-[#484848] leading-[19.28569984436035px]">
                    Potential Synergies
                  </p>
                  <div className="ml-[240px] flex flex-wrap gap-2 ">
                    {(() => {
                      let countries = companyInfo?.operational_countries_customer_base;

                      if (typeof countries === 'string') {
                        try {
                          countries = JSON.parse(countries);
                        } catch {
                          return <p className="text-[#30313D] font-medium">N/A</p>;
                        }
                      }

                      return Array.isArray(countries) && countries.length > 0 ? (
                        countries.map((country) => (
                          <div
                            key={country.id}
                            className="flex justify-start items-center flex-row gap-1 px-2 py-1 rounded-md bg-[#E6F1F9] w-fit"
                          >
                            <img
                              src={country.flagSrc}
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

                <div className="flex self-stretch justify-start items-center flex-row gap-x-10 mt-[40px]">
                  <p className="text-[#484848] leading-[19.28569984436035px]">Project Start Date</p>

                  <div className="flex items-center gap-3 p-[10px_20px_10px_20px] bg-white border border-gray-300 rounded-md w-full sm:w-80 md:w-96 lg:w-[300px] ml-[190px]">
                    <div className="flex justify-start items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="17"
                        height="16"
                        viewBox="0 0 17 16"
                        fill="none"
                      >
                        <path
                          d="M11.8897 6.63053C9.27323 6.63053 7.14355 8.70443 7.14355 11.2539C7.14355 13.7888 9.27323 15.8514 11.8897 15.8514C14.5062 15.8514 16.6359 13.7776 16.6359 11.2281C16.6359 8.6932 14.5062 6.63053 11.8897 6.63053ZM11.8897 14.5305C10.0204 14.5305 8.49961 13.0603 8.49961 11.2539C8.49961 9.43293 10.0204 7.95148 11.8897 7.95148C13.7591 7.95148 15.2799 9.42171 15.2799 11.2281C15.2799 13.049 13.7591 14.5305 11.8897 14.5305ZM13.0471 11.4216C13.3122 11.6799 13.3122 12.0973 13.0471 12.3555C12.9149 12.4843 12.7413 12.5491 12.5678 12.5491C12.3942 12.5491 12.2206 12.4843 12.0884 12.3555L11.4104 11.6951C11.2829 11.5709 11.2117 11.4031 11.2117 11.2281V9.90716C11.2117 9.54257 11.5148 9.24668 11.8897 9.24668C12.2647 9.24668 12.5678 9.54257 12.5678 9.90716V10.9547L13.0471 11.4216ZM16.6359 4.62334V5.94429C16.6359 6.30888 16.3329 6.60477 15.9579 6.60477C15.583 6.60477 15.2799 6.30888 15.2799 5.94429V4.62334C15.2799 3.53091 14.3673 2.64191 13.2458 2.64191H3.75342C2.63196 2.64191 1.71934 3.53091 1.71934 4.62334V5.28382H7.82158C8.19585 5.28382 8.49961 5.57971 8.49961 5.94429C8.49961 6.30888 8.19585 6.60477 7.82158 6.60477H1.71934V12.5491C1.71934 13.6415 2.63196 14.5305 3.75342 14.5305H6.46552C6.83979 14.5305 7.14355 14.8264 7.14355 15.191C7.14355 15.5556 6.83979 15.8514 6.46552 15.8514H3.75342C1.8841 15.8514 0.363281 14.37 0.363281 12.5491V4.62334C0.363281 2.8024 1.8841 1.32095 3.75342 1.32095H4.43144V0.660477C4.43144 0.295894 4.7352 0 5.10947 0C5.48374 0 5.7875 0.295894 5.7875 0.660477V1.32095H11.2117V0.660477C11.2117 0.295894 11.5148 0 11.8897 0C12.2647 0 12.5678 0.295894 12.5678 0.660477V1.32095H13.2458C15.1151 1.32095 16.6359 2.8024 16.6359 4.62334Z"
                          fill="#005E80"
                        />
                      </svg>
                    </div>

                    {companyInfo?.project_start_date
                      ? new Date(companyInfo.project_start_date)
                        .toLocaleDateString('en-GB')
                        .replace(/\//g, '-')
                      : 'N/A'}
                  </div>
                </div>

                <div className="flex self-stretch justify-start items-center flex-row gap-x-10 mt-[40px]">
                  <p className="text-[#484848] leading-[19.28569984436035px] text-nowrap">
                    Expected Transection Timeline
                  </p>

                  <div className="flex items-center gap-3 p-[10px_20px_10px_20px] bg-white border border-gray-300 rounded-md w-full sm:w-80 md:w-96 lg:w-[400px] ml-[85px]">
                    <div className="flex justify-start items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="17"
                        height="16"
                        viewBox="0 0 17 16"
                        fill="none"
                      >
                        <path
                          d="M11.8897 6.63053C9.27323 6.63053 7.14355 8.70443 7.14355 11.2539C7.14355 13.7888 9.27323 15.8514 11.8897 15.8514C14.5062 15.8514 16.6359 13.7776 16.6359 11.2281C16.6359 8.6932 14.5062 6.63053 11.8897 6.63053ZM11.8897 14.5305C10.0204 14.5305 8.49961 13.0603 8.49961 11.2539C8.49961 9.43293 10.0204 7.95148 11.8897 7.95148C13.7591 7.95148 15.2799 9.42171 15.2799 11.2281C15.2799 13.049 13.7591 14.5305 11.8897 14.5305ZM13.0471 11.4216C13.3122 11.6799 13.3122 12.0973 13.0471 12.3555C12.9149 12.4843 12.7413 12.5491 12.5678 12.5491C12.3942 12.5491 12.2206 12.4843 12.0884 12.3555L11.4104 11.6951C11.2829 11.5709 11.2117 11.4031 11.2117 11.2281V9.90716C11.2117 9.54257 11.5148 9.24668 11.8897 9.24668C12.2647 9.24668 12.5678 9.54257 12.5678 9.90716V10.9547L13.0471 11.4216ZM16.6359 4.62334V5.94429C16.6359 6.30888 16.3329 6.60477 15.9579 6.60477C15.583 6.60477 15.2799 6.30888 15.2799 5.94429V4.62334C15.2799 3.53091 14.3673 2.64191 13.2458 2.64191H3.75342C2.63196 2.64191 1.71934 3.53091 1.71934 4.62334V5.28382H7.82158C8.19585 5.28382 8.49961 5.57971 8.49961 5.94429C8.49961 6.30888 8.19585 6.60477 7.82158 6.60477H1.71934V12.5491C1.71934 13.6415 2.63196 14.5305 3.75342 14.5305H6.46552C6.83979 14.5305 7.14355 14.8264 7.14355 15.191C7.14355 15.5556 6.83979 15.8514 6.46552 15.8514H3.75342C1.8841 15.8514 0.363281 14.37 0.363281 12.5491V4.62334C0.363281 2.8024 1.8841 1.32095 3.75342 1.32095H4.43144V0.660477C4.43144 0.295894 4.7352 0 5.10947 0C5.48374 0 5.7875 0.295894 5.7875 0.660477V1.32095H11.2117V0.660477C11.2117 0.295894 11.5148 0 11.8897 0C12.2647 0 12.5678 0.295894 12.5678 0.660477V1.32095H13.2458C15.1151 1.32095 16.6359 2.8024 16.6359 4.62334Z"
                          fill="#005E80"
                        />
                      </svg>
                    </div>

                    {companyInfo?.expected_transaction_timeline
                      ? new Date(companyInfo.expected_transaction_timeline)
                        .toLocaleDateString('en-GB')
                        .replace(/\//g, '-')
                      : 'N/A'}
                  </div>
                </div>

                {!companyInfo.no_pic_needed && (
                  <div className="flex self-stretch justify-start items-center flex-row gap-2.5 mt-[40px]">
                    <p className="text-[#484848] leading-[4.821rem]">TCF Person In Charge</p>
                    <div className="flex justify-center items-center flex-row bg-white border border-[#CAC4D0] rounded-[20px] w-[237px] ml-[190px]">
                      <div className="flex justify-start items-center flex-row gap-2 py-1.5 pr-4 pl-1 w-[236px] h-8 border-gray-300 rounded">
                        {employeeData?.image ? (
                          <img
                            className="w-[26px] h-[26px] rounded-full border-[1.5px] border-white object-cover"
                            src={`${baseURL}/storage/${employee.image}`}
                            alt="Employee"
                          />
                        ) : (
                          <div className="w-[26px] h-[26px] rounded-full border-[1.5px] border-white bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 text-xs">N/A</span>
                          </div>
                        )}
                        <span className="font-poppins text-nowrap text-[#30313D] text-sm font-semibold leading-[31.78px]">
                          {employeeData
                            ? [employeeData.first_name, employeeData.last_name]
                              .filter(Boolean)
                              .join(' ')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-[73px] w-[1316px] mt-[50px]">
        <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none ">
          <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
            Company General Contact
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

          <div className="flex self-stretch justify-start items-start flex-col gap-5 text-nowrap ">
            <div className="flex self-stretch justify-start items-center flex-row gap-2.5">
              <p className="text-[#484848] leading-[19.28569984436035px]">Company Email</p>
              <div className="flex justify-start items-center flex-row gap-[9px] ml-auto">
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
                    {companyInfo?.company_email
                      ? companyInfo.company_email.length > 30
                        ? `${companyInfo.company_email.slice(0, 30)}...`
                        : companyInfo.company_email
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

            <div className="flex self-stretch justify-start items-center flex-row gap-2.5">
              <p className="text-[#484848] leading-[19.28569984436035px]">Contact Number</p>
              <div className="flex justify-start items-center flex-row gap-[9px] ml-auto">
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
                    {companyInfo?.contact_number
                      ? companyInfo.contact_number.length > 30
                        ? `${companyInfo.contact_number.slice(0, 30)}...`
                        : companyInfo.contact_number
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

            <div className="flex self-stretch justify-start items-center flex-row gap-2.5 h-[93px] mt-[-40px]">
              <p className="text-[#484848] leading-[19.28569984436035px]">HQ Address</p>

              <span className="text-[#30313D] text-right font-medium leading-normal ml-auto">
                {Array.isArray(companyInfo?.hq_address) && companyInfo.hq_address.length > 0
                  ? (() => {
                    const fullAddress = companyInfo.hq_address
                      .map((item: any) => item.address)
                      .join(', ');
                    return fullAddress.length > 40
                      ? `${fullAddress.slice(0, 40)}...`
                      : fullAddress;
                  })()
                  : 'N/A'}
              </span>

              <svg
                onClick={() => {
                  if (Array.isArray(companyInfo?.hq_address) && companyInfo.hq_address.length > 0) {
                    const fullAddress = companyInfo.hq_address
                      .map((item: any) => item.address)
                      .join(', ');
                    navigator.clipboard.writeText(fullAddress);
                    showAlert({
                      type: 'success',
                      message: 'Copied to clipboard',
                    });
                  }
                }}
                className="cursor-pointer"
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
            </div>

            <div className="flex self-stretch justify-start items-start flex-col gap-[22px]">
              <p className="self-stretch text-[#484848] leading-[19.2857px]">
                Shareholder’s/Owner’s Name
              </p>

              <div className="flex justify-start items-start flex-col gap-3.5 w-[154px]">
                {companyInfo.shareholders && companyInfo.shareholders.length > 0 ? (
                  companyInfo.shareholders.map((shareholder: any, idx: number) => (
                    <div key={idx} className="flex justify-start items-center flex-row gap-2.5">
                      <Icon />
                      <span className={`text-[#30313D] ${shareholder.fontWeight} leading-normal`}>
                        {shareholder.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-start items-center flex-row gap-2.5">
                    <Icon />
                    <span className="text-[#30313D] text-sm leading-normal">N/A</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12">
          <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins mb-[18px]">
            Contact Person Details
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

        <div className="flex self-stretch justify-center items-start flex-col gap-10 text-nowrap ml-[-620px] p-0 mt-[80px]">
          <div className="flex self-stretch justify-start items-center flex-row gap-2.5">
            <p className="text-[#484848] leading-[19.28569984436035px]">Contact Person Name</p>
            <div className="flex justify-start items-center flex-row gap-2 w-[283px]">
              <p className="text-[#30313D] font-medium leading-normal ml-[170px]">
                {companyInfo?.contact_person_name || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex self-stretch justify-start items-center flex-row gap-2.5">
            <p className="text-[#484848] leading-[19.28569984436035px]">Designation & Position</p>
            <p className="text-[#30313D] font-medium leading-normal ml-[170px]">
              {companyInfo?.designation_position || 'N/A'}
            </p>
          </div>
          <div className="flex self-stretch justify-start items-center flex-row gap-2.5">
            <p className="text-[#484848] leading-[19.28569984436035px]">Email Address</p>
            <div className="flex justify-start items-center flex-row gap-[9px] ml-[230px]">
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
                  d="M2.45148 3.01671C1.81896 3.60404 1.39535 4.55703 1.39535 6.05196V12.5636C1.39535 14.0585 1.81896 15.0115 2.45148 15.5988C3.09335 16.1948 4.06044 16.5171 5.34884 16.5171H14.6512C15.9395 16.5171 16.9066 16.1948 17.5486 15.5988C18.181 15.0115 18.6047 14.0585 18.6047 12.5636V6.05196C18.6047 4.55703 18.181 3.60404 17.5486 3.01671C16.9066 2.42068 15.9395 2.09847 14.6512 2.09847H5.34884C4.06044 2.09847 3.09335 2.42068 2.45148 3.01671ZM1.50201 1.99419C2.48805 1.07859 3.84654 0.703125 5.34884 0.703125H14.6512C16.1535 0.703125 17.512 1.07859 18.498 1.99419C19.4934 2.91849 20 4.29108 20 6.05196V12.5636C20 14.3245 19.4934 15.6971 18.498 16.6214C17.512 17.537 16.1535 17.9124 14.6512 17.9124H5.34884C3.84654 17.9124 2.48805 17.537 1.50201 16.6214C0.506623 15.6971 0 14.3245 0 12.5636V6.05196C0 4.29108 0.506623 2.91849 1.50201 1.99419Z"
                  fill="#064771"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16.8489 4.94495C17.0845 5.24985 17.0283 5.68801 16.7235 5.9236L11.5634 9.91085C10.6421 10.6227 9.35639 10.6227 8.43509 9.91085L3.27503 5.9236C2.97013 5.68801 2.91395 5.24985 3.14955 4.94495C3.38515 4.64005 3.8233 4.58388 4.1282 4.81948L9.28821 8.80667C9.707 9.13029 10.2915 9.13029 10.7102 8.80667L15.8703 4.81948C16.1752 4.58388 16.6133 4.64005 16.8489 4.94495Z"
                  fill="#064771"
                />
              </svg>
              <div className="flex justify-start items-center flex-row gap-1.5 ">
                <span className="text-[#064771]  font-medium leading-[22px] ">
                  {companyInfo?.email_address || 'N/A'}
                </span>
                <svg
                  width="13"
                  height="17"
                  viewBox="0 0 13 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.4507 2.63461L10.9661 1.10126C10.7838 0.91404 10.5659 0.765108 10.3253 0.663202C10.0847 0.561296 9.82608 0.508467 9.56475 0.507812H6.5C5.75106 0.508758 5.02536 0.767871 4.44519 1.24148C3.86502 1.71509 3.46586 2.37423 3.315 3.10781H3.25C2.38836 3.10884 1.56231 3.45158 0.953043 4.06085C0.343773 4.67012 0.00103211 5.49617 0 6.35781V12.8578C0.00103211 13.7194 0.343773 14.5455 0.953043 15.1548C1.56231 15.764 2.38836 16.1068 3.25 16.1078H7.15C8.01163 16.1068 8.83769 15.764 9.44695 15.1548C10.0562 14.5455 10.399 13.7194 10.4 12.8578V12.7928C11.1336 12.6419 11.7927 12.2428 12.2663 11.6626C12.7399 11.0825 12.9991 10.3567 13 9.60781V3.99181C13.001 3.48508 12.8039 2.99804 12.4507 2.63461ZM7.15 14.8078H3.25C2.73283 14.8078 2.23684 14.6024 1.87114 14.2367C1.50545 13.871 1.3 13.375 1.3 12.8578V6.35781C1.3 5.84064 1.50545 5.34465 1.87114 4.97895C2.23684 4.61326 2.73283 4.40781 3.25 4.40781V9.60781C3.25103 10.4694 3.59377 11.2955 4.20304 11.9048C4.81231 12.514 5.63836 12.8568 6.5 12.8578H9.1C9.1 13.375 8.89455 13.871 8.52886 14.2367C8.16316 14.6024 7.66717 14.8078 7.15 14.8078ZM9.75 11.5578H6.5C5.98283 11.5578 5.48684 11.3524 5.12114 10.9867C4.75544 10.621 4.55 10.125 4.55 9.60781V3.75781C4.55 3.24064 4.75544 2.74465 5.12114 2.37895C5.48684 2.01326 5.98283 1.80781 6.5 1.80781H9.1V3.10781C9.1 3.45259 9.23696 3.78325 9.48076 4.02705C9.72456 4.27085 10.0552 4.40781 10.4 4.40781H11.7V9.60781C11.7 10.125 11.4946 10.621 11.1289 10.9867C10.7632 11.3524 10.2672 11.5578 9.75 11.5578Z"
                    fill="#4F4F4F"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex self-stretch justify-start items-center flex-row gap-2.5">
            <p className="text-[#484848] leading-[19.28569984436035px]">Contact Number</p>

            <div className="flex justify-start items-center flex-row gap-[9px] ml-[210px]">
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
                <span className="text-[#064771] font-medium leading-[22px]">
                  {companyInfo?.contact_person_contact_number || 'N/A'}
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
        </div>
      </div>

      <div className="ml-[660px] mt-[20px]">
        <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins mb-[18px]">
          Social Wings of Prospect
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

        <div className="flex self-stretch justify-start items-start flex-col gap-10 mt-[20px]">
          <div className="flex self-stretch justify-start items-center flex-row gap-[45px]">
            <div
              className="flex justify-center items-start flex-col gap-2.5 py-1 px-3.5 bg-[#F2F0F0] rounded-[14px] w-[160px] h-[28px]"
              style={{ width: '160px' }}
            >
              <div className="flex justify-start items-center flex-row gap-2">
                <svg
                  width="19"
                  height="20"
                  viewBox="0 0 19 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.901 6.84419C17.287 7.78998 17.5 8.82536 17.5 9.91211H18.75C18.75 8.66069 18.5044 7.46504 18.0583 6.37189L16.901 6.84419ZM17.5 9.91211C17.5 10.4894 17.4399 11.0519 17.3258 11.5941L18.549 11.8515C18.6808 11.2252 18.75 10.5764 18.75 9.91211H17.5ZM17.3258 11.5941C16.6658 14.731 14.194 17.2029 11.057 17.8629L11.3144 19.0861C14.9362 18.324 17.7869 15.4734 18.549 11.8515L17.3258 11.5941ZM11.057 17.8629C10.5148 17.977 9.95225 18.0371 9.375 18.0371V19.2871C10.0393 19.2871 10.6881 19.2179 11.3144 19.0861L11.057 17.8629ZM9.375 18.0371C8.79767 18.0371 8.23517 17.977 7.69297 17.8629L7.43558 19.0861C8.06183 19.2179 8.71067 19.2871 9.375 19.2871V18.0371ZM1.25 9.91211C1.25 8.82453 1.46334 7.78835 1.84988 6.84198L0.692683 6.36933C0.245917 7.46317 0 8.65969 0 9.91211H1.25ZM7.69297 17.8629C4.55603 17.2029 2.08427 14.731 1.42419 11.5941L0.200978 11.8515C0.963092 15.4734 3.81373 18.324 7.43558 19.0861L7.69297 17.8629ZM1.42419 11.5941C1.31011 11.0519 1.25 10.4894 1.25 9.91211H0C0 10.5764 0.0691917 11.2252 0.200978 11.8515L1.42419 11.5941ZM1.84988 6.84198C2.85589 4.37891 5.03651 2.52028 7.69296 1.9613L7.43558 0.738087C4.36693 1.38379 1.85308 3.52828 0.692683 6.36933L1.84988 6.84198ZM7.69296 1.9613C8.23517 1.84722 8.79767 1.78711 9.375 1.78711V0.537109C8.71067 0.537109 8.06183 0.606301 7.43558 0.738087L7.69296 1.9613ZM9.375 1.78711C9.95225 1.78711 10.5148 1.84722 11.057 1.9613L11.3144 0.738088C10.6881 0.606302 10.0393 0.537109 9.375 0.537109V1.78711ZM11.057 1.9613C13.7142 2.52044 15.8954 4.38003 16.901 6.84419L18.0583 6.37189C16.8984 3.52958 14.384 1.38398 11.3144 0.738088L11.057 1.9613ZM10.5903 1.53968C10.8318 2.29661 11.7262 5.20895 12.0929 7.88561L13.3313 7.71595C12.9492 4.92598 12.0261 1.9274 11.7812 1.15971L10.5903 1.53968ZM12.0929 7.88561C12.1912 8.60311 12.25 9.29278 12.25 9.91211H13.5C13.5 9.21886 13.4346 8.46961 13.3313 7.71595L12.0929 7.88561ZM17.2268 6.03913C16.266 6.33054 14.4611 6.84244 12.5987 7.18616L12.8256 8.41544C14.7538 8.05953 16.6091 7.53272 17.5897 7.23532L17.2268 6.03913ZM12.5987 7.18616C11.4691 7.39464 10.3399 7.53711 9.375 7.53711V8.78711C10.4478 8.78711 11.6608 8.63036 12.8256 8.41544L12.5987 7.18616ZM12.25 9.91211C12.25 10.8295 12.1212 11.8961 11.9289 12.9713L13.1594 13.1913C13.3581 12.0804 13.5 10.9331 13.5 9.91211H12.25ZM11.9289 12.9713C11.5076 15.3281 10.7997 17.6282 10.5903 18.2845L11.7812 18.6645C11.9958 17.9918 12.7234 15.6299 13.1594 13.1913L11.9289 12.9713ZM17.7474 11.1274C17.0911 11.3369 14.791 12.0447 12.4342 12.466L12.6542 13.6965C15.0927 13.2605 17.4547 12.5329 18.1274 12.3183L17.7474 11.1274ZM12.4342 12.466C11.359 12.6583 10.2924 12.7871 9.375 12.7871V14.0371C10.396 14.0371 11.5433 13.8952 12.6542 13.6965L12.4342 12.466ZM9.375 12.7871C8.45758 12.7871 7.39102 12.6583 6.31581 12.466L6.0958 13.6965C7.20672 13.8952 8.354 14.0371 9.375 14.0371V12.7871ZM6.31581 12.466C3.95897 12.0447 1.65888 11.3369 1.00257 11.1274L0.6226 12.3183C1.29531 12.5329 3.65727 13.2605 6.0958 13.6965L6.31581 12.466ZM5.25 9.91211C5.25 10.9331 5.39193 12.0804 5.59056 13.1913L6.82105 12.9713C6.6288 11.8961 6.5 10.8295 6.5 9.91211H5.25ZM5.59056 13.1913C6.02657 15.6299 6.7542 17.9918 6.96884 18.6645L8.15967 18.2845C7.95025 17.6282 7.24245 15.3281 6.82105 12.9713L5.59056 13.1913ZM6.96884 1.15971C6.72389 1.9274 5.80083 4.92598 5.41862 7.71595L6.65705 7.88561C7.02374 5.20895 7.91817 2.29661 8.15967 1.53968L6.96884 1.15971ZM5.41862 7.71595C5.31538 8.46961 5.25 9.21886 5.25 9.91211H6.5C6.5 9.29278 6.55877 8.60311 6.65705 7.88561L5.41862 7.71595ZM9.375 7.53711C8.41008 7.53711 7.28092 7.39464 6.15127 7.18616L5.92441 8.41544C7.08914 8.63036 8.30217 8.78711 9.375 8.78711V7.53711ZM6.15127 7.18616C4.28822 6.84232 2.48268 6.33018 1.52214 6.03882L1.1593 7.235C2.13958 7.53234 3.99548 8.0594 5.92441 8.41544L6.15127 7.18616ZM17.1917 6.05336C17.2016 6.04819 17.2137 6.0431 17.2268 6.03913L17.5897 7.23532C17.6525 7.21626 17.7116 7.19185 17.7677 7.16273L17.1917 6.05336ZM0.945208 7.13885C1.01102 7.17909 1.0824 7.21168 1.1593 7.235L1.52214 6.03882C1.54986 6.04723 1.5754 6.05903 1.59736 6.07246L0.945208 7.13885Z"
                    fill="black"
                  />
                </svg>
                <span className="text-[#30313D] font-medium leading-[19.28569984436035px]">
                  Website
                </span>
              </div>
            </div>
            <div className="flex justify-start items-end flex-row gap-1">
              <span className="text-[#064771] font-medium leading-[22px]">
                <a
                  href={`https://${companyInfo?.website?.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#064771] underline"
                >
                  {companyInfo?.website?.length > 30
                    ? companyInfo.website.slice(0, 30) + '...'
                    : companyInfo?.website || 'N/A'}
                </a>
              </span>
              <svg
                width="12"
                height="13"
                viewBox="0 0 12 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 8.55497V1.41211M11 1.41211H3.85714M11 1.41211L1 11.4121"
                  stroke="#064771"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex self-stretch justify-start items-center flex-row gap-[45px]">
            <div
              className="flex justify-center items-start flex-col gap-2.5 py-1 px-3.5 bg-[#F2F0F0] rounded-[14px] w-[160px] h-[28px]"
              style={{ width: '160px' }}
            >
              <div className="flex justify-start items-center flex-row gap-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 7.61523V7.58398C10 7.58398 9.99479 7.58398 9.98438 7.58398C9.97396 7.58398 9.97917 7.5944 10 7.61523ZM4.0625 17.4277H0.25V5.92773H4.0625V17.4277ZM2.15625 4.36523C1.48958 4.36523 0.963542 4.17253 0.578125 3.78711C0.192708 3.40169 0 2.92773 0 2.36523C0 1.80273 0.197917 1.32878 0.59375 0.943359C0.989583 0.557943 1.52083 0.365234 2.1875 0.365234C2.83333 0.365234 3.34375 0.557943 3.71875 0.943359C4.09375 1.32878 4.29167 1.80273 4.3125 2.36523C4.3125 2.92773 4.11458 3.40169 3.71875 3.78711C3.32292 4.17253 2.80208 4.36523 2.15625 4.36523ZM17.8438 17.4277H14V11.3027C14 10.5319 13.8542 9.9069 13.5625 9.42773C13.2708 8.94857 12.7708 8.70898 12.0625 8.70898C11.5417 8.70898 11.1198 8.85482 10.7969 9.14648C10.474 9.43815 10.2396 9.75065 10.0938 10.084C10.0521 10.2298 10.026 10.3809 10.0156 10.5371C10.0052 10.6934 10 10.8548 10 11.0215V17.459H6.15625C6.15625 17.459 6.16667 16.9069 6.1875 15.8027C6.1875 14.7194 6.1875 13.4902 6.1875 12.1152C6.1875 10.7402 6.1875 9.43815 6.1875 8.20898C6.1875 6.97982 6.17708 6.22982 6.15625 5.95898H10V7.58398C10.25 7.20898 10.6354 6.79753 11.1562 6.34961C11.6771 5.90169 12.4375 5.67773 13.4375 5.67773C14.6875 5.67773 15.7344 6.09961 16.5781 6.94336C17.4219 7.78711 17.8438 9.08398 17.8438 10.834V17.4277Z"
                    fill="#0077B5"
                  />
                </svg>
                <span className="text-[#30313D] font-medium leading-[19.28569984436035px]">
                  LinkedIn
                </span>
              </div>
            </div>
            <div className="flex justify-start items-end flex-row gap-1">
              <span className="text-[#064771] font-medium leading-[22px]">
                <a
                  href={`https://${companyInfo?.linkedin?.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#064771] underline"
                >
                  {companyInfo?.linkedin?.length > 30
                    ? companyInfo.linkedin.slice(0, 30) + '...'
                    : companyInfo?.linkedin || 'N/A'}
                </a>
              </span>
              <svg
                width="12"
                height="13"
                viewBox="0 0 12 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 8.55497V1.41211M11 1.41211H3.85714M11 1.41211L1 11.4121"
                  stroke="#064771"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex self-stretch justify-start items-center flex-row gap-[45px]">
            <div
              className="flex justify-center items-start flex-col gap-2.5 py-1 px-3.5 bg-[#F2F0F0] rounded-[14px] w-[160px] h-[28px]"
              style={{ width: '160px' }}
            >
              <div className="flex justify-start items-center flex-row gap-2">
                <svg
                  width="20"
                  height="19"
                  viewBox="0 0 20 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 2.17773L14.0625 17.6465H16.6875L5.125 2.17773H2.5ZM13.4375 18.8652L8.1875 11.834L1.6875 18.8652H0L7.4375 10.834L0.0625 0.958984H5.75L10.5938 7.42773L16.5938 0.958984H18.25L11.3438 8.42773L19.1562 18.8652H13.4375Z"
                    fill="black"
                  />
                </svg>
                <span className="text-[#30313D] font-medium leading-[19.28569984436035px]">
                  X (Twitter){' '}
                </span>
              </div>
            </div>
            <div className="flex justify-start items-end flex-row gap-1">
              <span className="text-[#064771] font-medium leading-[22px]">
                <a
                  href={`https://${companyInfo?.twitter?.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#064771] underline"
                >
                  {companyInfo?.twitter?.length > 30
                    ? companyInfo.twitter.slice(0, 30) + '...'
                    : companyInfo?.twitter || 'N/A'}
                </a>
              </span>
              <svg
                width="12"
                height="13"
                viewBox="0 0 12 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 8.55497V1.41211M11 1.41211H3.85714M11 1.41211L1 11.4121"
                  stroke="#064771"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex self-stretch justify-start items-center flex-row gap-[45px]">
            <div
              className="flex justify-center items-start flex-col gap-2.5 py-1 px-3.5 bg-[#F2F0F0] rounded-[14px] w-[160px] h-[28px]"
              style={{ width: '160px' }}
            >
              <div className="flex justify-start items-center flex-row gap-2">
                <svg
                  width="10"
                  height="22"
                  viewBox="0 0 10 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.625 4.03711H7.3125C7.125 4.03711 6.92188 4.10482 6.70312 4.24023C6.48438 4.37565 6.375 4.64128 6.375 5.03711V7.19336H9.625L9.25 10.8809H6.375V21.3496H2.0625V10.8809H0V7.19336H2.0625V4.84961C2.0625 3.99544 2.34375 3.05273 2.90625 2.02148C3.46875 0.990234 4.63542 0.474609 6.40625 0.474609H9.625V4.03711Z"
                    fill="#3B5998"
                  />
                </svg>
                <span className="text-[#30313D] font-medium leading-[19.28569984436035px]">
                  Facebook
                </span>
              </div>
            </div>
            <div className="flex justify-start items-end flex-row gap-1">
              <span className="text-[#064771] font-medium leading-[22px]">
                <a
                  href={`https://${companyInfo?.facebook?.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#064771] underline"
                >
                  {companyInfo?.facebook?.length > 30
                    ? companyInfo.facebook.slice(0, 30) + '...'
                    : companyInfo?.facebook || 'N/A'}
                </a>
              </span>
              <svg
                width="12"
                height="13"
                viewBox="0 0 12 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 8.55497V1.41211M11 1.41211H3.85714M11 1.41211L1 11.4121"
                  stroke="#064771"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex self-stretch justify-start items-center flex-row gap-[45px]">
            <div
              className="flex justify-center items-start flex-col gap-2.5 py-1 px-3.5 bg-[#F2F0F0] rounded-[14px] w-[160px] h-[28px]"
              style={{ width: '160px' }}
            >
              <div className="flex justify-start items-center flex-row gap-2">
                <svg
                  width="17"
                  height="18"
                  viewBox="0 0 17 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.50038 4.49023C6.10118 4.49023 4.11328 6.44386 4.11328 8.87733C4.11328 11.3108 6.06691 13.2644 8.50038 13.2644C10.9338 13.2644 12.8875 11.2765 12.8875 8.87733C12.8875 6.47814 10.8996 4.49023 8.50038 4.49023ZM8.50038 11.6878C6.95804 11.6878 5.68989 10.4197 5.68989 8.87733C5.68989 7.33499 6.95804 6.06685 8.50038 6.06685C10.0427 6.06685 11.3109 7.33499 11.3109 8.87733C11.3109 10.4197 10.0427 11.6878 8.50038 11.6878Z"
                    fill="black"
                  />
                  <path
                    d="M13.0604 5.38048C13.6093 5.38048 14.0543 4.93547 14.0543 4.38653C14.0543 3.83759 13.6093 3.39258 13.0604 3.39258C12.5114 3.39258 12.0664 3.83759 12.0664 4.38653C12.0664 4.93547 12.5114 5.38048 13.0604 5.38048Z"
                    fill="black"
                  />
                  <path
                    d="M15.629 1.81735C14.7379 0.891948 13.4698 0.412109 12.0302 0.412109H4.96976C1.9879 0.412109 0 2.40001 0 5.38187V12.4081C0 13.8819 0.479839 15.15 1.43952 16.0754C2.36492 16.9665 3.59879 17.4121 5.00403 17.4121H11.996C13.4698 17.4121 14.7036 16.9323 15.5948 16.0754C16.5202 15.1843 17 13.9161 17 12.4424V5.38187C17 3.94235 16.5202 2.70848 15.629 1.81735ZM15.4919 12.4424C15.4919 13.5049 15.1149 14.3617 14.498 14.9444C13.881 15.527 13.0242 15.8355 11.996 15.8355H5.00403C3.97581 15.8355 3.11895 15.527 2.50202 14.9444C1.88508 14.3274 1.57661 13.4706 1.57661 12.4081V5.38187C1.57661 4.35364 1.88508 3.49679 2.50202 2.87985C3.08468 2.29719 3.97581 1.98872 5.00403 1.98872H12.0645C13.0927 1.98872 13.9496 2.29719 14.5665 2.91413C15.1492 3.53106 15.4919 4.38792 15.4919 5.38187V12.4424Z"
                    fill="black"
                  />
                </svg>
                <span className="text-[#30313D] font-medium leading-[19.28569984436035px]">
                  Instagram
                </span>
              </div>
            </div>
            <div className="flex justify-start items-end flex-row gap-1">
              <span className="text-[#064771] font-medium leading-[22px]">
                <a
                  href={`https://${companyInfo?.instagram?.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#064771] underline"
                >
                  {companyInfo?.instagram?.length > 30
                    ? companyInfo.instagram.slice(0, 30) + '...'
                    : companyInfo?.instagram || 'N/A'}
                </a>
              </span>
              <svg
                width="12"
                height="13"
                viewBox="0 0 12 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 8.55497V1.41211M11 1.41211H3.85714M11 1.41211L1 11.4121"
                  stroke="#064771"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex self-stretch justify-start items-center flex-row gap-[45px]">
            <div
              className="flex justify-center items-start flex-col gap-2.5 py-1 px-3.5 bg-[#F2F0F0] rounded-[14px] w-[160px] h-[28px]"
              style={{ width: '160px' }}
            >
              <div className="flex justify-start items-center flex-row gap-2">
                <svg
                  width="19"
                  height="14"
                  viewBox="0 0 19 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.9395 6.50818L7.65908 3.10139V10.04L12.9395 6.50818ZM16.2202 0.31971C16.9076 0.31971 17.5325 0.601004 18.0949 1.16359C18.6574 1.72618 18.9386 2.33044 18.9386 2.97638V10.7901C18.9177 11.5402 18.6157 12.1809 18.0325 12.7123C17.4492 13.2436 16.866 13.5093 16.2827 13.5093H2.62862C1.87874 13.5093 1.25384 13.1967 0.753914 12.5716C0.253992 11.9465 0.00403162 11.3735 0.00403162 10.8526V2.97638C-0.0376285 2.35128 0.243578 1.74181 0.84765 1.14796C1.45172 0.554121 2.06621 0.278036 2.69111 0.31971H16.2202Z"
                    fill="#CD201F"
                  />
                </svg>
                <span className="text-[#30313D] font-medium leading-[19.28569984436035px]">
                  YouTube
                </span>
              </div>
            </div>
            <div className="flex justify-start items-end flex-row gap-1">
              <span className="text-[#064771] font-medium leading-[22px]">
                <a
                  href={`https://${companyInfo?.youtube?.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#064771] underline"
                >
                  {companyInfo?.youtube?.length > 30
                    ? companyInfo.youtube.slice(0, 30) + '...'
                    : companyInfo?.youtube || 'N/A'}
                </a>
              </span>
              <svg
                width="12"
                height="13"
                viewBox="0 0 12 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 8.55497V1.41211M11 1.41211H3.85714M11 1.41211L1 11.4121"
                  stroke="#064771"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-7 mt-3">
        <div className="flex justify-between items-center flex-row gap-[916px] mt-5 text-nowrap">
          <div
            className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[93px] h-[34px]"
            style={{ width: '93px' }}
          ></div>

          <div className="flex justify-start items-center flex-row gap-4">
            <div className="flex justify-start items-end flex-row gap-[10.06532096862793px] h-[34px] mt-[20px] ">
              <button
                className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#064771] rounded-[49.82036209106445px] h-[34px] ml-[-900px]"
                onClick={() => setActiveTab('target-preferences')}
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

export default CompanyOverview;
