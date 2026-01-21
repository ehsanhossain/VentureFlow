import React, { useState, useEffect } from 'react';
import Label from '../../../components/Label';
import { Input } from '../../../components/Input';
import { useForm, Controller } from 'react-hook-form';
import SelectPicker from '../../../components/SelectPicker';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../config/api';
import { useTabStore } from './store/tabStore';
import { showAlert } from '../../../components/Alert';

type FormValues = {
  selectPartner: string;
  referral_Bonus_Amount_Percentage: string;
  referralBonousCriteria: string;
  mouStatus: string;
  specific_remarks: string;
};

interface PartnerOption {
  value: string;
  label: string;
  image?: string;
}

interface PartnershipData {
  partner: string;
  referral_bonus_criteria: string;
  mou_status: string;
  referral_bonus_amount: string;
  specific_remarks: string;
  partnership_affiliation: number;
}

interface Country {
  id: number;
  name: string;
  svg_icon_url: string;
}

interface Partner {
  id: number;
  name: string;
  logo_url: string;
}

const PartnershipDetails: React.FC = () => {
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const [, setLoading] = useState(false);
  const referralBonousCriteriaOptions = [
    { value: 'Profit Share', label: 'Profit Share' },
    { value: 'Success Free', label: 'Success Free' },
    { value: 'Custom', label: 'Custom' },
  ];

  const mouStatusOptions = [
    { value: 'Mou Signed', label: 'Mou Signed' },
    { value: 'Not Yet', label: 'Not Yet' },
  ];

  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await api.get('/api/partners/fetch');
        const partners = response.data;
        const formattedOptions: PartnerOption[] = partners.map((partner: Partner) => ({
          value: String(partner.id),
          label: partner.name,
          image: partner.logo_url
            ? `${import.meta.env.VITE_API_BASE_URL}${partner.logo_url}`
            : `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="145" height="145" viewBox="0 0 145 145" fill="none">
<rect x="1" y="1" width="143" height="143" rx="71.5" fill="#F1FBFF"/>
<rect x="1" y="1" width="143" height="143" rx="71.5" stroke="#064771" stroke-width="2"/>
<path d="M99.7904 71.1303L107.763 65.2264L100.872 42L65.3978 43.1369L61.9803 48.4439L49.8312 45.5217L37 72.012L42.8447 77.0426L39.7588 81.8182C38.7841 83.3266 38.4552 85.1242 38.8327 86.88C39.21 88.6358 40.2486 90.1394 41.7569 91.1141C42.8575 91.8253 44.1123 92.1926 45.3924 92.1926C45.7293 92.1926 46.0678 92.166 46.4059 92.1145C46.8339 93.6367 47.7945 95.0153 49.2237 95.9388C50.349 96.6661 51.6122 97.0133 52.8618 97.0133C53.1993 97.0133 53.5353 96.9848 53.8677 96.9349C54.3097 98.516 55.2995 99.8649 56.6903 100.764C57.8158 101.491 59.0789 101.838 60.3284 101.838C62.536 101.838 64.7012 100.754 65.9859 98.7656L66.9028 97.3465L72.2726 100.906L72.295 100.921C73.3956 101.632 74.6504 102 75.9305 102C76.4045 102 76.8823 101.95 77.3568 101.848C79.1126 101.47 80.6162 100.432 81.5909 98.9235C82.2768 97.8619 82.6241 96.6777 82.6613 95.4979C83.0053 95.4777 83.3503 95.4319 83.6937 95.3581C85.4495 94.9806 86.9531 93.942 87.9278 92.4338C88.6002 91.3934 88.9649 90.215 89.0026 89.008C89.3453 88.9877 89.6886 88.9419 90.0304 88.8684C91.7863 88.491 93.2899 87.4526 94.2646 85.9442C94.9512 84.8816 95.2985 83.6959 95.335 82.5151C97.4044 82.395 99.3925 81.3252 100.601 79.4545C101.576 77.9461 101.905 76.1486 101.527 74.3928C101.259 73.1439 100.656 72.0227 99.7904 71.1303ZM67.934 47.6145L97.5035 46.6669L102.487 63.4634L95.8589 68.3716L70.512 51.868L63.3171 62.7881L63.306 62.8051C62.6572 63.8085 61.3136 64.0972 60.3102 63.4492C59.3068 62.8008 59.0179 61.4569 59.6682 60.4504L67.934 47.6145ZM47.2256 86.6431C46.5768 87.6466 45.2329 87.9354 44.2299 87.2872C43.7438 86.973 43.4091 86.4884 43.2874 85.9226C43.1659 85.3568 43.2718 84.7776 43.5861 84.2915L48.143 77.239C48.5572 76.5982 49.2546 76.2489 49.9663 76.2489C50.3689 76.2489 50.7762 76.3609 51.1388 76.5951C51.6249 76.9093 51.9595 77.3937 52.0812 77.9595C52.2028 78.5254 52.0968 79.1047 51.7828 79.5908L47.2256 86.6431ZM54.6924 91.4679C54.0436 92.4713 52.6998 92.7599 51.6965 92.1118C50.6931 91.4634 50.4043 90.1195 51.0527 89.1161L55.6098 82.0637C56.024 81.4228 56.7214 81.0735 57.4331 81.0735C57.8357 81.0735 58.243 81.1855 58.6056 81.4199C59.609 82.0682 59.8979 83.4122 59.2495 84.4156L54.6924 91.4679ZM66.7159 89.2402L62.1589 96.2926C61.5105 97.2963 60.1666 97.5848 59.1633 96.9365C58.6772 96.6224 58.3425 96.1378 58.221 95.572C58.0994 95.0062 58.2052 94.4269 58.5194 93.9407L63.0764 86.8883C63.3906 86.4022 63.875 86.0676 64.4408 85.946C64.5938 85.9132 64.7477 85.8969 64.9002 85.8969C65.3128 85.8969 65.7172 86.0154 66.0719 86.2446C67.0754 86.893 67.3642 88.2368 66.7159 89.2402ZM96.774 76.9811C96.4599 77.4672 95.9754 77.8018 95.4096 77.9235C94.8438 78.0452 94.2644 77.9391 93.7785 77.6251L92.2666 76.6482L92.2665 76.6481L85.2139 72.091L82.741 75.918L84.2531 76.8952L89.7936 80.4754C90.2797 80.7895 90.6143 81.2739 90.7359 81.8398C90.8575 82.4056 90.7515 82.985 90.4375 83.4711C90.1235 83.9571 89.6388 84.2919 89.0731 84.4135C88.5072 84.535 87.9281 84.4291 87.4418 84.1151L80.3894 79.5581L77.9166 83.3851L83.457 86.965C84.4604 87.6133 84.7492 88.9572 84.1009 89.9607C83.7867 90.4468 83.3022 90.7815 82.7365 90.9031C82.1705 91.0246 81.5914 90.9188 81.1053 90.6047L75.0852 86.7148L72.6123 90.5419L77.1203 93.4548C78.1237 94.1034 78.4127 95.4471 77.7643 96.4506C77.4501 96.9367 76.9657 97.2714 76.3998 97.3931C75.8376 97.5139 75.2621 97.4099 74.778 97.1005L69.3766 93.5196L70.5435 91.7135C72.5554 88.5997 71.6591 84.4295 68.5454 82.4178C67.1151 81.4936 65.4621 81.1847 63.8975 81.4207C63.4699 79.8972 62.5091 78.5172 61.0789 77.593C59.6495 76.6695 57.9979 76.3603 56.4344 76.5955C55.9922 75.015 55.0025 73.6666 53.6121 72.7682C51.0386 71.105 47.744 71.4309 45.5419 73.352L42.629 70.8449L52.3334 50.8103L59.3679 52.5021L55.8398 57.9806C53.8279 61.0944 54.7241 65.2644 57.8379 67.2763C60.9484 69.2865 65.1135 68.3935 67.1279 65.2872L71.8241 58.1595L96.1311 73.9856C96.617 74.2997 96.9518 74.7842 97.0734 75.35C97.1942 75.9157 97.0882 76.4949 96.774 76.9811Z" fill="#064771"/>
</svg>`)}`,
        }));

        setPartnerOptions(formattedOptions);
      } catch {
        showAlert({ type: "error", message: "Failed to load partners" });
      }
    };

    fetchPartners();
  }, []);

  interface PartnerDetailData {
    partner_overview: {
      hq_country: string;
      reg_name?: string;
      company_phone?: string;
      hq_address?: string;
      website?: string;
      contact_person_name?: string;
      contact_person_email?: string;
      contact_person_phone?: string;
    };
    partner_image: string;
  }

  const [selectedPartnerDetails, setSelectedPartnerDetails] = useState<PartnerDetailData | null>(null);
  const handlePartnerSelect = async (partnerId: string | null) => {
    if (partnerId) {
      try {
        const response = await api.get(`/api/partner/${partnerId}`);
        setSelectedPartnerDetails(response.data.data);


      } catch {
        showAlert({ type: "error", message: "Failed to fetch partner details" });
      }
    }
  };

  const {
    control,
    handleSubmit,
    register,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  const [selectedOption, setSelectedOption] = useState<string>('');

  const options = [
    { value: 'Option 1', label: 'Option 1' },
    { value: 'Option 2', label: 'Option 2' },
    { value: 'Option 3', label: 'Option 3' },
  ];

  const handleSelect = (option: string | null) => {
    if (!option) return;
    setSelectedOption(option);
    sessionStorage.setItem('selectedOption', option);
  };

  const [selectedChoice, setSelectedChoice] = useState<'managedByUs' | 'managedPartner' | null>(
    'managedByUs'
  );

  const handleChange = (option: 'managedByUs' | 'managedPartner') => {
    setSelectedChoice(option);
  };

  const navigate = useNavigate();
  const [partnershipData, setPartnershipData] = useState<PartnershipData | null>(null);

  const { id: paramId } = useParams();
  const id = paramId || localStorage.getItem('buyer_id');
  const isEditMode = !!paramId;

  useEffect(() => {
    if (!id) return;
    const fetchCompanyData = async () => {
      try {
        const response = await api.get(`/api/buyer/${id}`);
        setPartnershipData(response.data.data.partnership_details);
        if (response.data.data.partnership_details.partnership_affiliation == 1) {
          setSelectedChoice('managedPartner');
        }

      } catch {
        showAlert({ type: "error", message: "Failed to fetch company data" });
      }
    };

    fetchCompanyData();
  }, [id]);

  useEffect(() => {
    if (!partnershipData) return;

    setValue('selectPartner', partnershipData.partner || '');
    setValue('referralBonousCriteria', partnershipData.referral_bonus_criteria || '');
    setValue('mouStatus', partnershipData.mou_status || '');

    setValue('referral_Bonus_Amount_Percentage', partnershipData.referral_bonus_amount || '');

    setValue('specific_remarks', partnershipData.specific_remarks || '');
  }, [partnershipData, setValue]);

  const onSubmit = async (data: FormValues) => {
    const formData = new FormData();
    const buyerId = id;

    formData.append('buyer_id', buyerId || '');
    if (selectedChoice == 'managedPartner') {
      formData.append('partnership_affiliation', '1');
    }

    formData.append('partner', data.selectPartner);
    formData.append('referral_bonus_amount', data.referral_Bonus_Amount_Percentage);
    formData.append('referral_bonus_criteria', data.referralBonousCriteria);
    formData.append('mou_status', data.mouStatus);
    formData.append('specific_remarks', data.specific_remarks);

    try {
      const response = await api.post('/api/buyer/partnership-details', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      localStorage.setItem('buyer_id', response.data.data);
      showAlert({ type: 'success', message: 'Draft Saved' });
      setActiveTab('attachments');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.response?.data?.detail || error.message;
        showAlert({ type: 'error', message: `Failed to submit buyer partnership details: ${errorMessage}` });
      } else {
        showAlert({ type: 'error', message: 'An unexpected error occurred during submission.' });
      }
    }
  };

  const onDraft = async (data: FormValues) => {
    const formData = new FormData();
    const buyerId = id;

    formData.append('buyer_id', buyerId || '');

    formData.append('is_draft', '2');

    if (selectedChoice === 'managedPartner') {
      formData.append('partnership_affiliation', '1');
    }

    formData.append('partner', data.selectPartner || '');
    formData.append('referral_bonus_amount', data.referral_Bonus_Amount_Percentage || '');
    formData.append('referral_bonus_criteria', data.referralBonousCriteria || '');
    formData.append('mou_status', data.mouStatus || '');
    formData.append('specific_remarks', data.specific_remarks || '');

    try {
      const response = await api.post('/api/buyer/partnership-details', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      localStorage.setItem('buyer_id', response.data.data);
      showAlert({ type: 'success', message: 'Draft Saved' });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.response?.data?.detail || error.message;
        showAlert({ type: 'error', message: `Failed to save draft: ${errorMessage}` });
      } else {
        showAlert({ type: 'error', message: 'An unexpected error occurred while saving the draft.' });
      }
    }
  };

  const onDraftCancel = async (data: FormValues) => {
    const formData = new FormData();
    const buyerId = id;

    formData.append('buyer_id', buyerId || '');

    formData.append('is_draft', '2');

    if (selectedChoice === 'managedPartner') {
      formData.append('partnership_affiliation', '1');
    }

    formData.append('partner', data.selectPartner || '');
    formData.append('referral_bonus_amount', data.referral_Bonus_Amount_Percentage || '');
    formData.append('referral_bonus_criteria', data.referralBonousCriteria || '');
    formData.append('mou_status', data.mouStatus || '');
    formData.append('specific_remarks', data.specific_remarks || '');

    try {
      const response = await api.post('/api/buyer/partnership-details', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      localStorage.setItem('buyer_id', response.data.data);
      showAlert({ type: 'success', message: 'Draft Saved' });
      navigate('/prospects?tab=investors');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.response?.data?.detail || error.message;
        showAlert({ type: 'error', message: `Failed to save draft: ${errorMessage}` });
      } else {
        showAlert({ type: 'error', message: 'An unexpected error occurred while saving the draft.' });
      }
    }
  };

  const [countries, setCountries] = useState<Country[]>([]);
  useEffect(() => {
    api
      .get('/api/countries')
      .then((res) => {
        setCountries(res.data);
      })
      .catch(() => showAlert({ type: "error", message: "Failed to fetch countries" }))
      .finally(() => setLoading(false));
  }, []);

  const getCountryById = (id: number) => countries.find((c) => c.id === id);

  const hqCountry = selectedPartnerDetails?.partner_overview?.hq_country;
  const countryData = hqCountry ? getCountryById(parseInt(hqCountry)) : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="pl-[15px]  font-poppins">
        <div className="flex gap-[70px] ">
          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none">
            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
              Partnership Affiliation for This Project ?
            </p>
            <svg
              width="394"
              height="2"
              viewBox="0 0 394 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 1H394" stroke="#BCC2C5" />
            </svg>

            <span className="text-[#000000] text-sm">
              What was the management structure for this project? <br />
              Please select whether the project was fully managed by <br />
              us or if there were partnership shares involved.&quot;
            </span>
          </div>

          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none ">
            <div
              className="flex justify-start items-start flex-col gap-[15px] w-[178px] mt-[55px]"
              style={{ width: '178px' }}
            >
              <div className="flex justify-start items-center flex-row gap-[17px]">
                <input
                  type="radio"
                  name="managedBy"
                  checked={selectedChoice === 'managedByUs'}
                  onChange={() => handleChange('managedByUs')}
                  className="w-5 h-5 rounded-full border-[#064771] border-2 checked:bg-[#064771] focus:outline-none"
                />
                <span
                  className={`text-[#30313D] leading-[19.28569984436035px] ${selectedChoice === 'managedByUs' ? 'font-semibold' : ''
                    }`}
                >
                  Managed by Us
                </span>
              </div>
              <div className="flex self-stretch justify-start items-center flex-row gap-[17px]">
                <input
                  type="radio"
                  name="managedBy"
                  checked={selectedChoice === 'managedPartner'}
                  onChange={() => handleChange('managedPartner')}
                  className="w-5 h-5 rounded-full border-[#D1D5DB] border-2 checked:bg-[#D1D5DB] focus:outline-none"
                />
                <span
                  className={`text-[#30313D] leading-[19.28569984436035px] ${selectedChoice === 'managedPartner' ? 'font-semibold' : ''
                    } whitespace-nowrap`}
                >
                  Managed Partner
                </span>
              </div>
            </div>
          </div>

          <div className="border-l ml-[206px] mt-[70px] ">
            <div className="flex self-stretch justify-start items-start flex-col gap-[23px]  ml-7 ">
              <div className="flex justify-start items-center flex-row gap-1.5">
                <svg
                  width="26"
                  height="27"
                  viewBox="0 0 26 27"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.7895 22.6763H10.3012C9.89191 22.6763 9.56206 22.3441 9.56206 21.9372V21.4177C9.56692 20.9712 9.54504 20.6575 9.49803 20.4825C9.24598 19.5593 8.57898 18.7854 7.93305 18.0349C7.7199 17.7893 7.51891 17.5551 7.33412 17.3193C6.40453 16.1368 5.91016 14.7201 5.91016 13.2176C5.91016 9.54944 8.89587 6.56616 12.564 6.56616C16.2313 6.56616 19.2162 9.54944 19.2162 13.2176C19.2162 14.7209 18.7242 16.1392 17.7922 17.3209C17.6293 17.53 17.4413 17.7488 17.2452 17.9798C16.5838 18.7578 15.8455 19.6258 15.591 20.5424C15.5464 20.7061 15.5246 21.0003 15.5278 21.412V21.9356C15.5278 22.3441 15.1979 22.6763 14.7895 22.6763ZM11.0419 21.1965H14.0503C14.0585 20.621 14.1144 20.3374 14.1654 20.1526C14.5083 18.9183 15.3576 17.9157 16.1073 17.0356C16.3042 16.8038 16.4768 16.6012 16.63 16.4083C17.3538 15.4876 17.7371 14.3862 17.7371 13.2184C17.7371 10.3656 15.4176 8.04443 12.5648 8.04443C9.71199 8.04443 7.39085 10.3656 7.39085 13.2184C7.39085 14.3838 7.77339 15.486 8.49793 16.4067C8.66894 16.6255 8.85615 16.8403 9.05471 17.0696C9.73793 17.8631 10.5848 18.8461 10.9269 20.0951C10.9771 20.2904 11.0355 20.5878 11.0419 21.1965Z"
                    fill="#DD7A01"
                  />
                  <path
                    d="M14.7899 24.6331H10.3016C9.89235 24.6331 9.5625 24.3017 9.5625 23.8924C9.5625 23.4839 9.89235 23.1541 10.3016 23.1541H14.7899C15.1984 23.1541 15.5282 23.4839 15.5282 23.8924C15.5282 24.3017 15.1984 24.6331 14.7899 24.6331Z"
                    fill="#DD7A01"
                  />
                  <path
                    d="M13.6685 26.5878H11.4243C11.0151 26.5878 10.6836 26.2563 10.6836 25.8487C10.6836 25.4402 11.0151 25.1079 11.4243 25.1079H13.6685C14.0753 25.1079 14.4076 25.4402 14.4076 25.8487C14.4076 26.2563 14.0753 26.5878 13.6685 26.5878Z"
                    fill="#DD7A01"
                  />
                  <path
                    d="M24.3887 13.9558H21.4322C21.0237 13.9558 20.6914 13.626 20.6914 13.2167C20.6914 12.8082 21.0237 12.4775 21.4322 12.4775H24.3887C24.7972 12.4775 25.127 12.8082 25.127 13.2167C25.127 13.626 24.7972 13.9558 24.3887 13.9558Z"
                    fill="#DD7A01"
                  />
                  <path
                    d="M3.69567 13.9558H0.738322C0.329854 13.9558 0 13.626 0 13.2167C0 12.8082 0.329854 12.4775 0.738322 12.4775H3.69485C4.10332 12.4775 4.43561 12.8082 4.43561 13.2167C4.43642 13.626 4.10413 13.9558 3.69567 13.9558Z"
                    fill="#DD7A01"
                  />
                  <path
                    d="M12.565 5.08901C12.1557 5.08901 11.8242 4.75915 11.8242 4.34987V1.39172C11.8242 0.984063 12.1557 0.652588 12.565 0.652588C12.9743 0.652588 13.3041 0.984063 13.3041 1.39172V4.34906C13.3041 4.75834 12.9743 5.08901 12.565 5.08901Z"
                    fill="#DD7A01"
                  />
                  <path
                    d="M20.9222 22.3188C20.7342 22.3188 20.5454 22.2467 20.4003 22.1016L18.3101 20.0107C18.0216 19.7229 18.0216 19.2537 18.3101 18.9644C18.5995 18.6758 19.0671 18.6775 19.3556 18.966L21.4458 21.0561C21.7351 21.3455 21.7351 21.8147 21.4458 22.1032C21.3015 22.2483 21.1135 22.3188 20.9222 22.3188Z"
                    fill="#DD7A01"
                  />
                  <path
                    d="M6.29003 7.68633C6.102 7.68633 5.91236 7.6142 5.76647 7.46913L3.67794 5.37979C3.3886 5.09045 3.3886 4.6212 3.67794 4.33187C3.96727 4.04335 4.4349 4.04335 4.72342 4.33187L6.81358 6.42203C7.10291 6.71055 7.10291 7.18061 6.81358 7.46913C6.66932 7.6142 6.48048 7.68633 6.29003 7.68633Z"
                    fill="#DD7A01"
                  />
                  <path
                    d="M4.20068 22.3184C4.01184 22.3184 3.82301 22.2479 3.67794 22.1028C3.3886 21.8143 3.3886 21.3451 3.67794 21.0557L5.76972 18.9639C6.05662 18.6754 6.52425 18.6754 6.81358 18.9639C7.10291 19.2533 7.10291 19.7225 6.81358 20.0119L4.72342 22.1028C4.57835 22.2471 4.39032 22.3184 4.20068 22.3184Z"
                    fill="#DD7A01"
                  />
                  <path
                    d="M18.8364 7.68699C18.6476 7.68699 18.4587 7.61486 18.3128 7.46979C18.0259 7.18127 18.0259 6.71283 18.3128 6.42431L20.403 4.33415C20.6899 4.04563 21.1608 4.044 21.4485 4.33253C21.7378 4.62186 21.7378 5.08949 21.4485 5.37882L19.3599 7.46817C19.2157 7.61324 19.0268 7.68699 18.8364 7.68699Z"
                    fill="#DD7A01"
                  />
                </svg>
                <span className="text-[#000000] text-lg font-medium">Hints</span>
              </div>
              <div className="self-stretch text-[#30313D] text-sm w-[320px]">
                <div className="text-[#30313D] text-sm">
                  <div className="self-stretch text-[#30313D] text-sm">
                    <ul className="list-disc pl-5">
                      <li>
                        Select &quot;Managed by Us&quot; if your team is handling the deal directly
                      </li>
                      <li>
                        Choose &quot;Managed Partner&quot; if an external partner is leading this
                        opportunity
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-300 h-[1px] w-[900px] ml-6"></div>

        {selectedChoice === 'managedByUs' && (
          <div className="flex gap-[10px]  w-[975px] mt-[-20px] blur-sm pointer-events-none">
            <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none">
              <div className="flex items-center gap-2">
                <Label text="Select Partner" required />

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="mt-7"
                >
                  <path
                    d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                    fill="#064771"
                  />
                  <path
                    d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                    fill="#064771"
                  />
                  <path
                    d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                    fill="#064771"
                  />
                </svg>

                <div className="flex row-auto ml-[20px] mt-[25px] ">
                  <span className="text-[#064771] text-sm font-medium leading-[19.28569984436035px] underline">
                    Register Partner Here
                  </span>

                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-2 mt-1"
                  >
                    <path
                      d="M9 6.71429V1M9 1H3.28571M9 1L1 9"
                      stroke="#064771"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="w-[380px]">
                <Controller
                  control={control}
                  name="selectPartner"
                  render={({ field }) => (
                    <SelectPicker
                      options={partnerOptions}
                      value={field.value}
                      onChange={field.onChange}
                      searchable={true}
                      placeholder="Select from Registered Partners"
                    />
                  )}
                />
              </div>

              <Label text="Referral Bonus Criteria" required />

              <div className="w-[380px]">
                <SelectPicker
                  options={options}
                  onChange={handleSelect}
                  value={selectedOption}
                  searchable={true}
                  placeholder="e.g., Profit Share/ Success Fee / Custom"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label text="Referral Bonus Amount / Percentage" required />

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="mt-7"
                >
                  <path
                    d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                    fill="#064771"
                  />
                  <path
                    d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                    fill="#064771"
                  />
                  <path
                    d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                    fill="#064771"
                  />
                </svg>
              </div>

              <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
                <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                  <Input
                    {...register('referral_Bonus_Amount_Percentage', {})}
                    placeholder="Write the name of certification or license"
                    className="w-[380px]"
                  />
                </div>
              </div>

              <Label text="MOU Status" required />
              <div className="w-[380px]">
                <SelectPicker
                  options={options}
                  onChange={handleSelect}
                  value={selectedOption}
                  searchable={true}
                  placeholder="e.g., MOU Signed or Not Yet"
                />
              </div>

              <Label text="Specific Remarks" required />

              <div className="flex items-center gap-3 p-[10px_20px_10px_20px] bg-white border border-gray-300 rounded-md w-[370px] h-[215px]">
                <textarea
                  placeholder="Highlight the partner's strengths and synergies relevant to the buyer."
                  className="w-full h-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none">
              <div className=" w-[424px] h-[732px] bg-[#FBFDFF] mt-[25px] ml-[-100px]">
                <Label text="Partner Details " />

                <div className="flex self-stretch justify-center items-center flex-col gap-2.5 bg-[#F7F7F7] border-dashed border-[#727272] border-[1.8980880975723267px] rounded-[12.337573051452637px] h-[639px] mt-[32px] ">
                  <div
                    className="flex justify-center items-center flex-col gap-[23px] w-[221px]"
                    style={{ width: '321px' }}
                  >
                    <div
                      className="flex justify-start items-center flex-col gap-[22.777057647705078px] w-[222px] h-[99px] "
                      style={{ width: '222px' }}
                    >
                      <svg
                        width="63"
                        height="53"
                        viewBox="0 0 63 53"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M55.498 25.4898L62.4745 20.3237L56.4441 0L25.4035 0.99483L22.4131 5.63858L11.7824 3.0816L0.554688 26.2613L5.669 30.6633L2.96871 34.842C2.11587 36.1619 1.82804 37.7348 2.15831 39.2712C2.48847 40.8076 3.39732 42.1233 4.7171 42.9761C5.68013 43.5985 6.77812 43.9199 7.89824 43.9199C8.19308 43.9199 8.48926 43.8966 8.78507 43.8516C9.15961 45.1835 10.0001 46.3898 11.2507 47.1979C12.2354 47.8343 13.3408 48.1381 14.4342 48.1381C14.7295 48.1381 15.0235 48.1132 15.3143 48.0695C15.7011 49.453 16.5673 50.6334 17.7842 51.4198C18.769 52.0562 19.8743 52.36 20.9677 52.36C22.8994 52.36 24.794 51.4113 25.9181 49.6714L26.7204 48.4297L31.4192 51.5448L31.4388 51.5577C32.4018 52.18 33.4998 52.5016 34.6199 52.5016C35.0347 52.5016 35.4528 52.4575 35.868 52.3683C37.4044 52.0381 38.72 51.1292 39.5729 49.8096C40.1731 48.8806 40.477 47.8444 40.5096 46.8121C40.8106 46.7945 41.1124 46.7543 41.413 46.6897C42.9493 46.3595 44.265 45.4506 45.1179 44.131C45.7062 43.2205 46.0254 42.1894 46.0584 41.1333C46.3582 41.1155 46.6586 41.0755 46.9577 41.0111C48.4942 40.6809 49.8099 39.7723 50.6627 38.4523C51.2635 37.5226 51.5674 36.4851 51.5994 35.4518C53.4102 35.3467 55.1499 34.4106 56.2073 32.7737C57.0602 31.4538 57.348 29.8809 57.018 28.3445C56.783 27.2517 56.2557 26.2707 55.498 25.4898ZM27.6227 4.91283L53.4969 4.08369L57.8579 18.7811L52.0578 23.0759L29.8786 8.6348L23.5828 18.1902L23.5731 18.205C23.0055 19.083 21.8297 19.3357 20.9517 18.7686C20.0737 18.2013 19.821 17.0253 20.39 16.1446L27.6227 4.91283ZM9.50235 39.0639C8.93467 39.9421 7.75867 40.1947 6.88103 39.6275C6.4557 39.3526 6.16279 38.9286 6.05636 38.4335C5.95006 37.9384 6.0427 37.4315 6.31771 37.0062L10.3051 30.8351C10.6676 30.2743 11.2778 29.9687 11.9005 29.9687C12.2528 29.9687 12.6092 30.0667 12.9266 30.2717C13.3519 30.5466 13.6447 30.9704 13.7511 31.4656C13.8575 31.9607 13.7648 32.4676 13.49 32.893L9.50235 39.0639ZM16.036 43.2857C15.4683 44.1637 14.2924 44.4162 13.4145 43.8492C12.5365 43.2819 12.2838 42.1059 12.8512 41.2279L16.8388 35.0568C17.2012 34.496 17.8115 34.1904 18.4342 34.1904C18.7865 34.1904 19.1429 34.2884 19.4602 34.4935C20.3382 35.0608 20.591 36.2368 20.0236 37.1148L16.036 43.2857ZM26.5569 41.3365L22.5694 47.5075C22.0021 48.3858 20.8261 48.6382 19.9482 48.071C19.5228 47.7961 19.2299 47.3721 19.1236 46.877C19.0172 46.3818 19.1098 45.875 19.3847 45.4495L23.3723 39.2785C23.6472 38.8531 24.071 38.5603 24.5662 38.4539C24.7 38.4253 24.8346 38.411 24.9682 38.411C25.3292 38.411 25.683 38.5146 25.9933 38.7153C26.8715 39.2826 27.1242 40.4585 26.5569 41.3365ZM52.8586 30.6094C52.5837 31.0348 52.1598 31.3276 51.6647 31.434C51.1696 31.5405 50.6626 31.4477 50.2374 31.1729L48.9145 30.3181L48.9143 30.318L42.7431 26.3304L40.5793 29.6792L41.9024 30.5342L46.7505 33.667C47.1759 33.9419 47.4686 34.3658 47.5751 34.8609C47.6815 35.356 47.5887 35.863 47.314 36.2883C47.0392 36.7136 46.6151 37.0065 46.1201 37.113C45.6248 37.2193 45.1181 37.1266 44.6927 36.8519L38.5216 32.8643L36.3578 36.2131L41.2058 39.3456C42.0838 39.9129 42.3366 41.0888 41.7692 41.9669C41.4943 42.3922 41.0703 42.6851 40.5753 42.7916C40.0801 42.8979 39.5734 42.8052 39.148 42.5305L33.8803 39.1267L31.7165 42.4754L35.6611 45.0243C36.5391 45.5919 36.7919 46.7676 36.2245 47.6457C35.9496 48.0711 35.5257 48.364 35.0306 48.4704C34.5386 48.5761 34.0351 48.4852 33.6114 48.2144L28.8851 45.081L29.9061 43.5006C31.6666 40.776 30.8824 37.127 28.1578 35.3666C26.9062 34.5579 25.4598 34.2876 24.0908 34.4942C23.7166 33.1611 22.8758 31.9535 21.6244 31.1448C20.3736 30.3367 18.9284 30.0662 17.5603 30.272C17.1734 28.889 16.3074 27.7091 15.0907 26.923C12.8389 25.4677 9.95598 25.7528 8.02909 27.4339L5.48022 25.2401L13.9718 7.70926L20.1272 9.18966L17.04 13.9835C15.2795 16.7081 16.0638 20.357 18.7884 22.1175C21.5102 23.8764 25.1548 23.095 26.9174 20.377L31.0268 14.14L52.296 27.9883C52.7212 28.2631 53.0141 28.687 53.1205 29.1821C53.2262 29.6771 53.1335 30.184 52.8586 30.6094Z"
                          fill="#D9D9D9"
                        />
                      </svg>
                      <div className="flex justify-start items-center flex-col gap-[7.1178297996521px]">
                        <span className="text-[#292D32] text-[14.2356595993042px] text-center font-medium">
                          No Partner has been Selected
                        </span>
                        <span className="text-[#838383] text-[12.337573051452637px] text-center">
                          Select a Partner to get preview here
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-300 h-[800px] w-[3px]  ml-[74px] mt-0"></div>
          </div>
        )}

        {selectedChoice === 'managedPartner' && (
          <div className="flex gap-[10px]  w-[975px] mt-[-20px] ">
            <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none">
              <div className="flex items-center gap-2">
                <Label text="Select Partner" required />

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="mt-7"
                >
                  <path
                    d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                    fill="#064771"
                  />
                  <path
                    d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                    fill="#064771"
                  />
                  <path
                    d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                    fill="#064771"
                  />
                </svg>

                <div className="flex row-auto ml-[20px] mt-[25px] ">
                  <button
                    type="button"
                    className="text-[#064771] text-sm font-medium leading-[19.28569984436035px] underline bg-transparent border-none cursor-pointer"
                    onClick={() => navigate('/partner-portal/create')}
                  >
                    Register Partner Here
                  </button>

                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-2 mt-1"
                  >
                    <path
                      d="M9 6.71429V1M9 1H3.28571M9 1L1 9"
                      stroke="#064771"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="w-[380px]">
                <Controller
                  control={control}
                  name="selectPartner"
                  render={({ field }) => (
                    <SelectPicker
                      options={partnerOptions}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        handlePartnerSelect(value);
                      }}
                      searchable
                      placeholder="Select from Registered Partners"
                    />
                  )}
                />
              </div>

              <Label text="Referral Bonus Criteria" required />

              <div className="w-[380px]">
                <Controller
                  control={control}
                  name="referralBonousCriteria"
                  render={({ field }) => (
                    <SelectPicker
                      options={referralBonousCriteriaOptions}
                      value={field.value}
                      onChange={field.onChange}
                      searchable={false}
                      placeholder="e.g., Select current status of prospect"
                    />
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <Label text="Referral Bonus Amount / Percentage" required />

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="mt-7"
                >
                  <path
                    d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                    fill="#064771"
                  />
                  <path
                    d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                    fill="#064771"
                  />
                  <path
                    d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                    fill="#064771"
                  />
                </svg>
              </div>

              <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
                <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                  <Input
                    {...register('referral_Bonus_Amount_Percentage', {})}
                    placeholder="Write the name of certification or license"
                    className="w-[380px]"
                  />
                </div>
              </div>

              <Label text="MOU Status" required />
              <div className="w-[380px]">
                <Controller
                  control={control}
                  name="mouStatus"
                  render={({ field }) => (
                    <SelectPicker
                      options={mouStatusOptions}
                      value={field.value}
                      onChange={field.onChange}
                      searchable={false}
                      placeholder="e.g., Select current status of prospect"
                    />
                  )}
                />
              </div>

              <Label text="Specific Remarks" required />

              <div className="flex items-center gap-3 p-[10px_20px_10px_20px] bg-white border border-gray-300 rounded-md w-[370px] h-[215px]">
                <textarea
                  {...register('specific_remarks', {})}
                  placeholder="Highlight the partner's strengths and synergies relevant to the buyer."
                  className="w-full h-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-2 rounded-none ">
              <div className=" w-[424px] h-[732px] bg-[#FBFDFF] mt-[25px]">
                <Label text="Partner Details " />

                <div
                  className={`flex self-stretch justify-start items-start flex-col gap-2.5 border-dashed rounded-[12.337573051452637px] h-[639px] mt-[32px] ml-4 ${!selectedPartnerDetails ? 'blur-sm pointer-events-none' : ''
                    }`}
                >
                  <div className="flex self-stretch justify-start items-center flex-row gap-4 ">
                    <div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-gray-200">
                      <img
                        src={
                          selectedPartnerDetails?.partner_image
                            ? `${import.meta.env.VITE_API_BASE_URL}${selectedPartnerDetails.partner_image
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
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start ">
                      {selectedPartnerDetails && (
                        <p className="self-stretch text-[#30313D] text-xl font-semibold leading-[30px]">
                          {selectedPartnerDetails?.partner_overview?.reg_name || 'Unnamed Partner'}
                        </p>
                      )}

                      <div className="flex justify-start items-center flex-row gap-2.5 w-[159px]">
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
                    </div>
                  </div>
                  <div className="flex self-stretch justify-start items-start flex-col gap-6 mt-[25px]">
                    <div className="flex self-stretch justify-between items-start flex-col gap-2.5 h-[30px]">
                      <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                        Contact
                      </span>
                      <span className="text-[#30313D] text-sm font-medium leading-[22px]">
                        {selectedPartnerDetails?.partner_overview?.company_phone
                          ? selectedPartnerDetails.partner_overview.company_phone.length > 40
                            ? `${selectedPartnerDetails.partner_overview.company_phone.slice(
                              0,
                              40
                            )}...`
                            : selectedPartnerDetails.partner_overview.company_phone
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex self-stretch justify-between items-start flex-col gap-2.5 h-[66px]">
                      <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                        Address
                      </span>
                      <span className="text-[#30313D] text-sm leading-[22px]">
                        {selectedPartnerDetails?.partner_overview?.hq_address
                          ? selectedPartnerDetails.partner_overview.hq_address.length > 40
                            ? `${selectedPartnerDetails.partner_overview.hq_address.slice(
                              0,
                              40
                            )}...`
                            : selectedPartnerDetails.partner_overview.hq_address
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex self-stretch justify-between items-start flex-col gap-2.5 h-[30px]">
                      <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                        Partner’s Website
                      </span>
                      <span className="text-[#064771] text-sm font-medium leading-[22px]">
                        {selectedPartnerDetails?.partner_overview?.website
                          ? selectedPartnerDetails.partner_overview.website.length > 30
                            ? selectedPartnerDetails.partner_overview.website.slice(0, 40) + '...'
                            : selectedPartnerDetails.partner_overview.website
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <svg
                    width="375"
                    height="2"
                    viewBox="0 0 375 2"
                    className="mt-10 mb-6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M0.015625 1H374.516" stroke="#064771" strokeDasharray="4 5" />
                  </svg>

                  <div className="flex self-stretch justify-start items-start flex-col gap-6">
                    <div className="flex self-stretch justify-start items-center flex-row gap-[13px]">
                      <div
                        className="flex justify-center items-center flex-col gap-2.5 py-[7px] px-1.5 bg-[#FFFFFF] border-solid border-[#064771] border-[0.5px] rounded-[20.5px] w-[34px] h-[34px]"
                        style={{ width: '34px' }}
                      >
                        <svg
                          width="23"
                          height="20"
                          viewBox="0 0 23 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M19.8502 9.73544L22.2745 7.94027L20.179 0.87793L9.39259 1.22363L8.35345 2.83729L4.65935 1.94876L0.757812 10.0035L2.535 11.5332L1.59667 12.9853C1.30031 13.4439 1.20029 13.9905 1.31506 14.5244C1.42979 15.0582 1.7456 15.5154 2.20422 15.8118C2.53886 16.0281 2.92041 16.1398 3.30964 16.1398C3.41209 16.1398 3.51501 16.1316 3.61781 16.116C3.74796 16.5788 4.04003 16.998 4.47461 17.2788C4.81677 17.5 5.20088 17.6055 5.58082 17.6055C5.68345 17.6055 5.78561 17.5969 5.88668 17.5817C6.02107 18.0625 6.32205 18.4726 6.74495 18.7459C7.08716 18.9671 7.47122 19.0726 7.85117 19.0726C8.52243 19.0726 9.18079 18.7429 9.57141 18.1384L9.8502 17.7069L11.483 18.7893L11.4898 18.7938C11.8244 19.0101 12.206 19.1218 12.5952 19.1218C12.7394 19.1218 12.8846 19.1065 13.0289 19.0755C13.5628 18.9608 14.02 18.6449 14.3163 18.1864C14.5249 17.8636 14.6305 17.5035 14.6418 17.1448C14.7464 17.1386 14.8513 17.1247 14.9557 17.1022C15.4896 16.9875 15.9468 16.6717 16.2432 16.2131C16.4476 15.8967 16.5585 15.5384 16.57 15.1714C16.6742 15.1652 16.7786 15.1513 16.8825 15.129C17.4164 15.0142 17.8736 14.6985 18.17 14.2398C18.3787 13.9167 18.4843 13.5562 18.4954 13.1971C19.1247 13.1606 19.7292 12.8354 20.0967 12.2665C20.393 11.8079 20.493 11.2613 20.3784 10.7274C20.2967 10.3477 20.1135 10.0068 19.8502 9.73544ZM10.1637 2.5851L19.1548 2.29698L20.6702 7.4042L18.6548 8.89663L10.9476 3.87845L8.75991 7.19887L8.75655 7.20404C8.55928 7.50914 8.15072 7.59693 7.84562 7.39987C7.54052 7.20274 7.45269 6.79409 7.65041 6.48806L10.1637 2.5851ZM3.86705 14.4523C3.66979 14.7575 3.26114 14.8453 2.95617 14.6482C2.80837 14.5527 2.70658 14.4053 2.6696 14.2333C2.63266 14.0612 2.66485 13.8851 2.76042 13.7373L4.14601 11.5929C4.27196 11.398 4.48402 11.2918 4.7004 11.2918C4.82282 11.2918 4.94667 11.3259 5.05694 11.3971C5.20474 11.4926 5.30649 11.6399 5.34347 11.812C5.38045 11.984 5.34822 12.1602 5.25274 12.308L3.86705 14.4523ZM6.13744 15.9194C5.94018 16.2245 5.53157 16.3122 5.22651 16.1152C4.92141 15.918 4.83358 15.5094 5.03076 15.2043L6.4164 13.0599C6.54235 12.865 6.75441 12.7588 6.97079 12.7588C7.09321 12.7588 7.21706 12.7929 7.32733 12.8641C7.63243 13.0613 7.72026 13.4699 7.52312 13.775L6.13744 15.9194ZM9.79338 15.242L8.40774 17.3864C8.2106 17.6916 7.80196 17.7793 7.4969 17.5822C7.3491 17.4867 7.24731 17.3394 7.21037 17.1673C7.17339 16.9953 7.20558 16.8191 7.30111 16.6713L8.68674 14.5269C8.78227 14.3791 8.92956 14.2773 9.10161 14.2404C9.14813 14.2304 9.19491 14.2254 9.2413 14.2254C9.36675 14.2254 9.48971 14.2615 9.59755 14.3312C9.90269 14.5283 9.99052 14.9369 9.79338 15.242ZM18.933 11.5145C18.8375 11.6623 18.6902 11.764 18.5181 11.801C18.3461 11.838 18.1699 11.8057 18.0222 11.7103L17.5625 11.4132L17.5624 11.4132L15.418 10.0276L14.6661 11.1912L15.1258 11.4883L16.8105 12.5769C16.9583 12.6725 17.06 12.8198 17.097 12.9918C17.134 13.1639 17.1018 13.34 17.0063 13.4878C16.9108 13.6356 16.7634 13.7374 16.5914 13.7744C16.4193 13.8113 16.2433 13.7791 16.0954 13.6837L13.951 12.298L13.1991 13.4617L14.8838 14.5502C15.1889 14.7474 15.2767 15.156 15.0795 15.4611C14.984 15.6089 14.8367 15.7107 14.6647 15.7477C14.4926 15.7846 14.3165 15.7524 14.1687 15.6569L12.3382 14.4741L11.5863 15.6378L12.957 16.5235C13.2621 16.7207 13.35 17.1293 13.1528 17.4345C13.0573 17.5823 12.91 17.684 12.7379 17.721C12.567 17.7577 12.392 17.7261 12.2448 17.6321L10.6024 16.5432L10.9572 15.9941C11.569 15.0473 11.2964 13.7793 10.3497 13.1676C9.91475 12.8865 9.41213 12.7926 8.93641 12.8644C8.80639 12.4012 8.51423 11.9815 8.07936 11.7005C7.64474 11.4197 7.14255 11.3257 6.66712 11.3972C6.53268 10.9166 6.23174 10.5066 5.80898 10.2335C5.02647 9.72775 4.02469 9.82684 3.35511 10.411L2.4694 9.64866L5.42016 3.55684L7.55909 4.07126L6.48633 5.73708C5.87458 6.68386 6.14711 7.95183 7.09388 8.56358C8.03969 9.17479 9.30615 8.90327 9.91866 7.95876L11.3466 5.79146L18.7375 10.6036C18.8853 10.6992 18.987 10.8464 19.024 11.0185C19.0608 11.1905 19.0285 11.3666 18.933 11.5145Z"
                            fill="#064771"
                          />
                        </svg>
                      </div>
                      <div
                        className="flex justify-start items-start flex-col gap-[9px] w-[173px]"
                        style={{ width: '173px' }}
                      >
                        <p className="self-stretch text-[#838383] text-sm">Contact Person</p>
                        <p className="self-stretch text-[#30313D] text-lg font-medium text-nowrap">
                          {selectedPartnerDetails?.partner_overview?.contact_person_name
                            ? selectedPartnerDetails.partner_overview.contact_person_name.length >
                              25
                              ? `${selectedPartnerDetails.partner_overview.contact_person_name.slice(
                                0,
                                25
                              )}...`
                              : selectedPartnerDetails.partner_overview.contact_person_name
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex self-stretch justify-start items-start flex-col gap-2.5">
                      <div className="flex justify-start items-center flex-row gap-2.5">
                        <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                          Person’s Contact Email
                        </span>
                        <button>
                          <svg
                            width="12"
                            height="14"
                            viewBox="0 0 12 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11.2105 1.82687L9.93526 0.509758C9.77865 0.348939 9.5915 0.221011 9.38479 0.133476C9.17808 0.045941 8.95598 0.000561924 8.7315 0L6.09896 0C5.45564 0.000812109 4.83228 0.223384 4.33393 0.630201C3.83557 1.03702 3.49271 1.6032 3.36312 2.23333H3.30729C2.56717 2.23422 1.85761 2.52862 1.33426 3.05197C0.810917 3.57532 0.516512 4.28487 0.515625 5.025V10.6083C0.516512 11.3485 0.810917 12.058 1.33426 12.5814C1.85761 13.1047 2.56717 13.3991 3.30729 13.4H6.65729C7.39741 13.3991 8.10697 13.1047 8.63032 12.5814C9.15366 12.058 9.44807 11.3485 9.44896 10.6083V10.5525C10.0791 10.4229 10.6453 10.08 11.0521 9.58169C11.4589 9.08334 11.6815 8.45998 11.6823 7.81666V2.99267C11.6831 2.5574 11.5138 2.13904 11.2105 1.82687ZM6.65729 12.2833H3.30729C2.86305 12.2833 2.43701 12.1069 2.12289 11.7927C1.80876 11.4786 1.63229 11.0526 1.63229 10.6083V5.025C1.63229 4.58076 1.80876 4.15472 2.12289 3.84059C2.43701 3.52647 2.86305 3.35 3.30729 3.35V7.81666C3.30818 8.55679 3.60258 9.26634 4.12593 9.78969C4.64928 10.313 5.35883 10.6074 6.09896 10.6083H8.33229C8.33229 11.0526 8.15582 11.4786 7.84169 11.7927C7.52757 12.1069 7.10153 12.2833 6.65729 12.2833ZM8.89062 9.49166H6.09896C5.65472 9.49166 5.22868 9.31519 4.91455 9.00107C4.60043 8.68694 4.42396 8.2609 4.42396 7.81666V2.79167C4.42396 2.34743 4.60043 1.92139 4.91455 1.60726C5.22868 1.29314 5.65472 1.11667 6.09896 1.11667H8.33229V2.23333C8.33229 2.52949 8.44994 2.81352 8.65935 3.02293C8.86877 3.23235 9.1528 3.35 9.44896 3.35H10.5656V7.81666C10.5656 8.2609 10.3891 8.68694 10.075 9.00107C9.7609 9.31519 9.33486 9.49166 8.89062 9.49166Z"
                              fill="#838383"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                        <svg
                          width="16"
                          height="13"
                          viewBox="0 0 16 13"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.3906 0.399902H3.64062C2.81213 0.400768 2.01785 0.688383 1.43201 1.19966C0.846176 1.71093 0.516617 2.40412 0.515625 3.12718L0.515625 9.67263C0.516617 10.3957 0.846176 11.0889 1.43201 11.6001C2.01785 12.1114 2.81213 12.399 3.64062 12.3999H12.3906C13.2191 12.399 14.0134 12.1114 14.5992 11.6001C15.1851 11.0889 15.5146 10.3957 15.5156 9.67263V3.12718C15.5146 2.40412 15.1851 1.71093 14.5992 1.19966C14.0134 0.688383 13.2191 0.400768 12.3906 0.399902ZM3.64062 1.49081H12.3906C12.7649 1.49145 13.1303 1.58982 13.44 1.77325C13.7496 1.95668 13.9893 2.21678 14.1281 2.52008L9.34188 6.69772C8.98964 7.00389 8.51276 7.17579 8.01562 7.17579C7.51849 7.17579 7.04161 7.00389 6.68938 6.69772L1.90313 2.52008C2.04197 2.21678 2.28163 1.95668 2.59128 1.77325C2.90093 1.58982 3.26638 1.49145 3.64062 1.49081ZM12.3906 11.309H3.64062C3.14334 11.309 2.66643 11.1366 2.3148 10.8297C1.96317 10.5228 1.76562 10.1066 1.76562 9.67263V3.94536L5.80563 7.46899C6.39227 7.97968 7.18704 8.26647 8.01562 8.26647C8.84421 8.26647 9.63898 7.97968 10.2256 7.46899L14.2656 3.94536V9.67263C14.2656 10.1066 14.0681 10.5228 13.7165 10.8297C13.3648 11.1366 12.8879 11.309 12.3906 11.309Z"
                            fill="#064771"
                          />
                        </svg>
                        <span className="text-[#064771] text-sm font-medium leading-[22px]">
                          {selectedPartnerDetails?.partner_overview?.contact_person_email
                            ? selectedPartnerDetails.partner_overview.contact_person_email.length >
                              20
                              ? `${selectedPartnerDetails.partner_overview.contact_person_email.slice(
                                0,
                                20
                              )}...`
                              : selectedPartnerDetails.partner_overview.contact_person_email
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex self-stretch justify-start items-start flex-col gap-2.5">
                      <div className="flex justify-start items-center flex-row gap-2.5">
                        <span className="text-[#838383] text-sm leading-[18.860000610351562px]">
                          Person’s Contact
                        </span>
                        <button>
                          <svg
                            width="12"
                            height="14"
                            viewBox="0 0 12 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11.2105 2.22677L9.93526 0.90966C9.77865 0.748841 9.5915 0.620913 9.38479 0.533378C9.17808 0.445843 8.95598 0.400464 8.7315 0.399902H6.09896C5.45564 0.400714 4.83228 0.623286 4.33393 1.0301C3.83557 1.43692 3.49271 2.00311 3.36312 2.63323H3.30729C2.56717 2.63412 1.85761 2.92853 1.33426 3.45187C0.810917 3.97522 0.516512 4.68478 0.515625 5.4249V11.0082C0.516512 11.7484 0.810917 12.4579 1.33426 12.9813C1.85761 13.5046 2.56717 13.799 3.30729 13.7999H6.65729C7.39741 13.799 8.10697 13.5046 8.63032 12.9813C9.15366 12.4579 9.44807 11.7484 9.44896 11.0082V10.9524C10.0791 10.8228 10.6453 10.4799 11.0521 9.9816C11.4589 9.48325 11.6815 8.85988 11.6823 8.21657V3.39257C11.6831 2.9573 11.5138 2.53894 11.2105 2.22677ZM6.65729 12.6832H3.30729C2.86305 12.6832 2.43701 12.5068 2.12289 12.1926C1.80876 11.8785 1.63229 11.4525 1.63229 11.0082V5.4249C1.63229 4.98066 1.80876 4.55462 2.12289 4.2405C2.43701 3.92637 2.86305 3.7499 3.30729 3.7499V8.21657C3.30818 8.95669 3.60258 9.66625 4.12593 10.1896C4.64928 10.7129 5.35883 11.0073 6.09896 11.0082H8.33229C8.33229 11.4525 8.15582 11.8785 7.84169 12.1926C7.52757 12.5068 7.10153 12.6832 6.65729 12.6832ZM8.89062 9.89157H6.09896C5.65472 9.89157 5.22868 9.71509 4.91455 9.40097C4.60043 9.08685 4.42396 8.6608 4.42396 8.21657V3.19157C4.42396 2.74733 4.60043 2.32129 4.91455 2.00716C5.22868 1.69304 5.65472 1.51657 6.09896 1.51657H8.33229V2.63323C8.33229 2.92939 8.44994 3.21342 8.65935 3.42284C8.86877 3.63225 9.1528 3.7499 9.44896 3.7499H10.5656V8.21657C10.5656 8.6608 10.3891 9.08685 10.075 9.40097C9.7609 9.71509 9.33486 9.89157 8.89062 9.89157Z"
                              fill="#838383"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                        <svg
                          width="18"
                          height="17"
                          viewBox="0 0 18 17"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.6189 1.46863C9.6189 1.29153 9.6929 1.12168 9.82462 0.996454C9.95633 0.871225 10.135 0.800871 10.3213 0.800871C12.1834 0.802815 13.9687 1.50697 15.2855 2.75885C16.6022 4.01073 17.3428 5.70808 17.3449 7.47851C17.3449 7.65561 17.2709 7.82546 17.1392 7.95069C17.0075 8.07592 16.8288 8.14627 16.6425 8.14627C16.4562 8.14627 16.2776 8.07592 16.1459 7.95069C16.0142 7.82546 15.9402 7.65561 15.9402 7.47851C15.9385 6.06218 15.346 4.70432 14.2926 3.70282C13.2392 2.70133 11.811 2.13799 10.3213 2.1364C10.135 2.1364 9.95633 2.06604 9.82462 1.94081C9.6929 1.81558 9.6189 1.64574 9.6189 1.46863ZM10.3213 4.80745C11.0664 4.80745 11.781 5.08887 12.3078 5.58979C12.8347 6.09071 13.1307 6.7701 13.1307 7.47851C13.1307 7.65561 13.2047 7.82546 13.3364 7.95069C13.4681 8.07592 13.6468 8.14627 13.8331 8.14627C14.0194 8.14627 14.198 8.07592 14.3297 7.95069C14.4614 7.82546 14.5354 7.65561 14.5354 7.47851C14.5343 6.41622 14.09 5.39775 13.2999 4.6466C12.5098 3.89545 11.4386 3.47299 10.3213 3.47193C10.135 3.47193 9.95633 3.54228 9.82462 3.66751C9.6929 3.79274 9.6189 3.96259 9.6189 4.13969C9.6189 4.31679 9.6929 4.48664 9.82462 4.61187C9.95633 4.7371 10.135 4.80745 10.3213 4.80745ZM16.7078 11.9786C17.1149 12.3666 17.3434 12.8923 17.3434 13.4403C17.3434 13.9883 17.1149 14.514 16.7078 14.902L16.0687 15.6025C10.3163 20.8385 -3.68175 7.53326 1.74049 2.04692L2.54821 1.37915C2.95682 1.00299 3.50478 0.794894 4.07353 0.799893C4.64229 0.804891 5.18611 1.02258 5.58733 1.40586C5.60911 1.42657 6.91059 3.03387 6.91059 3.03387C7.29677 3.41959 7.51174 3.93197 7.51083 4.46449C7.50991 4.99701 7.29317 5.50872 6.90567 5.89324L6.09233 6.8655C6.54244 7.90528 7.20422 8.85026 8.03964 9.64613C8.87506 10.442 9.86766 11.0731 10.9604 11.5031L11.9894 10.7252C12.3939 10.357 12.932 10.1512 13.4919 10.1505C14.0519 10.1497 14.5906 10.3541 14.9962 10.7212C14.9962 10.7212 16.6861 11.9579 16.7078 11.9786ZM15.7414 12.9495C15.7414 12.9495 14.0606 11.7201 14.0389 11.6994C13.8942 11.563 13.6987 11.4865 13.4949 11.4865C13.2911 11.4865 13.0956 11.563 12.9509 11.6994C12.9319 11.7181 11.5153 12.7912 11.5153 12.7912C11.4198 12.8635 11.3062 12.9108 11.1856 12.9286C11.065 12.9464 10.9417 12.9341 10.8277 12.8927C9.41202 12.3916 8.12619 11.6071 7.05726 10.5923C5.98834 9.57757 5.16128 8.35624 4.63212 7.01107C4.5852 6.9012 4.56991 6.78142 4.5878 6.66406C4.6057 6.5467 4.65615 6.43599 4.73396 6.34331C4.73396 6.34331 5.86266 4.99576 5.88162 4.9784C6.02509 4.84083 6.10559 4.65495 6.10559 4.46122C6.10559 4.26749 6.02509 4.0816 5.88162 3.94403C5.85985 3.924 4.5668 2.32471 4.5668 2.32471C4.41994 2.19951 4.22826 2.13246 4.03107 2.1373C3.83388 2.14214 3.6461 2.21851 3.50623 2.35075L2.69852 3.01851C-1.26422 7.54862 10.8663 18.4418 15.0418 14.6904L15.6817 13.9892C15.8316 13.8572 15.9217 13.6749 15.9328 13.4808C15.944 13.2868 15.8753 13.0963 15.7414 12.9495Z"
                            fill="#064771"
                          />
                        </svg>
                        <span className="text-[#064771] text-sm leading-[22px]">
                          {selectedPartnerDetails?.partner_overview?.contact_person_phone
                            ? selectedPartnerDetails.partner_overview.contact_person_phone.length >
                              20
                              ? `${selectedPartnerDetails.partner_overview.contact_person_phone.slice(
                                0,
                                20
                              )}...`
                              : selectedPartnerDetails.partner_overview.contact_person_phone
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-[3px] bg-gray-200 ml-[-8px] mt-[18px]"> </div>
          </div>
        )}

        <div className="ml-7 mt-[50px]">
          <div className="flex justify-between items-center flex-row gap-[916px] mt-15">
            <div
              className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[93px] h-[34px]"
              style={{ width: '93px' }}
            >
              <button
                className="flex justify-center items-center flex-row gap-[4.313709259033203px] py-[5.032660484313965px] px-[6.470563888549805px] bg-[#FFF6F7] border-solid border-[#DF272A] border-[0.7664670944213867px] rounded-[49.82036209106445px] w-[100px] h-[34px]"
                style={{ width: '100px' }}
                onClick={() => navigate('/prospects?tab=investors')}
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

              {isEditMode && (
                <button
                  className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[190px] h-[34px]"
                  style={{ width: '190px' }}
                  type="button"
                  onClick={handleSubmit(onDraftCancel)}
                  disabled={isSubmitting}
                >
                  <div
                    className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#F1FBFF] border-solid border-[#0C5577] border-[0.7664670944213867px] rounded-[49.82036209106445px] w-[200px] h-[34px]"
                    style={{ width: '190px' }}
                  >
                    <svg
                      width="17"
                      height="16"
                      viewBox="0 0 17 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.0866 15.1436V10.8322H5.91294V15.1436M13.6734 15.1436H3.32611C2.37367 15.1436 1.60156 14.3715 1.60156 13.419V3.07172C1.60156 2.11928 2.37367 1.34717 3.32611 1.34717H10.3723C10.8296 1.34717 11.2683 1.52886 11.5917 1.85228L14.8928 5.15343C15.2163 5.47686 15.398 5.91549 15.398 6.37288V13.419C15.398 14.3715 14.6259 15.1436 13.6734 15.1436Z"
                        stroke="#0C5577"
                        strokeWidth="1.53293"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <span className="text-[#0C5577] text-nowrap">Save and Close</span>
                  </div>
                </button>
              )}
              <button
                className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[157px] h-[34px]"
                style={{ width: '157px' }}
                type="button"
                onClick={handleSubmit(onDraft)}
                disabled={isSubmitting}
              >
                <div
                  className="flex justify-center items-center flex-row gap-1.5 py-[5.032660484313965px] px-3 bg-[#F1FBFF] border-solid border-[#0C5577] border-[0.7664670944213867px] rounded-[49.82036209106445px] w-[157px] h-[34px]"
                  style={{ width: '157px' }}
                >
                  <svg
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.0866 15.1436V10.8322H5.91294V15.1436M13.6734 15.1436H3.32611C2.37367 15.1436 1.60156 14.3715 1.60156 13.419V3.07172C1.60156 2.11928 2.37367 1.34717 3.32611 1.34717H10.3723C10.8296 1.34717 11.2683 1.52886 11.5917 1.85228L14.8928 5.15343C15.2163 5.47686 15.398 5.91549 15.398 6.37288V13.419C15.398 14.3715 14.6259 15.1436 13.6734 15.1436Z"
                      stroke="#0C5577"
                      strokeWidth="1.53293"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span className="text-[#0C5577] ">Save as Draft</span>
                </div>
              </button>

              <div className="flex justify-start items-end flex-row gap-[10.06532096862793px] h-[34px] text-nowrap">
                <button
                  type="submit"
                  className="flex justify-center items-center flex-row gap-1.5 py-[5px] px-3 bg-[#064771] rounded-full h-[34px] disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="animate-spin border-4 border-white border-t-transparent rounded-full w-5 h-5"></span>
                  ) : (
                    <>
                      <span className="text-white">Save and Next</span>
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
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PartnershipDetails;
