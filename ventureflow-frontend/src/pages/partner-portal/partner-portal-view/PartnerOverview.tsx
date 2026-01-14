import { useState, useEffect, useCallback } from 'react';
import api from '../../../config/api';
import { useParams } from 'react-router-dom';
import { showAlert } from '../../../components/Alert';
import html2pdf from 'html2pdf.js';
import { useTranslation } from 'react-i18next';

const CompanyOverview: React.FC = () => {
  const { t } = useTranslation();
  const { id: paramId } = useParams();
  const id = paramId || localStorage.getItem('seller_id');

  // All hooks must be called at the top level, before any conditional logic

  const [companyInfo, setCompanyInfo] = useState({
    company_title: '',
    origin_country_flag_svg: '',
    rating: '',
    company_type: '',
    status: '',
    origin_country: '',
    company_registered_name: '',
    operational_countries_customer_base: '',
    full_time_employee_counts: '',
    company_email: '',
    contact_number: '',
    hq_address: '',
    seller_rank: '',
    reason_for_mna: '',
    potential_synergies: '',
    project_start_date: '',
    expected_transaction_timeline: '',
    tcf_person_in_charge: '',
    contact_person_name: '',
    designation_position: '',
    email_address: '',
    focused_industries: [] as { id: number; name: string }[],
    contact_person_contact_number: '',
    shareholders: [] as string[],
    partnership_structure: '',
    bonus_criteria: '',
    mou_status: '',
    year_founded: '',
    partner_contact_person_name: '',
    partner_contact_person_designation: '',
    partner_contact_person_email: '',
    partner_contact_person_numbers: [] as string[],
    partner_id: '',
    partnership_coverage_range: [] as (string | number)[],
    main_country_base: [] as (string | number)[],
    website: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    youtube: '',
    tcf_person: '',
    updated_at: '',
    image_url: '',
    no_pic_needed: '',
    description: '',
  });

  const [countries, setCountries] = useState<{ id: number; name: string; svg_icon_url: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: number; first_name: string; last_name: string; image?: string }[]>([]);

  const getCountryById = useCallback((countryId: number) => countries.find((c) => c.id === countryId), [countries]);

  const handleDownloadPDF = async () => {
    const element = document.querySelector('.pdf-container') as HTMLElement;
    if (!element) {
      showAlert({ type: "error", message: t('common.error.elementNotFound', { element: '.pdf-container' }) });
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

  const handleCopyLinkExample = () => {
    const fullUrl = `${baseURL}/settings/partners/${id}`;


    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        showAlert({
          type: 'success',
          message: t('common.linkCopied'),
        });

      })
      .catch((_err) => {
        showAlert({ type: "error", message: t('common.error.copyFailed') });
      });
  };

  useEffect(() => {
    api
      .get('/api/countries')
      .then((res) => {
        setCountries(res.data);
      })
      .catch((_err) => showAlert({ type: "error", message: t('settings.partners.error.fetchCountries') }));
  }, [t]);

  useEffect(() => {
    api
      .get('/api/employees/fetch')
      .then((res) => {
        setEmployees(res.data);
      })
      .catch((_err) => showAlert({ type: "error", message: t('settings.partners.error.fetchEmployees') }));
  }, [t]);

  useEffect(() => {
    if (!id || countries.length === 0) return;

    const fetchPartner = async () => {
      try {
        const response = await api.get(`/api/partners/${id}`);
        const partnerData = response.data?.data;
        const rawCountryId = partnerData.partner_overview?.hq_country;
        const countryId = rawCountryId ? parseInt(rawCountryId, 10) : null;
        const country = countryId ? getCountryById(countryId) : null;

        setCompanyInfo((prev) => ({
          ...prev,
          company_title: partnerData.partner_overview?.reg_name || '',
          rating: partnerData.partner_overview?.rating || '',
          company_type: partnerData.partner_overview?.company_type || '',

          origin_country: Array.isArray(partnerData.partner_overview?.hq_country)
            ? partnerData.partner_overview.hq_country.map((cid: string | number) => {
              const c = getCountryById(Number(cid));
              return c ? c.name : '';
            })
            : [country?.name || ''],
          origin_country_flag_svg: Array.isArray(partnerData.partner_overview?.hq_country)
            ? partnerData.partner_overview.hq_country.map((cid: string | number) => {
              const c = getCountryById(Number(cid));
              return c ? c.svg_icon_url : '';
            })
            : [country?.svg_icon_url || ''],
          status: Number(partnerData.partnership_structure?.status) === 1 ? t('common.active') : t('common.inactive'),
          mou_status: partnerData.partnership_structure?.mou_status || '',
          description: partnerData.partner_overview?.details || '',
          tcf_person: partnerData.partner_overview?.our_contact_person || '',
          focused_industries: partnerData.partner_overview?.niche_industry || [],
          partnership_coverage_range: Array.isArray(
            partnerData.partnership_structure?.partnership_coverage_range
          )
            ? partnerData.partnership_structure.partnership_coverage_range
            : partnerData.partnership_structure?.partnership_coverage_range
              ? [partnerData.partnership_structure.partnership_coverage_range]
              : [],

          company_registered_name: partnerData.partner_overview?.reg_name || '',
          year_founded: partnerData.partner_overview?.year_founded || '',
          bonus_criteria: partnerData.partnership_structure?.commission_criteria || '',
          full_time_employee_counts: partnerData.partner_overview?.emp_count || '',
          reason_for_mna: partnerData.partner_overview?.reason_ma || '',
          contact_person_contact_number: partnerData.partner_overview?.contact_person_phone || '',
          company_email: partnerData.partner_overview?.company_email || '',
          contact_number: partnerData.partner_overview?.company_phone || '',
          hq_address: partnerData.partner_overview?.hq_address || '',
          partnership_structure: partnerData.partnership_structure?.partnership_structure || '',
          shareholders: Array.isArray(partnerData.partner_overview?.shareholder_name)
            ? partnerData.partner_overview.shareholder_name
            : [],
          partner_contact_person_name: partnerData.partner_overview?.contact_person_name || '',
          partner_contact_person_designation:
            partnerData.partner_overview?.contact_person_position || '',
          partner_contact_person_email: partnerData.partner_overview?.contact_person_email || '',
          partner_contact_person_numbers: Array.isArray(
            partnerData.partner_overview?.contact_person_phone
          )
            ? partnerData.partner_overview.contact_person_phone
            : [],
          operational_countries_customer_base: Array.isArray(
            partnerData.partnership_structure?.partnership_coverage_range
          )
            ? partnerData.partnership_structure.partnership_coverage_range
            : [],
          main_country_base: partnerData.partner_overview?.main_countries || [],
          partner_id: partnerData.partner_id || '',
          website: partnerData.partner_overview?.website || '',
          linkedin: partnerData.partner_overview?.linkedin || '',
          twitter: partnerData.partner_overview?.twitter || '',
          facebook: partnerData.partner_overview?.facebook || '',
          instagram: partnerData.partner_overview?.instagram || '',
          youtube: partnerData.partner_overview?.youtube || '',
          updated_at: response.data.data.updated_at || '',
          image_url: partnerData.partner_image || '',
          no_pic_needed: partnerData.partner_overview?.no_pic_needed || false,
        }));
      } catch {
        showAlert({ type: "error", message: t('settings.partners.error.fetchPartner') });
      }
    };

    fetchPartner();
  }, [id, countries, getCountryById, t]);

  if (!paramId && !localStorage.getItem('seller_id')) {
    return (
      <div className="p-8 text-red-600 font-semibold flex justify-center items-center h-[200px]">
        {t('settings.partners.error.noSellerId')}
      </div>
    );
  }

  const getEmployeeById = (empId: number) => employees.find((e) => e.id === empId);

  const countryData = getCountryById(parseInt(String(companyInfo?.partnership_coverage_range)));
  const MaincountryData = getCountryById(parseInt(String(companyInfo?.main_country_base)));
  const employeeData = getEmployeeById(parseInt(companyInfo?.tcf_person));

  return (
    <div className="ml-3 font-poppins pdf-container">
      <div className=" flex w-full mt-[30px]">
        <div className=" w-[1019px] h-[180px]">
          <div className="flex justify-start items-center flex-row gap-[22px] w-[1019px]">
            {companyInfo?.image_url ? (
              <img
                className="rounded-[180px] w-[180px] h-[180px]"
                src={`${import.meta.env.VITE_API_BASE_URL}${companyInfo.image_url}`}
                style={{ objectFit: 'cover', width: '180px' }}
                alt="Partner"
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
                    {t('settings.partners.hqCountry')}
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
                  <div className="text-[#727272] text-sm font-medium leading-5 text-nowrap">
                    {t('settings.partners.companyType')}
                  </div>
                  <span className="text-[#30313D] text-sm font-semibold leading-5 text-nowrap">
                    {companyInfo?.company_type || t('common.na')}
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
                        <span className="text-[#064771] text-[12px] text-nowrap hover:underline">{t('common.share')}</span>
                      </button>
                    </div>
                    <span className="text-[#FFFFFF] leading-[12.788783073425293px] ml-[-90px]">
                      {t('settings.partners.partnerId')}
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
                        {t('common.lastRelease')}
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
            {t('settings.partners.businessOverview')}
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
            {(companyInfo.description || 'The Business Overview description section ')
              .split('\n')
              .map((paragraph: string, idx: number) => (
                <p key={idx} className="mb-4">
                  {paragraph}
                </p>
              ))}
          </div>
        </div>

        <div className="pt-12">
          <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins mb-[18px]">
            {t('settings.partners.partnershipStructureTitle')}
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

          <div className="flex  w-[680px] h-[1080px] mt-[25px]">
            <div className=" w-[680px]">
              <div className="">
                <div className="flex self-stretch justify-start items-center flex-row gap-x-10">
                  <p className="text-[#484848] leading-[19.28569984436035px]">
                    {t('settings.partners.partnershipStructure')}
                  </p>
                  <p className="text-[#30313D] font-medium leading-normal ml-[100px]">
                    {companyInfo?.partnership_structure || t('common.na')}
                  </p>
                </div>

                <div className="flex self-stretch justify-start items-center flex-row gap-x-10 mt-[40px]">
                  <p className="text-[#484848] leading-[19.28569984436035px]">
                    {t('settings.partners.commissionBonusCriteria')}
                  </p>
                  <p className="text-[#30313D] font-medium leading-normal ml-[10px]">
                    {companyInfo?.bonus_criteria || t('common.na')}
                  </p>
                </div>

                <div className="flex self-stretch justify-start items-center flex-row gap-x-10 mt-[40px]">
                  <p className="text-[#484848] leading-[19.28569984436035px]">{t('settings.partners.mouStatus')}</p>
                  <p className="text-[#30313D] font-medium leading-normal ml-[180px]">
                    {companyInfo?.mou_status || t('common.na')}
                  </p>
                </div>

                <div className="flex self-stretch justify-start items-center flex-row gap-x-10 mt-[40px]">
                  <p className="text-[#484848] leading-[19.28569984436035px]">{t('settings.partners.yearFounded')}</p>
                  <p className="text-[#30313D] font-medium leading-normal ml-[160px]">
                    {companyInfo?.year_founded || t('common.na')}
                  </p>
                </div>
              </div>

              <div className="flex self-stretch justify-start items-center flex-row gap-2.5 mt-[40px]">
                <p className="text-[#484848] leading-[19.29px] text-nowrap">
                  {t('settings.partners.broaderIndustry')}
                </p>

                <div className="flex justify-start items-center flex-row gap-[8.67px] bg-[#E6F1FA] px-3 py-2 rounded-full ml-[70px]">
                  {MaincountryData?.svg_icon_url ? (
                    <img
                      src={MaincountryData?.svg_icon_url}
                      alt="flag"
                      className="w-[26px] h-[26px] rounded-full bg-red-500 text-gray-800 text-[10px] flex items-center justify-center"
                    />
                  ) : (
                    <span className="w-[26px] h-[26px] rounded-full text-gray-800 text-[10px] flex items-center justify-center bg-red-600">
                      {t('common.na')}
                    </span>
                  )}
                  <span className="text-[#30313D] text-sm font-semibold leading-[31.78px]">
                    {MaincountryData?.name || t('common.na')}
                  </span>
                </div>
              </div>

              <div className="flex justify-start items-center gap-2.5 mt-[30px] text-nowrap">
                <p className="text-[#484848] leading-[19.29px]">{t('settings.partners.focusedIndustry')}</p>

                <div className="w-full max-w-[700px] ml-[165px]">
                  <div className="flex flex-wrap gap-4">
                    {(companyInfo?.focused_industries ?? []).map((industry) => (
                      <button
                        key={industry?.id}
                        className="flex justify-center items-center gap-2.5 py-1.5 px-[12px] rounded-[49px] h-[32px] text-sm font-medium leading-4 whitespace-nowrap text-white bg-[#064771] border border-[#064771]"
                      >
                        {industry?.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex self-stretch justify-start items-center flex-row gap-2.5 mt-[40px]">
                <p className="text-[#484848] leading-[19.29px] text-nowrap">
                  {t('settings.partners.partnershipCoverage')}
                </p>

                <div className="flex justify-start items-center flex-row gap-[8.67px] bg-[#E6F1FA] px-3 py-2 rounded-full ml-[80px]">
                  {countryData?.svg_icon_url ? (
                    <img
                      src={countryData?.svg_icon_url}
                      alt="flag"
                      className="w-[26px] h-[26px] rounded-full bg-red-500 text-gray-800 text-[10px] flex items-center justify-center"
                    />
                  ) : (
                    <span className="w-[26px] h-[26px] rounded-full text-gray-800 text-[10px] flex items-center justify-center bg-red-600">
                      n/a
                    </span>
                  )}
                  <span className="text-[#30313D] text-sm font-semibold leading-[31.78px]">
                    {countryData?.name || t('common.na')}
                  </span>
                </div>
              </div>

              {Number(companyInfo?.no_pic_needed) !== 1 && (
                <div className="flex self-stretch justify-start items-center flex-row gap-2.5">
                  <p className="text-[#484848] leading-[4.821rem]">{t('settings.partners.tcfContactPerson')}</p>
                  <div className="flex justify-center items-center flex-row bg-white border border-[#CAC4D0] rounded-[20px] w-[237px] ml-[150px]">
                    <div className="flex justify-start items-center flex-row gap-2 py-1.5 pr-4 pl-1 w-[236px] h-8  border-gray-300 rounded">
                      <img
                        src={
                          employeeData?.image
                            ? `${import.meta.env.VITE_API_BASE_URL}/storage/${employeeData.image}`
                            : 'https://placehold.co/26x26'
                        }
                        alt="Person in charge"
                        className="w-[26px] h-[26px] rounded-full border-[1.5px] border-white object-cover"
                      />
                      {employeeData ? (
                        <span className="font-poppins text-nowrap">
                          {employeeData.first_name} {employeeData.last_name}
                        </span>
                      ) : (
                        <span className="text-[#A0A0A0] italic">{t('common.unknown')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className=" ">
                <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins mb-[18px] mt-[85px] ">
                  {t('settings.partners.socialWings')}
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
                          {t('common.website')}
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
                          {companyInfo?.website
                            ? `${companyInfo?.website.slice(0, 30)}${companyInfo?.website.length > 30 ? '...' : ''
                            }`
                            : t('common.na')}
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
                          {t('common.linkedin')}
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
                          {companyInfo?.linkedin
                            ? `${companyInfo?.linkedin.slice(0, 30)}${companyInfo?.linkedin.length > 30 ? '...' : ''
                            }`
                            : t('common.na')}
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
                          {t('common.twitter')}{' '}
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
                          {companyInfo?.twitter
                            ? `${companyInfo?.twitter.slice(0, 30)}${companyInfo?.twitter.length > 30 ? '...' : ''
                            }`
                            : t('common.na')}
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
                          {t('common.facebook')}
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
                          {companyInfo?.facebook
                            ? `${companyInfo?.facebook.slice(0, 30)}${companyInfo?.facebook.length > 30 ? '...' : ''
                            }`
                            : t('common.na')}
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
                          {t('common.instagram')}
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
                          {companyInfo?.instagram
                            ? `${companyInfo?.instagram.slice(0, 30)}${companyInfo?.instagram.length > 30 ? '...' : ''
                            }`
                            : t('common.na')}
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
                          {t('common.youtube')}
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
                          {companyInfo?.youtube
                            ? `${companyInfo?.youtube.slice(0, 30)}${companyInfo?.youtube.length > 30 ? '...' : ''
                            }`
                            : t('common.na')}
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
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-[73px] w-[1316px] mt-[50px]">
        <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none ">
          <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
            {t('settings.partners.generalContact')}
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
              <p className="text-[#484848] leading-[19.28569984436035px]">{t('settings.partners.companyEmail')}</p>
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
                    {companyInfo?.company_email || t('common.na')}
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
              <p className="text-[#484848] leading-[19.28569984436035px]">{t('settings.partners.contactNumber')}</p>
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
                    {companyInfo?.contact_number || t('common.na')}
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
              <p className="text-[#484848] leading-[19.28569984436035px]">{t('settings.partners.partnerWebsite')}</p>
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
                    {companyInfo?.website || t('common.na')}
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
              <p className="text-[#484848] leading-[19.28569984436035px]">{t('settings.partners.hqAddress')}</p>

              <span className="text-[#30313D] text-right font-medium leading-normal ml-auto">
                {companyInfo?.hq_address
                  ? companyInfo.hq_address.length > 40
                    ? `${companyInfo.hq_address.slice(0, 40)}...`
                    : companyInfo.hq_address
                  : t('common.na')}
              </span>

              <svg
                onClick={() => {
                  if (companyInfo?.hq_address) {
                    navigator.clipboard.writeText(companyInfo.hq_address);
                    showAlert({
                      type: 'success',
                      message: t('common.copiedToClipboard'),
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

            <div
              className="flex justify-start items-start flex-col gap-8 w-[424px]"
              style={{ width: '424px' }}
            >
              <div className="flex self-stretch justify-start items-start flex-col gap-4">
                <p className="self-stretch text-[#064771] text-lg font-medium leading-5">
                  {t('settings.partners.contactPersonTitle')}
                </p>
                <svg
                  width="424"
                  height="2"
                  viewBox="0 0 424 2"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 1.20898H424" stroke="#D1D5DB" />
                </svg>
              </div>

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
                      <p className="self-stretch text-[#838383] text-sm">{t('settings.partners.contactPerson')}</p>
                      <div className="flex self-stretch justify-start items-start flex-row gap-[9px]">
                        <span className="text-[#30313D] text-lg font-medium">
                          {companyInfo?.partner_contact_person_name || t('common.na')}
                        </span>
                        <div
                          className="flex justify-center items-center flex-col gap-[4.81751823425293px] py-[4.335766315460205px] px-[14.934307098388672px] bg-[#064771] rounded-[4.335766315460205px] w-[93px]"
                          style={{ width: '93px' }}
                        >
                          <div className="flex justify-start items-start flex-row gap-[4.81751823425293px]">
                            <span className="text-[#FFFFFF] text-[13.676398277282715px] font-semibold leading-[19.53771209716797px]">
                              {t('settings.partners.keyPerson')}
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
                          {t('settings.partners.designationPosition')}
                        </span>
                      </div>
                      <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                        <span className="text-[#064771] text-sm font-medium leading-[22px]">
                          {companyInfo?.partner_contact_person_designation || t('common.na')}
                        </span>
                      </div>
                    </div>
                    <div className="flex self-stretch justify-start items-start flex-col gap-2.5">
                      <div className="flex justify-start items-center flex-row gap-2.5">
                        <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                          {t('settings.partners.personContactEmails')}
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
                            fill="#064771"
                          />
                        </svg>
                        <span className="text-[#064771] text-sm font-medium leading-[22px]">
                          {companyInfo?.partner_contact_person_email || t('common.na')}
                        </span>
                      </div>
                    </div>
                    <div className="flex self-stretch justify-start items-start flex-col gap-2.5">
                      <div className="flex justify-start items-center flex-row gap-2.5">
                        <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                          {t('settings.partners.personContact')}
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
                        {companyInfo?.partner_contact_person_numbers?.length > 0 ? (
                          companyInfo.partner_contact_person_numbers.map((number, index) => (
                            <div
                              key={index}
                              className="flex self-stretch justify-start items-center flex-row gap-1.5"
                            >
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 17 17"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <svg
                                  width="17"
                                  height="17"
                                  viewBox="0 0 17 17"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M9.10327 1.35047C9.10327 1.17337 9.17727 1.00352 9.30899 0.87829C9.44071 0.75306 9.61936 0.682707 9.80564 0.682707C11.6678 0.684651 13.4531 1.38881 14.7698 2.64069C16.0866 3.89257 16.8272 5.58992 16.8293 7.36034C16.8293 7.53744 16.7553 7.70729 16.6235 7.83252C16.4918 7.95775 16.3132 8.02811 16.1269 8.02811C15.9406 8.02811 15.762 7.95775 15.6303 7.83252C15.4985 7.70729 15.4245 7.53744 15.4245 7.36034C15.4229 5.94402 14.8303 4.58615 13.777 3.58466C12.7236 2.58316 11.2953 2.01982 9.80564 2.01823C9.61936 2.01823 9.44071 1.94788 9.30899 1.82265C9.17727 1.69742 9.10327 1.52757 9.10327 1.35047ZM9.80564 4.68929C10.5507 4.68929 11.2653 4.9707 11.7922 5.47162C12.3191 5.97254 12.6151 6.65194 12.6151 7.36034C12.6151 7.53744 12.6891 7.70729 12.8208 7.83252C12.9525 7.95775 13.1312 8.02811 13.3175 8.02811C13.5037 8.02811 13.6824 7.95775 13.8141 7.83252C13.9458 7.70729 14.0198 7.53744 14.0198 7.36034C14.0187 6.29806 13.5743 5.27958 12.7843 4.52843C11.9942 3.77728 10.923 3.35482 9.80564 3.35376C9.61936 3.35376 9.44071 3.42411 9.30899 3.54934C9.17727 3.67457 9.10327 3.84442 9.10327 4.02152C9.10327 4.19863 9.17727 4.36847 9.30899 4.4937C9.44071 4.61893 9.61936 4.68929 9.80564 4.68929ZM16.1922 11.8604C16.5992 12.2484 16.8278 12.7741 16.8278 13.3221C16.8278 13.8702 16.5992 14.3958 16.1922 14.7839L15.5531 15.4844C9.80072 20.7203 -4.19738 7.4151 1.22487 1.92875L2.03258 1.26099C2.4412 0.884824 2.98915 0.67673 3.55791 0.681729C4.12666 0.686727 4.67048 0.904417 5.07171 1.2877C5.09348 1.3084 6.39496 2.91571 6.39496 2.91571C6.78114 3.30143 6.99612 3.8138 6.9952 4.34633C6.99429 4.87885 6.77755 5.39056 6.39004 5.77507L5.57671 6.74734C6.02682 7.78712 6.68859 8.73209 7.52402 9.52797C8.35944 10.3238 9.35204 10.9549 10.4448 11.385L11.4737 10.607C11.8782 10.2389 12.4164 10.0331 12.9763 10.0323C13.5363 10.0316 14.075 10.236 14.4806 10.603C14.4806 10.603 16.1705 11.8397 16.1922 11.8604ZM15.2258 12.8313C15.2258 12.8313 13.545 11.602 13.5232 11.5813C13.3785 11.4449 13.183 11.3683 12.9793 11.3683C12.7755 11.3683 12.58 11.4449 12.4353 11.5813C12.4163 11.6 10.9997 12.6731 10.9997 12.6731C10.9042 12.7453 10.7906 12.7927 10.67 12.8105C10.5494 12.8283 10.4261 12.8159 10.312 12.7746C8.8964 12.2735 7.61057 11.4889 6.54164 10.4742C5.47271 9.4594 4.64566 8.23807 4.1165 6.89291C4.06958 6.78303 4.05428 6.66326 4.07218 6.5459C4.09008 6.42854 4.14053 6.31783 4.21834 6.22514C4.21834 6.22514 5.34704 4.8776 5.366 4.86024C5.50947 4.72267 5.58997 4.53678 5.58997 4.34305C5.58997 4.14932 5.50947 3.96344 5.366 3.82587C5.34423 3.80584 4.05118 2.20654 4.05118 2.20654C3.90431 2.08134 3.71264 2.01429 3.51545 2.01913C3.31825 2.02398 3.13048 2.10034 2.99061 2.23259L2.18289 2.90035C-1.77984 7.43046 10.3507 18.3237 14.5262 14.5722L15.1661 13.871C15.316 13.739 15.4061 13.5567 15.4172 13.3627C15.4284 13.1686 15.3597 12.9781 15.2258 12.8313Z"
                                    fill="#064771"
                                  />
                                </svg>
                              </svg>
                              <span className="text-[#064771] text-sm leading-[22px]">
                                {number || t('common.na')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[#064771] text-sm leading-[22px]">{t('common.na')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              <button className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#064771] rounded-[49.82036209106445px] h-[34px] ml-[-1100px]">
                <span className="text-[#FFF] ">{t('common.next')}</span>

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
