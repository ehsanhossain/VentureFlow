import React, { useState, useEffect } from 'react';
import Label from '../../../components/Label';
import { Input } from '../../../components/Input';
import { useForm, Controller, useWatch, useFieldArray } from 'react-hook-form';
import { DealroomID } from '../../../components/DealroomID';
import SelectPicker from '../../../components/SelectPicker';
import DatePicker from '../../../components/DatePicker';
import { Country, Dropdown } from '../components/Dropdown';
import { PlusSquareIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../../../config/api';
import { TextArea } from '../../../components/textarea/TextArea';
import { showAlert } from '../../../components/Alert';
import { useTabStore } from './store/tabStore';
import { Industry, IndustryDropdown } from '../components/IndustryDropdown';

type FormValues = {
  companyRegisteredName: string;
  companyType: string;
  currentEmployeeCount: string;
  projectStartDate: Date | null;
  expectedTransactionTimeline: Date | null;
  localIndustryCode: string;
  emailAddress: string;
  companyPhoneNumber: string;
  contactPersons: { phoneNumber: string }[];
  companyEmail: string;
  hqAddress: string[];
  hqAddresses: { address: string }[];
  shareholderName: string[];
  shareholders: { name: string }[];
  clientContactPersonName: string;
  designationAndPosition: string;
  phoneNumber: string;
  websiteLink: string;
  linkedinLink: string;
  twitterLink: string;
  facebookLink: string;
  instagramLink: string;
  youtubeLink: string;
  dealroomId: string;
  profilePicture: FileList;
  pic: string;
  yearFounded: Date | null;
  reason_for_mna: string[];
  mainIndustryOperations: Industry[];
  originCountry: ExtendedCountry | null;
  priorityIndustries: Industry[];
  our_person_incharge: string[];
  status: string[];
  details: string;
  noPICNeeded: boolean;
  companyRank: string;
  investorProfileLink: string;
};

type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  image: string;
};

interface ExtendedCountry extends Country {
  alpha?: string;
}

interface CompanyData {
  company_overview: {
    reg_name: string;
    company_type: string;
    year_founded: string;
    main_industry_operations: Industry[];
    niche_industry: Industry[];
    hq_country: number;
    reason_ma: string[];
    status: string;
    details: string;
    phone: string;
    email: string;
    shareholder_name: { name: string }[];
    seller_contact_name: string;
    seller_designation: string;
    seller_email: string;
    seller_phone: { phoneNumber: string }[];
    website: string;
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube: string;
    no_pic_needed: boolean;
    emp_count: string;
    proj_start_date: string;
    txn_timeline: string;
    incharge_name: string;
    hq_address: { address: string }[];
  };
  buyer_id: string;
  no_pic_needed: boolean;
}

interface ApiIndustry {
  id: number;
  name: string;
  status: string;
  sub_industries?: ApiIndustry[];
}

const mnaOptions = [
  { value: 'MarketExpansion', label: 'Market Expansion' },
  { value: 'GrowthAcceleration', label: 'Growth Acceleration' },
  { value: 'Synergies', label: 'Synergies' },
  { value: 'EliminateCompetition', label: 'Eliminate Competition' },
  { value: 'AccessToTechnology', label: 'Access to Technology or Talent' },
  { value: 'Succession', label: 'Succession' },
];

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Deal Closed', label: 'Deal Closed' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Interested', label: 'Interested' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Canceled', label: 'Canceled' },
  { value: 'In-Active', label: 'In-Active' },
  { value: 'Drafts', label: 'Drafts' },
];

const companyRankOptions = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

import { AIImportModal } from '../../../components/AIImportModal';

const CompanyOverview: React.FC = () => {
  const [showAIModal, setShowAIModal] = useState(false);
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const navigate = useNavigate();
  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      dealroomId: 'XX-B-XXX',
      shareholders: [{ name: '' }],
      hqAddresses: [{ address: '' }],
      contactPersons: [{ phoneNumber: '' }],
      noPICNeeded: false,
    } as Partial<FormValues>,
  });

  const {
    fields: shareholderFields,
    append: appendShareholder,
    // remove: removeShareholder,
    replace: replaceShareholders,
  } = useFieldArray({
    control,
    name: 'shareholders',
  });

  const {
    fields: addressFields,
    append: appendAddress,
    // remove: removeAddress,
    replace: replaceAddress,
  } = useFieldArray({
    control,
    name: 'hqAddresses',
  });

  const { fields: contactFields, append: appendContact } = useFieldArray({
    control,
    name: 'contactPersons',
  });

  const handleDealroomIdSave = (newId: string) => {
    setValue('dealroomId', newId, { shouldDirty: true });
  };

  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    api.get('/api/employees').then((res) => {
      setEmployees(res.data.data);
    });
  }, []);



  type FileInfo = {
    label: string;
    value: string;
  };

  const fileInfo: FileInfo[] = [
    {
      label: 'Acceptable file types:',
      value: 'JPEG & PNG',
    },
  ];

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert('Only JPEG and PNG files are allowed!');
      return;
    }

    if (file.size > 1048576) {
      alert('File size must be less than 1MB!');
      return;
    }

    if (event.target.files) {
      setValue('profilePicture', event.target.files);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const noPicNeeded = useWatch({ control, name: 'noPICNeeded' });

  interface Industry {
    id: number;
    name: string;
    status: string;
    sub_industries?: Industry[];
  }

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [subIndustries, setSubIndustries] = useState<Industry[]>([]);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await api.get('/api/industries');
        const formatted = response.data.map((industry: ApiIndustry) => ({
          id: industry.id,
          name: industry.name,
          status: industry.status,
          sub_industries: industry.sub_industries || [],
        }));
        setIndustries(formatted);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch industries" });
      }
    };

    fetchIndustries();
  }, []);

  const selectedIndustries = watch('mainIndustryOperations');

  useEffect(() => {
    if (!selectedIndustries || selectedIndustries.length === 0) {
      setSubIndustries([]);
      return;
    }

    const selectedIds = selectedIndustries.map((ind) => ind.id);

    const subs = industries
      .filter((ind) => selectedIds.includes(ind.id))
      .flatMap((ind) => ind.sub_industries || []);


    const formattedSubs = subs.map((sub) => ({
      id: sub.id,
      name: sub.name,
      status: sub.status,
    }));

    setSubIndustries(formattedSubs);
  }, [selectedIndustries, industries]);

  const [countries, setCountries] = useState<ExtendedCountry[]>([]);

  const originCountry = useWatch({
    control,
    name: 'originCountry',
  });

  const { id: paramId } = useParams();
  const id = paramId || localStorage.getItem('buyer_id');
  const isEditMode = !!paramId;
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchCompanyData = async () => {
      try {
        const response = await api.get(`/api/buyer/${id}`);
        setCompanyData(response.data.data);

      } catch {
        showAlert({ type: "error", message: "Failed to fetch company data" });
      }
    };

    fetchCompanyData();
  }, [id]);

  useEffect(() => {
    if (!originCountry || !originCountry.alpha) {
      return;
    }

    const generateDealroomId = async () => {
      const countryAlpha = originCountry.alpha;
      try {
        const response = await api.get(`/api/buyer/get-last-sequence?country=${countryAlpha}`);
        const lastSequence = response.data.lastSequence;



        if (typeof lastSequence !== 'number') {
          showAlert({ type: "error", message: "API Error: lastSequence was not a number" });
          throw new Error('Invalid data received for last sequence.');
        }

        const nextSequence = lastSequence + 1;
        const formattedSequence = String(nextSequence).padStart(2, '0');
        const newDealroomId = `${countryAlpha}-B-${formattedSequence}`;

        const buyerId = companyData?.buyer_id;
        const prefix = buyerId?.split('-')[0];

        if (id && prefix == countryAlpha) {
          setValue('dealroomId', companyData?.buyer_id);
        } else {
          setValue('dealroomId', newDealroomId);
        }
      } catch (error) {
        if (error.response) {
          showAlert({ type: "error", message: "Error generating dealroomId (axios response)" });
        } else if (error.request) {
          showAlert({ type: "error", message: "Error generating dealroomId (axios request)" });
        } else {
          showAlert({ type: "error", message: "Error generating dealroomId" });
        }
      }
    };

    generateDealroomId();
  }, [originCountry, companyData, setValue, id]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/api/countries');
        const formatted = response.data.map((country: { id: number; name: string; svg_icon_url: string; alpha_2_code: string }) => ({
          id: country.id,
          name: country.name,
          flagSrc: country.svg_icon_url,
          status: 'unregistered',
          alpha: country.alpha_2_code,
        }));
        setCountries(formatted);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch countries" });
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    if (!companyData || countries.length === 0) return;

    setValue('companyRegisteredName', companyData.company_overview?.reg_name || '');
    setValue('companyType', companyData.company_overview.company_type || '');
    const yearFounded = companyData.company_overview.year_founded;
    if (yearFounded && !isNaN(parseInt(yearFounded, 10))) {
      setValue('yearFounded', new Date(parseInt(yearFounded, 10), 0, 1));
    } else {
      setValue('yearFounded', null);
    }

    setValue(
      'mainIndustryOperations',
      companyData.company_overview?.main_industry_operations || []
    );
    setValue('priorityIndustries', companyData.company_overview?.niche_industry || []);

    const origin = countries.find((c) => c.id == companyData.company_overview.hq_country);
    setValue('originCountry', origin ?? null);

    setValue('reason_for_mna', companyData.company_overview?.reason_ma || null);

    const validStatus = statusOptions.find(
      (opt) => opt.value === companyData.company_overview?.status
    );
    setValue('status', validStatus?.value ?? null);

    setValue('details', companyData.company_overview?.details || '');
    setValue('companyPhoneNumber', companyData.company_overview?.phone || '');
    setValue('companyEmail', companyData.company_overview?.email || '');

    setValue(
      'shareholderName',
      companyData.company_overview?.shareholder_name?.map((item) => item.name) || []
    );

    setValue('clientContactPersonName', companyData.company_overview?.seller_contact_name || '');
    setValue('designationAndPosition', companyData.company_overview?.seller_designation || '');
    setValue('clientContactPersonEmail', companyData.company_overview?.seller_email || '');
    setValue(
      'clientContactPersonPhone',
      companyData.company_overview?.seller_phone?.[0]?.phoneNumber || ''
    );

    setValue('websiteLink', companyData.company_overview?.website || '');
    setValue('linkedinLink', companyData.company_overview?.linkedin || '');
    setValue('twitterLink', companyData.company_overview?.twitter || '');
    setValue('facebookLink', companyData.company_overview?.facebook || '');
    setValue('instagramLink', companyData.company_overview?.instagram || '');
    setValue('youtubeLink', companyData.company_overview?.youtube || '');
    setValue('noPICNeeded', companyData.company_overview?.no_pic_needed || false);

    setValue('currentEmployeeCount', companyData.company_overview?.emp_count || '');

    const projStartDateString = companyData.company_overview.proj_start_date;

    let projectStartDateValue = null;

    if (projStartDateString) {
      const parts = projStartDateString.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        projectStartDateValue = new Date(year, month, day);
        if (
          projectStartDateValue.getFullYear() !== year ||
          projectStartDateValue.getMonth() !== month ||
          projectStartDateValue.getDate() !== day
        ) {
          projectStartDateValue = null;
        }
      }
    }

    const txnTimelineString = companyData.company_overview.txn_timeline;

    let transactionDateValue = null;

    if (txnTimelineString) {
      const parsedDate = new Date(txnTimelineString);

      if (!isNaN(parsedDate.getTime())) {
        transactionDateValue = parsedDate;
      }
    }

    setValue('expectedTransactionTimeline', transactionDateValue);

    setValue('projectStartDate', projectStartDateValue);

    const emp = employees.find(
      (e) => String(e.id) === String(companyData.company_overview.incharge_name)
    );

    setValue('our_person_incharge', emp?.id ?? null);

    setValue('contactPersons', companyData.company_overview?.seller_phone);

    replaceAddress(companyData.company_overview.hq_address);
    replaceShareholders(companyData.company_overview.shareholder_name);
  }, [companyData, countries, setValue, employees, replaceAddress, replaceShareholders]);

  const handleAIApply = (data: any) => {
    if (data.company_registered_name) setValue('companyRegisteredName', data.company_registered_name);
    if (data.company_type) setValue('companyType', data.company_type);
    if (data.details) setValue('details', data.details);
    if (data.website) setValue('websiteLink', data.website);
    if (data.linkedin) setValue('linkedinLink', data.linkedin);
    if (data.facebook) setValue('facebookLink', data.facebook);
    if (data.twitter) setValue('twitterLink', data.twitter);
    if (data.instagram) setValue('instagramLink', data.instagram);
    if (data.youtube) setValue('youtubeLink', data.youtube);

    // Company contact
    if (data.email) setValue('companyEmail', data.email);
    if (data.phone) setValue('companyPhoneNumber', data.phone);
    if (data.employee_count) setValue('currentEmployeeCount', String(data.employee_count));

    // Contact Person
    if (data.contact_person_name) setValue('clientContactPersonName', data.contact_person_name);
    if (data.contact_person_email) setValue('emailAddress', data.contact_person_email);
    if (data.contact_person_designation) setValue('designationAndPosition', data.contact_person_designation);

    if (data.contact_person_phone) {
      // Assuming it's a string, wrap in array if needed or set first item
      // Field is contactPersons: { phoneNumber: string }[]
      setValue('contactPersons', [{ phoneNumber: data.contact_person_phone }]);
    }

    if (data.year_founded) {
      const year = parseInt(data.year_founded);
      if (!isNaN(year)) {
        setValue('yearFounded', new Date(year, 0, 1));
      }
    }

    if (Array.isArray(data.shareholders)) {
      replaceShareholders(data.shareholders.map((name: string) => ({ name })));
    }

    if (data.headquarters_address) {
      if (Array.isArray(data.headquarters_address)) {
        replaceAddress(data.headquarters_address.map((addr: string) => ({ address: addr })));
      } else {
        replaceAddress([{ address: data.headquarters_address }]);
      }
    }

    showAlert({ type: 'success', message: 'Form populated from AI data!' });
  };

  const onSubmit = async (data: FormValues) => {

    const formData = new FormData();

    const normalizeToArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

    const stringMap: Partial<Record<keyof FormValues, string>> = {
      companyRegisteredName: 'reg_name',
      companyType: 'company_type',
      yearFounded: 'year_founded',
      localIndustryCode: 'industry_ops',
      currentEmployeeCount: 'emp_count',
      emailAddress: 'seller_email',
      companyEmail: 'email',
      companyPhoneNumber: 'phone',
      hqAddress: 'hq_address',
      shareholderName: 'shareholder_name',
      clientContactPersonName: 'seller_contact_name',
      designationAndPosition: 'seller_designation',
      phoneNumber: 'phone',
      websiteLink: 'website',
      linkedinLink: 'linkedin',
      twitterLink: 'twitter',
      facebookLink: 'facebook',
      instagramLink: 'instagram',
      youtubeLink: 'youtube',
      pic: 'no_pic_needed',
      projectStartDate: 'proj_start_date',
      expectedTransactionTimeline: 'txn_timeline',
      profilePicture: 'profile_picture',
      dealroomId: 'buyer_id',
      our_person_incharge: 'incharge_name',
      originCountry: 'hq_country',
      mainIndustryOperations: 'main_industry_operations',
      priorityIndustries: 'niche_industry',
      reason_for_mna: 'reason_ma',
      status: 'status',
      contactPersons: 'seller_phone',
      details: 'details',
      companyRank: 'rank',
      investorProfileLink: 'investor_profile_link',
    };

    Object.entries(stringMap).forEach(([key, dbField]) => {
      const specialFields = [
        'yearFounded',
        'currentEmployeeCount',
        'hqAddress',
        'shareholderName',
        'pic',
        'profilePicture',
        'our_person_incharge',
        'originCountry',
        'mainIndustryOperations',
        'priorityIndustries',
        'reason_for_mna',
        'status',
        'contactPersons',
        'projectStartDate',
        'expectedTransactionTimeline',
        'hqAddresses',
        'shareholders',
      ];
      if (!specialFields.includes(key) && data[key as keyof FormValues] !== undefined) {
        const value = data[key as keyof FormValues];
        formData.append(dbField, String(value as unknown));
      }
    });

    if (data.yearFounded instanceof Date && !isNaN(data.yearFounded.getTime())) {
      formData.append('year_founded', String(data.yearFounded.getFullYear()));
    } else if (typeof data.yearFounded === 'number' || typeof data.yearFounded === 'string') {
      formData.append('year_founded', String(data.yearFounded));
    }

    if (data.currentEmployeeCount !== undefined && data.currentEmployeeCount !== null) {
      formData.append('emp_count', String(data.currentEmployeeCount));
    }

    if (data.pic === 'no') {
      formData.set('no_pic_needed', '1');
    } else {
      formData.set('no_pic_needed', '0');
    }

    if (data.profilePicture && data.profilePicture.length > 0) {
      formData.append('profile_picture', data.profilePicture[0]);
    }

    formData.append(
      'main_industry_operations',
      JSON.stringify(normalizeToArray(data.mainIndustryOperations))
    );
    formData.append('no_pic_needed', noPicNeeded ? '1' : '0');

    formData.append('niche_industry', JSON.stringify(normalizeToArray(data.priorityIndustries)));

    if (data.reason_for_mna !== undefined && data.reason_for_mna !== null) {
      formData.append('reason_ma', normalizeToArray(data.reason_for_mna).join(', '));
    }

    if (data.originCountry) {
      formData.append('hq_country', String(data.originCountry.id));
    }

    if (id) {
      formData.append('buyer', id);
    }

    if (data.our_person_incharge !== undefined && data.our_person_incharge !== null) {
      formData.append('incharge_name', String(data.our_person_incharge));
    }

    if (data.status) {
      formData.append('status', data.status);
    }

    if (data.contactPersons) {
      formData.append('seller_phone', JSON.stringify(data.contactPersons));
    }

    if (data.hqAddresses) {
      formData.set('hq_address', JSON.stringify(data.hqAddresses));
    }

    if (data.shareholders) {
      formData.set('shareholder_name', JSON.stringify(data.shareholders));
    }

    if (data.projectStartDate instanceof Date && !isNaN(data.projectStartDate.getTime())) {
      const year = data.projectStartDate.getFullYear();
      const month = String(data.projectStartDate.getMonth() + 1).padStart(2, '0');
      const day = String(data.projectStartDate.getDate()).padStart(2, '0');
      formData.append('proj_start_date', `${year}-${month}-${day}`);
    } else if (typeof data.projectStartDate === 'string') {
      formData.append('proj_start_date', data.projectStartDate);
    }

    if (
      data.expectedTransactionTimeline !== undefined &&
      data.expectedTransactionTimeline !== null
    ) {
      formData.append('txn_timeline', String(data.expectedTransactionTimeline));
    }

    try {
      const response = await api.post('/api/buyer/company-overviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });


      localStorage.setItem('buyer_id', response.data.data);
      showAlert({ type: 'success', message: 'Draft Saved' });
      setActiveTab('target-preference');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        let errorMessage = 'Failed to submit buyer company overview';
        if (error.response?.data) {
          if (error.response.data.detail) {
            errorMessage += ': ' + error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage += ': ' + error.response.data.message;
          } else {
            try {
              errorMessage += ': ' + JSON.stringify(error.response.data);
            } catch {
              errorMessage += ': ' + error.message;
            }
          }
        } else {
          errorMessage += ': ' + error.message;
        }

        showAlert({
          type: 'error',
          message: errorMessage,
        });
      } else {
        showAlert({
          type: 'error',
          message: 'An unexpected error occurred during submission.',
        });
      }
    }
  };

  const onDraft = async (data: FormValues) => {

    const formData = new FormData();

    const normalizeToArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

    const stringMap: Partial<Record<keyof FormValues, string>> = {
      companyRegisteredName: 'reg_name',
      companyType: 'company_type',
      yearFounded: 'year_founded',
      localIndustryCode: 'industry_ops',
      currentEmployeeCount: 'emp_count',
      emailAddress: 'seller_email',
      companyEmail: 'email',
      companyPhoneNumber: 'phone',
      hqAddress: 'hq_address',
      shareholderName: 'shareholder_name',
      clientContactPersonName: 'seller_contact_name',
      designationAndPosition: 'seller_designation',
      phoneNumber: 'phone',
      websiteLink: 'website',
      linkedinLink: 'linkedin',
      twitterLink: 'twitter',
      facebookLink: 'facebook',
      instagramLink: 'instagram',
      youtubeLink: 'youtube',
      pic: 'no_pic_needed',
      projectStartDate: 'proj_start_date',
      expectedTransactionTimeline: 'txn_timeline',
      profilePicture: 'profile_picture',
      dealroomId: 'buyer_id',
      our_person_incharge: 'incharge_name',
      originCountry: 'hq_country',
      mainIndustryOperations: 'main_industry_operations',
      priorityIndustries: 'niche_industry',
      reason_for_mna: 'reason_ma',
      status: 'status',
      contactPersons: 'seller_phone',
      details: 'details',
    };

    Object.entries(stringMap).forEach(([key, dbField]) => {
      const specialFields = [
        'yearFounded',
        'currentEmployeeCount',
        'hqAddress',
        'shareholderName',
        'pic',
        'profilePicture',
        'our_person_incharge',
        'originCountry',
        'mainIndustryOperations',
        'priorityIndustries',
        'reason_for_mna',
        'status',
        'contactPersons',
        'projectStartDate',
        'expectedTransactionTimeline',
        'hqAddresses',
        'shareholders',
      ];
      if (!specialFields.includes(key) && data[key as keyof FormValues] !== undefined) {
        const value = data[key as keyof FormValues];
        formData.append(dbField, String(value));
      }
    });

    // Add draft flag
    formData.append('is_draft', '2');

    if (data.yearFounded instanceof Date && !isNaN(data.yearFounded.getTime())) {
      formData.append('year_founded', String(data.yearFounded.getFullYear()));
    } else if (typeof data.yearFounded === 'number' || typeof data.yearFounded === 'string') {
      formData.append('year_founded', String(data.yearFounded));
    }

    if (data.currentEmployeeCount !== undefined && data.currentEmployeeCount !== null) {
      formData.append('emp_count', String(data.currentEmployeeCount));
    }

    if (data.pic === 'no') {
      formData.set('no_pic_needed', '1');
    } else {
      formData.set('no_pic_needed', '0');
    }

    if (data.profilePicture && data.profilePicture.length > 0) {
      formData.append('profile_picture', data.profilePicture[0]);
    }

    formData.append(
      'main_industry_operations',
      JSON.stringify(normalizeToArray(data.mainIndustryOperations))
    );
    formData.append('no_pic_needed', noPicNeeded ? '1' : '0');
    formData.append('niche_industry', JSON.stringify(normalizeToArray(data.priorityIndustries)));

    if (data.reason_for_mna !== undefined && data.reason_for_mna !== null) {
      formData.append('reason_ma', normalizeToArray(data.reason_for_mna).join(', '));
    }

    if (data.originCountry) {
      formData.append('hq_country', String(data.originCountry.id));
    }

    if (id) {
      formData.append('buyer', id);
    }

    if (data.our_person_incharge !== undefined && data.our_person_incharge !== null) {
      formData.append('incharge_name', String(data.our_person_incharge));
    }

    if (data.status) {
      formData.append('status', data.status);
    }

    if (data.contactPersons) {
      formData.append('seller_phone', JSON.stringify(data.contactPersons));
    }

    if (data.hqAddresses) {
      formData.set('hq_address', JSON.stringify(data.hqAddresses));
    }

    if (data.shareholders) {
      formData.set('shareholder_name', JSON.stringify(data.shareholders));
    }

    if (data.projectStartDate instanceof Date && !isNaN(data.projectStartDate.getTime())) {
      const year = data.projectStartDate.getFullYear();
      const month = String(data.projectStartDate.getMonth() + 1).padStart(2, '0');
      const day = String(data.projectStartDate.getDate()).padStart(2, '0');
      formData.append('proj_start_date', `${year}-${month}-${day}`);
    } else if (typeof data.projectStartDate === 'string') {
      formData.append('proj_start_date', data.projectStartDate);
    }

    if (
      data.expectedTransactionTimeline !== undefined &&
      data.expectedTransactionTimeline !== null
    ) {
      formData.append('txn_timeline', String(data.expectedTransactionTimeline));
    }

    try {
      const response = await api.post('/api/buyer/company-overviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });


      localStorage.setItem('buyer_id', response.data.data);
      showAlert({ type: 'success', message: 'Draft Saved' });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        let errorMessage = 'Failed to save draft';
        if (error.response?.data) {
          if (error.response.data.detail) {
            errorMessage += ': ' + error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage += ': ' + error.response.data.message;
          } else {
            try {
              errorMessage += ': ' + JSON.stringify(error.response.data);
            } catch {
              errorMessage += ': ' + error.message;
            }
          }
        } else {
          errorMessage += ': ' + error.message;
        }

        showAlert({
          type: 'error',
          message: errorMessage,
        });
      } else {
        showAlert({
          type: 'error',
          message: 'Unexpected error occurred while saving draft.',
        });
      }
    }
  };

  const onDraftCancel = async (data: FormValues) => {

    const formData = new FormData();

    const normalizeToArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

    const stringMap: Partial<Record<keyof FormValues, string>> = {
      companyRegisteredName: 'reg_name',
      companyType: 'company_type',
      yearFounded: 'year_founded',
      localIndustryCode: 'industry_ops',
      currentEmployeeCount: 'emp_count',
      emailAddress: 'seller_email',
      companyEmail: 'email',
      companyPhoneNumber: 'phone',
      hqAddress: 'hq_address',
      shareholderName: 'shareholder_name',
      clientContactPersonName: 'seller_contact_name',
      designationAndPosition: 'seller_designation',
      phoneNumber: 'phone',
      websiteLink: 'website',
      linkedinLink: 'linkedin',
      twitterLink: 'twitter',
      facebookLink: 'facebook',
      instagramLink: 'instagram',
      youtubeLink: 'youtube',
      pic: 'no_pic_needed',
      projectStartDate: 'proj_start_date',
      expectedTransactionTimeline: 'txn_timeline',
      profilePicture: 'profile_picture',
      dealroomId: 'buyer_id',
      our_person_incharge: 'incharge_name',
      originCountry: 'hq_country',
      mainIndustryOperations: 'main_industry_operations',
      priorityIndustries: 'niche_industry',
      reason_for_mna: 'reason_ma',
      status: 'status',
      contactPersons: 'seller_phone',
      details: 'details',
    };

    Object.entries(stringMap).forEach(([key, dbField]) => {
      const specialFields = [
        'yearFounded',
        'currentEmployeeCount',
        'hqAddress',
        'shareholderName',
        'pic',
        'profilePicture',
        'our_person_incharge',
        'originCountry',
        'mainIndustryOperations',
        'priorityIndustries',
        'reason_for_mna',
        'status',
        'contactPersons',
        'projectStartDate',
        'expectedTransactionTimeline',
        'hqAddresses',
        'shareholders',
      ];
      if (!specialFields.includes(key) && data[key as keyof FormValues] !== undefined) {
        const value = data[key as keyof FormValues];
        formData.append(dbField, String(value as unknown));
      }
    });

    formData.append('is_draft', '2');

    if (data.yearFounded instanceof Date && !isNaN(data.yearFounded.getTime())) {
      formData.append('year_founded', String(data.yearFounded.getFullYear()));
    } else if (typeof data.yearFounded === 'number' || typeof data.yearFounded === 'string') {
      formData.append('year_founded', String(data.yearFounded));
    }

    if (data.currentEmployeeCount !== undefined && data.currentEmployeeCount !== null) {
      formData.append('emp_count', String(data.currentEmployeeCount));
    }

    if (data.pic === 'no') {
      formData.set('no_pic_needed', '1');
    } else {
      formData.set('no_pic_needed', '0');
    }

    if (data.profilePicture && data.profilePicture.length > 0) {
      formData.append('profile_picture', data.profilePicture[0]);
    }
    formData.append('no_pic_needed', noPicNeeded ? '1' : '0');
    formData.append(
      'main_industry_operations',
      JSON.stringify(normalizeToArray(data.mainIndustryOperations))
    );

    formData.append('niche_industry', JSON.stringify(normalizeToArray(data.priorityIndustries)));

    if (data.reason_for_mna !== undefined && data.reason_for_mna !== null) {
      formData.append('reason_ma', normalizeToArray(data.reason_for_mna).join(', '));
    }

    if (data.originCountry) {
      formData.append('hq_country', String(data.originCountry.id));
    }

    if (id) {
      formData.append('buyer', id);
    }

    if (data.our_person_incharge !== undefined && data.our_person_incharge !== null) {
      formData.append('incharge_name', String(data.our_person_incharge));
    }

    if (data.status) {
      formData.append('status', data.status);
    }

    if (data.contactPersons) {
      formData.append('seller_phone', JSON.stringify(data.contactPersons));
    }

    if (data.hqAddresses) {
      formData.set('hq_address', JSON.stringify(data.hqAddresses));
    }

    if (data.shareholders) {
      formData.set('shareholder_name', JSON.stringify(data.shareholders));
    }

    if (data.projectStartDate instanceof Date && !isNaN(data.projectStartDate.getTime())) {
      const year = data.projectStartDate.getFullYear();
      const month = String(data.projectStartDate.getMonth() + 1).padStart(2, '0');
      const day = String(data.projectStartDate.getDate()).padStart(2, '0');
      formData.append('proj_start_date', `${year}-${month}-${day}`);
    } else if (typeof data.projectStartDate === 'string') {
      formData.append('proj_start_date', data.projectStartDate);
    }

    if (
      data.expectedTransactionTimeline !== undefined &&
      data.expectedTransactionTimeline !== null
    ) {
      formData.append('txn_timeline', String(data.expectedTransactionTimeline));
    }

    try {
      const response = await api.post('/api/buyer/company-overviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });


      localStorage.setItem('buyer_id', response.data.data);
      showAlert({ type: 'success', message: 'Draft Saved' });
      navigate('/prospects?tab=investors');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        let errorMessage = 'Failed to save draft';
        if (error.response?.data) {
          if (error.response.data.detail) {
            errorMessage += ': ' + error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage += ': ' + error.response.data.message;
          } else {
            try {
              errorMessage += ': ' + JSON.stringify(error.response.data);
            } catch {
              errorMessage += ': ' + error.message;
            }
          }
        } else {
          errorMessage += ': ' + error.message;
        }

        showAlert({
          type: 'error',
          message: errorMessage,
        });
      } else {
        showAlert({
          type: 'error',
          message: 'Unexpected error occurred while saving draft.',
        });
      }
    }
  };



  const defaultSVG = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="145" height="145" viewBox="0 0 145 145" fill="none">
    <rect x="1" y="1" width="143" height="143" rx="71.5" fill="#F1FBFF"/>
    <rect x="1" y="1" width="143" height="143" rx="71.5" stroke="#064771" stroke-width="2"/>
    <path d="M72.5001 73.2894C80.9906 73.2894 87.8954 66.3849 87.8954 57.8947C87.8954 49.4045 80.9906 42.5 72.5001 42.5C64.0095 42.5 57.1047 49.4045 57.1047 57.8947C57.1047 66.3849 64.0095 73.2894 72.5001 73.2894ZM72.5001 47.6316C78.1604 47.6316 82.7636 52.2346 82.7636 57.8947C82.7636 63.5548 78.1604 68.1578 72.5001 68.1578C66.8397 68.1578 62.2365 63.5548 62.2365 57.8947C62.2365 52.2346 66.8397 47.6316 72.5001 47.6316Z" fill="#064771"/>
    <path d="M95.593 99.9313C95.593 101.348 94.446 102.497 93.0271 102.497C91.6082 102.497 90.4612 101.348 90.4612 99.9313C90.4612 92.1852 85.5219 85.5886 78.635 83.0741L74.7426 88.9138L77.5471 99.1513C78.0167 100.86 76.5079 102.5 74.4655 102.5H70.5345C68.4921 102.5 66.9859 100.86 67.4529 99.1513L70.2574 88.9138L66.365 83.0741C59.4781 85.5886 54.5388 92.1852 54.5388 99.9338C54.5388 101.35 53.3892 102.5 51.9729 102.5C50.5565 102.5 49.407 101.35 49.407 99.9338C49.407 87.2024 59.768 76.8418 72.5 76.8418C85.2319 76.8418 95.593 87.1999 95.593 99.9313Z" fill="#064771"/>
  </svg>
`);

  const employeeOptions = employees.map((emp) => ({
    label: `${emp.first_name} ${emp.last_name}`,
    value: String(emp.id),
    image: emp.image ? `${baseURL}/storage/${emp.image}` : `data:image/svg+xml,${defaultSVG}`,
  }));

  useEffect(() => {

    if (companyData?.no_pic_needed !== undefined) {
      setValue('noPICNeeded', companyData.no_pic_needed);
    }
  }, [companyData?.no_pic_needed, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="pl-[15px] font-poppins">
        <div className="flex gap-[70px] ">
          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none w-[500px] ">
            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
              Basic Details
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

            <div className="flex justify-between items-center w-full max-w-[500px]">
              <Label text="Company Registered Name" required />
              <button
                type="button"
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-[#064771] rounded-full hover:bg-[#053a5c] transition-all shadow-md transform hover:scale-105"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Auto-Fill
              </button>
            </div>

            <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
              <Input {...register('companyRegisteredName', {})} placeholder="Enter Company Name" />
            </div>

            <Label text="Rank" />
            <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
              <Controller
                name="companyRank"
                control={control}
                render={({ field }) => (
                  <SelectPicker
                    options={companyRankOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Rank"
                  />
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label text="HQ/Origin Country" required />

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

            <Controller
              name="originCountry"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  countries={countries}
                  selected={field.value}
                  onSelect={field.onChange}
                />
              )}
            />

            <Label text="Company Type" />

            <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
              <Input {...register('companyType', {})} placeholder="e.g., LLC, Branch Office, PLC" />
            </div>

            <Label text="Year Founded" />

            <Controller
              control={control}
              name="yearFounded"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Year"
                  yearPicker={true}
                  icon={
                    <svg
                      width="18"
                      height="16"
                      viewBox="0 0 18 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.3897 6.70475C9.77323 6.70475 7.64355 8.77865 7.64355 11.3281C7.64355 13.863 9.77323 15.9257 12.3897 15.9257C15.0062 15.9257 17.1359 13.8518 17.1359 11.3023C17.1359 8.76742 15.0062 6.70475 12.3897 6.70475ZM12.3897 14.6047C10.5204 14.6047 8.99961 13.1345 8.99961 11.3281C8.99961 9.50715 10.5204 8.0257 12.3897 8.0257C14.2591 8.0257 15.7799 9.49592 15.7799 11.3023C15.7799 13.1233 14.2591 14.6047 12.3897 14.6047ZM13.5471 11.4958C13.8122 11.7541 13.8122 12.1715 13.5471 12.4298C13.4149 12.5586 13.2413 12.6233 13.0678 12.6233C12.8942 12.6233 12.7206 12.5586 12.5884 12.4298L11.9104 11.7693C11.7829 11.6451 11.7117 11.4774 11.7117 11.3023V9.98137C11.7117 9.61679 12.0148 9.3209 12.3897 9.3209C12.7647 9.3209 13.0678 9.61679 13.0678 9.98137V11.0289L13.5471 11.4958ZM17.1359 4.69756V6.01851C17.1359 6.3831 16.8329 6.67899 16.4579 6.67899C16.083 6.67899 15.7799 6.3831 15.7799 6.01851V4.69756C15.7799 3.60513 14.8673 2.71613 13.7458 2.71613H4.25342C3.13196 2.71613 2.21934 3.60513 2.21934 4.69756V5.35804H8.32158C8.69585 5.35804 8.99961 5.65393 8.99961 6.01851C8.99961 6.3831 8.69585 6.67899 8.32158 6.67899H2.21934V12.6233C2.21934 13.7157 3.13196 14.6047 4.25342 14.6047H6.96552C7.33979 14.6047 7.64355 14.9006 7.64355 15.2652C7.64355 15.6298 7.33979 15.9257 6.96552 15.9257H4.25342C2.3841 15.9257 0.863281 14.4442 0.863281 12.6233V4.69756C0.863281 2.87662 2.3841 1.39517 4.25342 1.39517H4.93144V0.734696C4.93144 0.370112 5.2352 0.0742188 5.60947 0.0742188C5.98374 0.0742188 6.2875 0.370112 6.2875 0.734696V1.39517H11.7117V0.734696C11.7117 0.370112 12.0148 0.0742188 12.3897 0.0742188C12.7647 0.0742188 13.0678 0.370112 13.0678 0.734696V1.39517H13.7458C15.6151 1.39517 17.1359 2.87662 17.1359 4.69756Z"
                        fill="#005E80"
                      />
                    </svg>
                  }
                />
              )}
            />

            <div className="flex items-center gap-2">
              <Label text="Main Industry Operations " required />

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

            <Controller
              name="mainIndustryOperations"
              control={control}
              render={({ field }) => (
                <IndustryDropdown
                  industries={industries}
                  multiSelect
                  selected={field.value}
                  onSelect={field.onChange}
                />
              )}
            />

            <div className="flex items-center gap-2">
              <Label text="Niche / Priority Industry " required />

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

            <Controller
              name="priorityIndustries"
              control={control}
              render={({ field }) => (
                <IndustryDropdown
                  industries={subIndustries}
                  multiSelect
                  selected={field.value}
                  onSelect={field.onChange}
                />
              )}
            />

            <Label text="Current Employee Count (if Any)" />

            <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
              <Input
                {...register('currentEmployeeCount', {})}
                placeholder="If the industry has a specific code for reference? Select specified target industries"
              />
            </div>

            <Label text="Reason for M&A" />

            <Controller
              control={control}
              name="reason_for_mna"
              render={({ field }) => (
                <SelectPicker
                  options={mnaOptions}
                  value={field.value}
                  onChange={field.onChange}
                  searchable={false}
                  placeholder="Select the reason for M&A"
                />
              )}
            />

            <Label text="Project Start Date" />
            <Controller
              control={control}
              name="projectStartDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select date"
                  icon={
                    <svg
                      width="18"
                      height="16"
                      viewBox="0 0 18 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.3897 6.70475C9.77323 6.70475 7.64355 8.77865 7.64355 11.3281C7.64355 13.863 9.77323 15.9257 12.3897 15.9257C15.0062 15.9257 17.1359 13.8518 17.1359 11.3023C17.1359 8.76742 15.0062 6.70475 12.3897 6.70475ZM12.3897 14.6047C10.5204 14.6047 8.99961 13.1345 8.99961 11.3281C8.99961 9.50715 10.5204 8.0257 12.3897 8.0257C14.2591 8.0257 15.7799 9.49592 15.7799 11.3023C15.7799 13.1233 14.2591 14.6047 12.3897 14.6047ZM13.5471 11.4958C13.8122 11.7541 13.8122 12.1715 13.5471 12.4298C13.4149 12.5586 13.2413 12.6233 13.0678 12.6233C12.8942 12.6233 12.7206 12.5586 12.5884 12.4298L11.9104 11.7693C11.7829 11.6451 11.7117 11.4774 11.7117 11.3023V9.98137C11.7117 9.61679 12.0148 9.3209 12.3897 9.3209C12.7647 9.3209 13.0678 9.61679 13.0678 9.98137V11.0289L13.5471 11.4958ZM17.1359 4.69756V6.01851C17.1359 6.3831 16.8329 6.67899 16.4579 6.67899C16.083 6.67899 15.7799 6.3831 15.7799 6.01851V4.69756C15.7799 3.60513 14.8673 2.71613 13.7458 2.71613H4.25342C3.13196 2.71613 2.21934 3.60513 2.21934 4.69756V5.35804H8.32158C8.69585 5.35804 8.99961 5.65393 8.99961 6.01851C8.99961 6.3831 8.69585 6.67899 8.32158 6.67899H2.21934V12.6233C2.21934 13.7157 3.13196 14.6047 4.25342 14.6047H6.96552C7.33979 14.6047 7.64355 14.9006 7.64355 15.2652C7.64355 15.6298 7.33979 15.9257 6.96552 15.9257H4.25342C2.3841 15.9257 0.863281 14.4442 0.863281 12.6233V4.69756C0.863281 2.87662 2.3841 1.39517 4.25342 1.39517H4.93144V0.734696C4.93144 0.370112 5.2352 0.0742188 5.60947 0.0742188C5.98374 0.0742188 6.2875 0.370112 6.2875 0.734696V1.39517H11.7117V0.734696C11.7117 0.370112 12.0148 0.0742188 12.3897 0.0742188C12.7647 0.0742188 13.0678 0.370112 13.0678 0.734696V1.39517H13.7458C15.6151 1.39517 17.1359 2.87662 17.1359 4.69756Z"
                        fill="#005E80"
                      />
                    </svg>
                  }
                />
              )}
            />

            <Label text="Expected Transection Timeline" />
            <Controller
              control={control}
              name="expectedTransactionTimeline"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select date"
                  icon={
                    <svg
                      width="18"
                      height="16"
                      viewBox="0 0 18 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.3897 6.70475C9.77323 6.70475 7.64355 8.77865 7.64355 11.3281C7.64355 13.863 9.77323 15.9257 12.3897 15.9257C15.0062 15.9257 17.1359 13.8518 17.1359 11.3023C17.1359 8.76742 15.0062 6.70475 12.3897 6.70475ZM12.3897 14.6047C10.5204 14.6047 8.99961 13.1345 8.99961 11.3281C8.99961 9.50715 10.5204 8.0257 12.3897 8.0257C14.2591 8.0257 15.7799 9.49592 15.7799 11.3023C15.7799 13.1233 14.2591 14.6047 12.3897 14.6047ZM13.5471 11.4958C13.8122 11.7541 13.8122 12.1715 13.5471 12.4298C13.4149 12.5586 13.2413 12.6233 13.0678 12.6233C12.8942 12.6233 12.7206 12.5586 12.5884 12.4298L11.9104 11.7693C11.7829 11.6451 11.7117 11.4774 11.7117 11.3023V9.98137C11.7117 9.61679 12.0148 9.3209 12.3897 9.3209C12.7647 9.3209 13.0678 9.61679 13.0678 9.98137V11.0289L13.5471 11.4958ZM17.1359 4.69756V6.01851C17.1359 6.3831 16.8329 6.67899 16.4579 6.67899C16.083 6.67899 15.7799 6.3831 15.7799 6.01851V4.69756C15.7799 3.60513 14.8673 2.71613 13.7458 2.71613H4.25342C3.13196 2.71613 2.21934 3.60513 2.21934 4.69756V5.35804H8.32158C8.69585 5.35804 8.99961 5.65393 8.99961 6.01851C8.99961 6.3831 8.69585 6.67899 8.32158 6.67899H2.21934V12.6233C2.21934 13.7157 3.13196 14.6047 4.25342 14.6047H6.96552C7.33979 14.6047 7.64355 14.9006 7.64355 15.2652C7.64355 15.6298 7.33979 15.9257 6.96552 15.9257H4.25342C2.3841 15.9257 0.863281 14.4442 0.863281 12.6233V4.69756C0.863281 2.87662 2.3841 1.39517 4.25342 1.39517H4.93144V0.734696C4.93144 0.370112 5.2352 0.0742188 5.60947 0.0742188C5.98374 0.0742188 6.2875 0.370112 6.2875 0.734696V1.39517H11.7117V0.734696C11.7117 0.370112 12.0148 0.0742188 12.3897 0.0742188C12.7647 0.0742188 13.0678 0.370112 13.0678 0.734696V1.39517H13.7458C15.6151 1.39517 17.1359 2.87662 17.1359 4.69756Z"
                        fill="#005E80"
                      />
                    </svg>
                  }
                />
              )}
            />

            <Label text="Our Person In-charge" required />
            <div className={`${noPicNeeded ? 'opacity-50 pointer-events-none' : ''} w-[500px]`}>
              <Controller
                control={control}
                name="our_person_incharge"
                render={({ field }) => (
                  <SelectPicker
                    options={employeeOptions}
                    value={field.value}
                    onChange={field.onChange}
                    searchable
                    placeholder="Select PIC from registered employees"
                  />
                )}
              />
            </div>
            {/* 2 */}
            <Controller
              name="noPICNeeded"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <div className="flex justify-start items-center flex-row gap-2.5">
                  <div
                    className="flex justify-center items-center flex-row w-[39px] h-[24px]"
                    style={{ width: '39px' }}
                  >
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className={`relative w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${field.value ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${field.value ? 'translate-x-4' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>
                  <span className="text-[#30313D] font-medium leading-[19.2857px]">
                    No PIC Needed
                  </span>
                </div>
              )}
            />

            <Label text="Status" required />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <SelectPicker
                  options={statusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  searchable={false}
                  placeholder="e.g., Select current status of prospect"
                />
              )}
            />
          </div>

          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none ">
            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-[Poppins]">
              General Contact
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

            <Label text="Company’s Email" />

            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('companyEmail', {})}
                  placeholder="abccompany@domain.com"
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="18"
                      viewBox="0 0 20 18"
                      fill="none"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2.45148 2.70897C1.81896 3.2963 1.39535 4.24929 1.39535 5.74422V12.2559C1.39535 13.7507 1.81896 14.7038 2.45148 15.2911C3.09335 15.8871 4.06044 16.2093 5.34884 16.2093H14.6512C15.9395 16.2093 16.9066 15.8871 17.5486 15.2911C18.181 14.7038 18.6047 13.7507 18.6047 12.2559V5.74422C18.6047 4.24929 18.181 3.2963 17.5486 2.70897C16.9066 2.11294 15.9395 1.79073 14.6512 1.79073H5.34884C4.06044 1.79073 3.09335 2.11294 2.45148 2.70897ZM1.50201 1.68646C2.48805 0.770855 3.84654 0.395386 5.34884 0.395386H14.6512C16.1535 0.395386 17.512 0.770855 18.498 1.68646C19.4934 2.61075 20 3.98334 20 5.74422V12.2559C20 14.0168 19.4934 15.3893 18.498 16.3136C17.512 17.2292 16.1535 17.6047 14.6512 17.6047H5.34884C3.84654 17.6047 2.48805 17.2292 1.50201 16.3136C0.506623 15.3893 0 14.0168 0 12.2559V5.74422C0 3.98334 0.506623 2.61075 1.50201 1.68646Z"
                        fill="#838383"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M16.8489 4.63746C17.0845 4.94235 17.0283 5.38051 16.7235 5.6161L11.5634 9.60336C10.6421 10.3152 9.35639 10.3152 8.43509 9.60336L3.27503 5.6161C2.97013 5.38051 2.91395 4.94235 3.14955 4.63746C3.38515 4.33256 3.8233 4.27638 4.1282 4.51198L9.28821 8.49917C9.707 8.8228 10.2915 8.8228 10.7102 8.49917L15.8703 4.51198C16.1752 4.27638 16.6133 4.33256 16.8489 4.63746Z"
                        fill="#838383"
                      />
                    </svg>
                  }
                  className="h-[37px] p-0 pl-10 pr-2"
                />
              </div>
            </div>

            <Label text="Company’s Phone Number" />
            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('companyPhoneNumber', {})}
                  placeholder="Write the phone numbe"
                />
              </div>
            </div>

            <Label text="HQ Address" />

            {addressFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-3 rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]"
              >
                <Input
                  {...register(`hqAddresses.${index}.address`)}
                  placeholder="Write the company’s address"
                  className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2"
                />
              </div>
            ))}

            <button
              type="button"
              className="flex items-center gap-2 mt-2 ml-1"
              onClick={() => appendAddress({ address: '' })}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10 0C8.02219 0 6.08879 0.58649 4.4443 1.6853C2.79981 2.78412 1.51809 4.3459 0.761209 6.17316C0.00433286 8.00043 -0.1937 10.0111 0.192152 11.9509C0.578004 13.8907 1.53041 15.6725 2.92894 17.0711C4.32746 18.4696 6.10929 19.422 8.0491 19.8078C9.98891 20.1937 11.9996 19.9957 13.8268 19.2388C15.6541 18.4819 17.2159 17.2002 18.3147 15.5557C19.4135 13.9112 20 11.9778 20 10C19.9971 7.34871 18.9426 4.80684 17.0679 2.9321C15.1932 1.05736 12.6513 0.00286757 10 0ZM10 18.3333C8.35182 18.3333 6.74066 17.8446 5.37025 16.9289C3.99984 16.0132 2.93174 14.7117 2.30101 13.189C1.67028 11.6663 1.50525 9.99075 1.82679 8.37425C2.14834 6.75774 2.94201 5.27288 4.10745 4.10744C5.27288 2.94201 6.75774 2.14833 8.37425 1.82679C9.99076 1.50525 11.6663 1.67027 13.189 2.301C14.7117 2.93173 16.0132 3.99984 16.9289 5.37025C17.8446 6.74066 18.3333 8.35182 18.3333 10C18.3309 12.2094 17.4522 14.3276 15.8899 15.8899C14.3276 17.4522 12.2094 18.3309 10 18.3333ZM14.1667 10C14.1667 10.221 14.0789 10.433 13.9226 10.5893C13.7663 10.7455 13.5543 10.8333 13.3333 10.8333H10.8333V13.3333C10.8333 13.5543 10.7455 13.7663 10.5893 13.9226C10.433 14.0789 10.221 14.1667 10 14.1667C9.77899 14.1667 9.56703 14.0789 9.41075 13.9226C9.25447 13.7663 9.16667 13.5543 9.16667 13.3333V10.8333H6.66667C6.44566 10.8333 6.23369 10.7455 6.07741 10.5893C5.92113 10.433 5.83334 10.221 5.83334 10C5.83334 9.77899 5.92113 9.56702 6.07741 9.41074C6.23369 9.25446 6.44566 9.16667 6.66667 9.16667H9.16667V6.66667C9.16667 6.44565 9.25447 6.23369 9.41075 6.07741C9.56703 5.92113 9.77899 5.83333 10 5.83333C10.221 5.83333 10.433 5.92113 10.5893 6.07741C10.7455 6.23369 10.8333 6.44565 10.8333 6.66667V9.16667H13.3333C13.5543 9.16667 13.7663 9.25446 13.9226 9.41074C14.0789 9.56702 14.1667 9.77899 14.1667 10Z"
                  fill="#0C5577"
                />
              </svg>
              <span className="text-[#0C5577] text-sm font-medium leading-5">
                Add Another Address
              </span>
            </button>

            <Label text=" Shareholder’s Name" />

            {shareholderFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-3 rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]"
              >
                <Input
                  {...register(`shareholders.${index}.name`)}
                  placeholder="Write Name"
                  className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2"
                />
              </div>
            ))}

            <button
              type="button"
              className="flex items-center gap-2 mt-2 ml-1"
              onClick={() => appendShareholder({ name: '' })}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10 0C8.02219 0 6.08879 0.58649 4.4443 1.6853C2.79981 2.78412 1.51809 4.3459 0.761209 6.17316C0.00433286 8.00043 -0.1937 10.0111 0.192152 11.9509C0.578004 13.8907 1.53041 15.6725 2.92894 17.0711C4.32746 18.4696 6.10929 19.422 8.0491 19.8078C9.98891 20.1937 11.9996 19.9957 13.8268 19.2388C15.6541 18.4819 17.2159 17.2002 18.3147 15.5557C19.4135 13.9112 20 11.9778 20 10C19.9971 7.34871 18.9426 4.80684 17.0679 2.9321C15.1932 1.05736 12.6513 0.00286757 10 0ZM10 18.3333C8.35182 18.3333 6.74066 17.8446 5.37025 16.9289C3.99984 16.0132 2.93174 14.7117 2.30101 13.189C1.67028 11.6663 1.50525 9.99075 1.82679 8.37425C2.14834 6.75774 2.94201 5.27288 4.10745 4.10744C5.27288 2.94201 6.75774 2.14833 8.37425 1.82679C9.99076 1.50525 11.6663 1.67027 13.189 2.301C14.7117 2.93173 16.0132 3.99984 16.9289 5.37025C17.8446 6.74066 18.3333 8.35182 18.3333 10C18.3309 12.2094 17.4522 14.3276 15.8899 15.8899C14.3276 17.4522 12.2094 18.3309 10 18.3333ZM14.1667 10C14.1667 10.221 14.0789 10.433 13.9226 10.5893C13.7663 10.7455 13.5543 10.8333 13.3333 10.8333H10.8333V13.3333C10.8333 13.5543 10.7455 13.7663 10.5893 13.9226C10.433 14.0789 10.221 14.1667 10 14.1667C9.77899 14.1667 9.56703 14.0789 9.41075 13.9226C9.25447 13.7663 9.16667 13.5543 9.16667 13.3333V10.8333H6.66667C6.44566 10.8333 6.23369 10.7455 6.07741 10.5893C5.92113 10.433 5.83334 10.221 5.83334 10C5.83334 9.77899 5.92113 9.56702 6.07741 9.41074C6.23369 9.25446 6.44566 9.16667 6.66667 9.16667H9.16667V6.66667C9.16667 6.44565 9.25447 6.23369 9.41075 6.07741C9.56703 5.92113 9.77899 5.83333 10 5.83333C10.221 5.83333 10.433 5.92113 10.5893 6.07741C10.7455 6.23369 10.8333 6.44565 10.8333 6.66667V9.16667H13.3333C13.5543 9.16667 13.7663 9.25446 13.9226 9.41074C14.0789 9.56702 14.1667 9.77899 14.1667 10Z"
                  fill="#0C5577"
                />
              </svg>
              <span className="text-[#0C5577] text-sm font-medium leading-5">
                Add Another Shareholder
              </span>
            </button>

            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-[Poppins] mt-5">
              Contact Person Details
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

            <Label text=" Client Contact Person Name" />
            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('clientContactPersonName', {})}
                  placeholder="Please write the PIC from Client Side"
                />
              </div>
            </div>

            <Label text=" Designation & Position" />

            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('designationAndPosition', {})}
                  placeholder="e.g., CEO, Sales Manager"
                />
              </div>
            </div>

            <Label text=" Email Address" />
            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('emailAddress', {})}
                  placeholder="jhondoe@comapny.co.jp"
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="18"
                      viewBox="0 0 20 18"
                      fill="none"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2.45148 2.70885C1.81896 3.29618 1.39535 4.24917 1.39535 5.7441V12.2557C1.39535 13.7506 1.81896 14.7036 2.45148 15.291C3.09335 15.887 4.06044 16.2092 5.34884 16.2092H14.6512C15.9395 16.2092 16.9066 15.887 17.5486 15.291C18.181 14.7036 18.6047 13.7506 18.6047 12.2557V5.7441C18.6047 4.24917 18.181 3.29618 17.5486 2.70885C16.9066 2.11282 15.9395 1.79061 14.6512 1.79061H5.34884C4.06044 1.79061 3.09335 2.11282 2.45148 2.70885ZM1.50201 1.68633C2.48805 0.770733 3.84654 0.395264 5.34884 0.395264H14.6512C16.1535 0.395264 17.512 0.770733 18.498 1.68633C19.4934 2.61063 20 3.98322 20 5.7441V12.2557C20 14.0167 19.4934 15.3892 18.498 16.3135C17.512 17.2291 16.1535 17.6046 14.6512 17.6046H5.34884C3.84654 17.6046 2.48805 17.2291 1.50201 16.3135C0.506623 15.3892 0 14.0167 0 12.2557V5.7441C0 3.98322 0.506623 2.61063 1.50201 1.68633Z"
                        fill="#838383"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M16.8489 4.63734C17.0845 4.94223 17.0283 5.38039 16.7235 5.61598L11.5634 9.60323C10.6421 10.315 9.35639 10.315 8.43509 9.60323L3.27503 5.61598C2.97013 5.38039 2.91395 4.94223 3.14955 4.63734C3.38515 4.33243 3.8233 4.27626 4.1282 4.51186L9.28821 8.49905C9.707 8.82268 10.2915 8.82268 10.7102 8.49905L15.8703 4.51186C16.1752 4.27626 16.6133 4.33243 16.8489 4.63734Z"
                        fill="#838383"
                      />
                    </svg>
                  }
                  className="h-[37px] p-0 pl-10 pr-2"
                />
              </div>
            </div>

            <Label text="Phone Number" />
            {contactFields.map((field, index) => (
              <div key={field.id} className="w-full sm:w-80 md:w-96 lg:w-[500px]">
                <div className="flex items-center gap-3 rounded-md w-full">
                  <Input
                    {...register(`contactPersons.${index}.phoneNumber`)}
                    placeholder="+88 01750760692"
                    className="w-full text-gray-600 text-sm font-medium placeholder-gray-400"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendContact({ phoneNumber: '' })}
              className="flex items-center gap-2 mt-2 ml-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10 0C8.02219 0 6.08879 0.58649 4.4443 1.6853C2.79981 2.78412 1.51809 4.3459 0.761209 6.17316C0.00433286 8.00043 -0.1937 10.0111 0.192152 11.9509C0.578004 13.8907 1.53041 15.6725 2.92894 17.0711C4.32746 18.4696 6.10929 19.422 8.0491 19.8078C9.98891 20.1937 11.9996 19.9957 13.8268 19.2388C15.6541 18.4819 17.2159 17.2002 18.3147 15.5557C19.4135 13.9112 20 11.9778 20 10C19.9971 7.34871 18.9426 4.80684 17.0679 2.9321C15.1932 1.05736 12.6513 0.00286757 10 0ZM10 18.3333C8.35182 18.3333 6.74066 17.8446 5.37025 16.9289C3.99984 16.0132 2.93174 14.7117 2.30101 13.189C1.67028 11.6663 1.50525 9.99075 1.82679 8.37425C2.14834 6.75774 2.94201 5.27288 4.10745 4.10744C5.27288 2.94201 6.75774 2.14833 8.37425 1.82679C9.99076 1.50525 11.6663 1.67027 13.189 2.301C14.7117 2.93173 16.0132 3.99984 16.9289 5.37025C17.8446 6.74066 18.3333 8.35182 18.3333 10C18.3309 12.2094 17.4522 14.3276 15.8899 15.8899C14.3276 17.4522 12.2094 18.3309 10 18.3333ZM14.1667 10C14.1667 10.221 14.0789 10.433 13.9226 10.5893C13.7663 10.7455 13.5543 10.8333 13.3333 10.8333H10.8333V13.3333C10.8333 13.5543 10.7455 13.7663 10.5893 13.9226C10.433 14.0789 10.221 14.1667 10 14.1667C9.77899 14.1667 9.56703 14.0789 9.41075 13.9226C9.25447 13.7663 9.16667 13.5543 9.16667 13.3333V10.8333H6.66667C6.44566 10.8333 6.23369 10.7455 6.07741 10.5893C5.92113 10.433 5.83334 10.221 5.83334 10C5.83334 9.77899 5.92113 9.56702 6.07741 9.41074C6.23369 9.25446 6.44566 9.16667 6.66667 9.16667H9.16667V6.66667C9.16667 6.44565 9.25447 6.23369 9.41075 6.07741C9.56703 5.92113 9.77899 5.83333 10 5.83333C10.221 5.83333 10.433 5.92113 10.5893 6.07741C10.7455 6.23369 10.8333 6.44565 10.8333 6.66667V9.16667H13.3333C13.5543 9.16667 13.7663 9.25446 13.9226 9.41074C14.0789 9.56702 14.1667 9.77899 14.1667 10Z"
                  fill="#0C5577"
                />
              </svg>
              <span className="text-[#0C5577] text-sm font-medium leading-5">
                Add Another Phone Number
              </span>
            </button>

            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-[Poppins] mt-5">
              Social Media Links
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

            <Label text="Website Link" />

            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('websiteLink', {})}
                  placeholder="Company’s website Link"
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <mask id="mask0_180_32081">
                        <path d="M20 0H0V20H20V0Z" fill="white" />
                      </mask>
                      <g mask="url(#mask0_180_32081)">
                        <path
                          d="M17.526 6.93208C17.912 7.87787 18.125 8.91325 18.125 10H19.375C19.375 8.74858 19.1294 7.55293 18.6833 6.45978L17.526 6.93208ZM18.125 10C18.125 10.5772 18.0649 11.1398 17.9508 11.682L19.174 11.9394C19.3058 11.3131 19.375 10.6643 19.375 10H18.125ZM17.9508 11.682C17.2908 14.8189 14.819 17.2908 11.682 17.9508L11.9394 19.174C15.5612 18.4119 18.4119 15.5612 19.174 11.9394L17.9508 11.682ZM11.682 17.9508C11.1398 18.0649 10.5772 18.125 10 18.125V19.375C10.6643 19.375 11.3131 19.3058 11.9394 19.174L11.682 17.9508ZM10 18.125C9.42267 18.125 8.86017 18.0649 8.31797 17.9508L8.06058 19.174C8.68683 19.3058 9.33567 19.375 10 19.375V18.125ZM1.875 10C1.875 8.91242 2.08834 7.87624 2.47488 6.92987L1.31768 6.45722C0.870917 7.55106 0.625 8.74758 0.625 10H1.875ZM8.31797 17.9508C5.18103 17.2908 2.70927 14.8189 2.04919 11.682L0.825978 11.9394C1.58809 15.5612 4.43873 18.4119 8.06058 19.174L8.31797 17.9508ZM2.04919 11.682C1.93511 11.1398 1.875 10.5772 1.875 10H0.625C0.625 10.6643 0.694192 11.3131 0.825978 11.9394L2.04919 11.682ZM2.47488 6.92987C3.48089 4.4668 5.66151 2.60817 8.31796 2.04919L8.06058 0.825978C4.99193 1.47168 2.47808 3.61617 1.31768 6.45722L2.47488 6.92987ZM8.31796 2.04919C8.86017 1.93511 9.42267 1.875 10 1.875V0.625C9.33567 0.625 8.68683 0.694192 8.06058 0.825978L8.31796 2.04919ZM10 1.875C10.5772 1.875 11.1398 1.93511 11.682 2.04919L11.9394 0.825978C11.3131 0.694192 10.6643 0.625 10 0.625V1.875ZM11.682 2.04919C14.3392 2.60833 16.5204 4.46792 17.526 6.93208L18.6833 6.45978C17.5234 3.61747 15.009 1.47187 11.9394 0.825978L11.682 2.04919ZM11.2153 1.62757C11.4568 2.3845 12.3512 5.29684 12.7179 7.9735L13.9563 7.80384C13.5742 5.01387 12.6511 2.01529 12.4062 1.2476L11.2153 1.62757ZM12.7179 7.9735C12.8162 8.691 12.875 9.38067 12.875 10H14.125C14.125 9.30675 14.0596 8.5575 13.9563 7.80384L12.7179 7.9735ZM17.8518 6.12702C16.891 6.41843 15.0861 6.93033 13.2237 7.27405L13.4506 8.50333C15.3788 8.14742 17.2341 7.62061 18.2147 7.32321L17.8518 6.12702ZM13.2237 7.27405C12.0941 7.48253 10.9649 7.625 10 7.625V8.875C11.0728 8.875 12.2858 8.71825 13.4506 8.50333L13.2237 7.27405ZM12.875 10C12.875 10.9174 12.7462 11.984 12.5539 13.0592L13.7844 13.2792C13.9831 12.1683 14.125 11.021 14.125 10H12.875ZM12.5539 13.0592C12.1326 15.416 11.4247 17.7161 11.2153 18.3724L12.4062 18.7524C12.6208 18.0797 13.3484 15.7177 13.7844 13.2792L12.5539 13.0592ZM18.3724 11.2153C17.7161 11.4247 15.416 12.1326 13.0592 12.5539L13.2792 13.7844C15.7177 13.3484 18.0797 12.6208 18.7524 12.4062L18.3724 11.2153ZM13.0592 12.5539C11.984 12.7462 10.9174 12.875 10 12.875V14.125C11.021 14.125 12.1683 13.9831 13.2792 13.7844L13.0592 12.5539ZM10 12.875C9.08258 12.875 8.01602 12.7462 6.94081 12.5539L6.7208 13.7844C7.83172 13.9831 8.979 14.125 10 14.125V12.875ZM6.94081 12.5539C4.58397 12.1326 2.28388 11.4247 1.62757 11.2153L1.2476 12.4062C1.92031 12.6208 4.28227 13.3484 6.7208 13.7844L6.94081 12.5539ZM5.875 10C5.875 11.021 6.01693 12.1683 6.21556 13.2792L7.44605 13.0592C7.2538 11.984 7.125 10.9174 7.125 10H5.875ZM6.21556 13.2792C6.65157 15.7177 7.3792 18.0797 7.59384 18.7524L8.78467 18.3724C8.57525 17.7161 7.86745 15.416 7.44605 13.0592L6.21556 13.2792ZM7.59384 1.2476C7.34889 2.01529 6.42583 5.01387 6.04362 7.80384L7.28205 7.9735C7.64874 5.29684 8.54317 2.3845 8.78467 1.62757L7.59384 1.2476ZM6.04362 7.80384C5.94038 8.5575 5.875 9.30675 5.875 10H7.125C7.125 9.38067 7.18377 8.691 7.28205 7.9735L6.04362 7.80384ZM10 7.625C9.03508 7.625 7.90592 7.48253 6.77627 7.27405L6.54941 8.50333C7.71414 8.71825 8.92717 8.875 10 8.875V7.625ZM6.77627 7.27405C4.91322 6.93021 3.10768 6.41807 2.14714 6.12671L1.7843 7.32289C2.76458 7.62023 4.62048 8.14729 6.54941 8.50333L6.77627 7.27405ZM17.8167 6.14125C17.8266 6.13608 17.8387 6.13099 17.8518 6.12702L18.2147 7.32321C18.2775 7.30415 18.3366 7.27974 18.3927 7.25062L17.8167 6.14125ZM1.57021 7.22674C1.63602 7.26698 1.7074 7.29957 1.7843 7.32289L2.14714 6.12671C2.17486 6.13512 2.2004 6.14692 2.22236 6.16035L1.57021 7.22674Z"
                          fill="black"
                        />
                      </g>
                    </svg>
                  }
                  className="h-[37px] p-0 pl-10 pr-2"
                />
              </div>
            </div>

            <Label text="LinkedIn Link" />

            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('linkedinLink', {})}
                  placeholder="Company’s Linkedin Link"
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                    >
                      <path
                        d="M10 7.70312V7.67188C10 7.67188 9.99479 7.67188 9.98438 7.67188C9.97396 7.67188 9.97917 7.68229 10 7.70312ZM4.0625 17.5156H0.25V6.01562H4.0625V17.5156ZM2.15625 4.45312C1.48958 4.45312 0.963542 4.26042 0.578125 3.875C0.192708 3.48958 0 3.01562 0 2.45312C0 1.89062 0.197917 1.41667 0.59375 1.03125C0.989583 0.645834 1.52083 0.453125 2.1875 0.453125C2.83333 0.453125 3.34375 0.645834 3.71875 1.03125C4.09375 1.41667 4.29167 1.89062 4.3125 2.45312C4.3125 3.01562 4.11458 3.48958 3.71875 3.875C3.32292 4.26042 2.80208 4.45312 2.15625 4.45312ZM17.8438 17.5156H14V11.3906C14 10.6198 13.8542 9.99479 13.5625 9.51562C13.2708 9.03646 12.7708 8.79688 12.0625 8.79688C11.5417 8.79688 11.1198 8.94271 10.7969 9.23438C10.474 9.52604 10.2396 9.83854 10.0938 10.1719C10.0521 10.3177 10.026 10.4688 10.0156 10.625C10.0052 10.7812 10 10.9427 10 11.1094V17.5469H6.15625C6.15625 17.5469 6.16667 16.9948 6.1875 15.8906C6.1875 14.8073 6.1875 13.5781 6.1875 12.2031C6.1875 10.8281 6.1875 9.52604 6.1875 8.29688C6.1875 7.06771 6.17708 6.31771 6.15625 6.04688H10V7.67188C10.25 7.29688 10.6354 6.88542 11.1562 6.4375C11.6771 5.98958 12.4375 5.76562 13.4375 5.76562C14.6875 5.76562 15.7344 6.1875 16.5781 7.03125C17.4219 7.875 17.8438 9.17188 17.8438 10.9219V17.5156Z"
                        fill="#0077B5"
                      />
                    </svg>
                  }
                  className="h-[37px] p-0 pl-10 pr-2"
                />
              </div>
            </div>

            <Label text="X (Twitter) Link" />

            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('twitterLink', {})}
                  placeholder="Copy & Paste the buyer’s X (Twitter) Link here"
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="18"
                      viewBox="0 0 20 18"
                      fill="none"
                    >
                      <path
                        d="M2.5 1.26562L14.0625 16.7344H16.6875L5.125 1.26562H2.5ZM13.4375 17.9531L8.1875 10.9219L1.6875 17.9531H0L7.4375 9.92188L0.0625 0.046875H5.75L10.5938 6.51562L16.5938 0.046875H18.25L11.3438 7.51562L19.1562 17.9531H13.4375Z"
                        fill="black"
                      />
                    </svg>
                  }
                  className="h-[37px] p-0 pl-10 pr-2"
                />
              </div>
            </div>

            <Label text="Investor's Profile Download Link" />
            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('investorProfileLink')}
                  placeholder="https://example.com/profile.pdf"
                  className="h-[37px] p-0 pr-2"
                />
              </div>
            </div>
          </div>

          <div className="flex w-[2px] bg-gray-300 h-[1200px] mt-[90px]">
            <span className="opacity-0">|</span>
          </div>

          <div className="mt-[80px] ml-[-55px]">
            <DealroomID
              name="dealroomId"
              control={control}
              label="Buyer ID"
              description="The Buyer ID (e.g., TH-B-1) signifies the location (TH = Thailand), the entity type (B = Buyer), and a unique sequential number (1 = first buyer from Thailand)."
              onSave={handleDealroomIdSave}
              iconSrc={
                <svg
                  width="20"
                  height="22"
                  viewBox="0 0 20 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.8351 5.6896H17.9426C18.1306 5.68979 18.3117 5.75973 18.4511 5.88588C18.5904 6.01203 18.6779 6.1854 18.6967 6.37241L19.1595 11.0003H17.6331L17.2537 7.20694H14.8351V9.48295C14.8351 9.68417 14.7552 9.87714 14.6129 10.0194C14.4706 10.1617 14.2776 10.2416 14.0764 10.2416C13.8752 10.2416 13.6822 10.1617 13.54 10.0194C13.3977 9.87714 13.3178 9.68417 13.3178 9.48295V7.20694H7.24839V9.48295C7.24839 9.68417 7.16846 9.87714 7.02618 10.0194C6.8839 10.1617 6.69093 10.2416 6.48972 10.2416C6.2885 10.2416 6.09553 10.1617 5.95325 10.0194C5.81098 9.87714 5.73104 9.68417 5.73104 9.48295V7.20694H3.31088L2.09701 19.3457H10.2831V20.863H1.25792C1.15196 20.8629 1.04719 20.8406 0.950367 20.7975C0.853546 20.7545 0.766819 20.6916 0.695774 20.613C0.62473 20.5344 0.570942 20.4417 0.537878 20.3411C0.504814 20.2404 0.493206 20.1339 0.503803 20.0285L1.86941 6.37241C1.88821 6.1854 1.97575 6.01203 2.11507 5.88588C2.25439 5.75973 2.43558 5.68979 2.62353 5.6896H5.73104V5.16005C5.73104 2.52898 7.75821 0.378906 10.2831 0.378906C12.8079 0.378906 14.8351 2.52898 14.8351 5.16005V5.69112V5.6896ZM13.3178 5.6896V5.16005C13.3178 3.34834 11.9491 1.89625 10.2831 1.89625C8.61703 1.89625 7.24839 3.34834 7.24839 5.16005V5.69112H13.3178V5.6896ZM18.0928 17.1607L16.3524 15.4218V20.863C16.3524 21.0642 16.2725 21.2572 16.1302 21.3995C15.9879 21.5418 15.795 21.6217 15.5938 21.6217C15.3926 21.6217 15.1996 21.5418 15.0573 21.3995C14.915 21.2572 14.8351 21.0642 14.8351 20.863V15.4218L13.0962 17.1607C13.0262 17.2332 12.9425 17.291 12.85 17.3307C12.7574 17.3705 12.6578 17.3914 12.5571 17.3923C12.4564 17.3932 12.3565 17.374 12.2632 17.3358C12.17 17.2977 12.0853 17.2413 12.0141 17.1701C11.9428 17.0989 11.8865 17.0142 11.8483 16.9209C11.8102 16.8277 11.791 16.7278 11.7919 16.6271C11.7928 16.5263 11.8137 16.4268 11.8534 16.3342C11.8932 16.2416 11.951 16.1579 12.0235 16.0879L15.0581 13.0533C15.2004 12.911 15.3934 12.8311 15.5945 12.8311C15.7957 12.8311 15.9886 12.911 16.1309 13.0533L19.1656 16.0879C19.238 16.1579 19.2958 16.2416 19.3356 16.3342C19.3754 16.4268 19.3963 16.5263 19.3972 16.6271C19.398 16.7278 19.3789 16.8277 19.3407 16.9209C19.3026 17.0142 19.2462 17.0989 19.175 17.1701C19.1038 17.2413 19.0191 17.2977 18.9258 17.3358C18.8326 17.374 18.7327 17.3932 18.6319 17.3923C18.5312 17.3914 18.4316 17.3705 18.3391 17.3307C18.2465 17.291 18.1628 17.2332 18.0928 17.1607Z"
                    fill="white"
                  />
                </svg>
              }
            />

            <div className="flex self-stretch justify-start items-center flex-col mt-[100px] ">
              <div className="bg-white flex flex-row w-full ml-[200px]">
                <div className="gap-[15px] flex flex-col items-center relative">
                  <input
                    type="file"
                    ref={(e) => {
                      register('profilePicture');
                      fileInputRef.current = e;
                    }}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png"
                    className="hidden"
                  />

                  <div
                    className="w-[180px] h-[180px] rounded-[90px] border-[1.05px] border-dashed border-[#064771] bg-white cursor-pointer overflow-hidden flex items-center justify-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-[86.01px] gap-[10.49px] flex flex-col items-center">
                        <PlusSquareIcon className="w-[30.98px] h-[30.98px] text-[#064771]" />
                        <p className="font-['Poppins',Helvetica] font-medium text-[#828282] text-[12px] text-center tracking-[0] leading-[12px]">
                          Upload Buyer Company’s Logo
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="gap-[11px] self-stretch w-full flex flex-col items-center">
                    {fileInfo.map((info, index) => (
                      <div
                        key={index}
                        className="relative self-stretch font-['Poppins',Helvetica] font-normal text-center leading-normal"
                      >
                        <span className="font-light text-[#8b8b8b] tracking-[0] text-md">
                          {info.label} <br />
                        </span>
                        <span className="font-semibold text-[#30313d] tracking-[-0.02px] text-md">
                          {info.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex self-stretch justify-start items-start flex-col gap-[23px] mt-[101px] ml-7  ">
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
                  <ul className="pl-5 list-disc">
                    <li>
                      Complete all required fields <span className="font-bold">(*)</span> to
                      successfully create a new Seller profile.
                    </li>

                    <li>
                      Use the <span className="font-bold">&quot;Company Overview&quot;</span> tab to
                      add more detailed information after creating the basic profile.
                    </li>

                    <li>
                      Upload a <span className="font-bold">company logo</span> for easy
                      identification in the seller portal (max file size: 1MB).
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-[320px] ">
              <Label text="Facebook Link" />

              <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
                <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                  <Input
                    {...register('facebookLink', {})}
                    placeholder="Company’s Facebook Link"
                    leftIcon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="22"
                        viewBox="0 0 10 22"
                        fill="none"
                      >
                        <path
                          d="M9.625 4.125H7.3125C7.125 4.125 6.92188 4.19271 6.70312 4.32812C6.48438 4.46354 6.375 4.72917 6.375 5.125V7.28125H9.625L9.25 10.9688H6.375V21.4375H2.0625V10.9688H0V7.28125H2.0625V4.9375C2.0625 4.08333 2.34375 3.14062 2.90625 2.10938C3.46875 1.07812 4.63542 0.5625 6.40625 0.5625H9.625V4.125Z"
                          fill="#3B5998"
                        />
                      </svg>
                    }
                    className="h-[37px] p-0 pl-10 pr-2"
                  />
                </div>
              </div>

              <Label text="Instagram Link" />

              <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
                <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                  <Input
                    {...register('instagramLink', {})}
                    placeholder="Company’s Instagram Link"
                    leftIcon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="17"
                        height="18"
                        viewBox="0 0 17 18"
                        fill="none"
                      >
                        <path
                          d="M8.50038 4.57886C6.10118 4.57886 4.11328 6.53249 4.11328 8.96595C4.11328 11.3994 6.06691 13.3531 8.50038 13.3531C10.9338 13.3531 12.8875 11.3651 12.8875 8.96595C12.8875 6.56676 10.8996 4.57886 8.50038 4.57886ZM8.50038 11.7764C6.95804 11.7764 5.68989 10.5083 5.68989 8.96595C5.68989 7.42362 6.95804 6.15547 8.50038 6.15547C10.0427 6.15547 11.3109 7.42362 11.3109 8.96595C11.3109 10.5083 10.0427 11.7764 8.50038 11.7764Z"
                          fill="black"
                        />
                        <path
                          d="M13.0604 5.46959C13.6093 5.46959 14.0543 5.02459 14.0543 4.47564C14.0543 3.9267 13.6093 3.48169 13.0604 3.48169C12.5114 3.48169 12.0664 3.9267 12.0664 4.47564C12.0664 5.02459 12.5114 5.46959 13.0604 5.46959Z"
                          fill="black"
                        />
                        <path
                          d="M15.629 1.90524C14.7379 0.979838 13.4698 0.5 12.0302 0.5H4.96976C1.9879 0.5 0 2.4879 0 5.46976V12.496C0 13.9698 0.479839 15.2379 1.43952 16.1633C2.36492 17.0544 3.59879 17.5 5.00403 17.5H11.996C13.4698 17.5 14.7036 17.0202 15.5948 16.1633C16.5202 15.2722 17 14.004 17 12.5302V5.46976C17 4.03024 16.5202 2.79637 15.629 1.90524ZM15.4919 12.5302C15.4919 13.5927 15.1149 14.4496 14.498 15.0323C13.881 15.6149 13.0242 15.9234 11.996 15.9234H5.00403C3.97581 15.9234 3.11895 15.6149 2.50202 15.0323C1.88508 14.4153 1.57661 13.5585 1.57661 12.496V5.46976C1.57661 4.44153 1.88508 3.58468 2.50202 2.96774C3.08468 2.38508 3.97581 2.07661 5.00403 2.07661H12.0645C13.0927 2.07661 13.9496 2.38508 14.5665 3.00202C15.1492 3.61895 15.4919 4.47581 15.4919 5.46976V12.5302Z"
                          fill="black"
                        />
                      </svg>
                    }
                    className="h-[37px] p-0 pl-10 pr-2"
                  />
                </div>
              </div>

              <Label text="YouTube Link" />

              <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
                <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                  <Input
                    {...register('youtubeLink', {})}
                    placeholder="Company’s youtube Link"
                    leftIcon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="19"
                        height="14"
                        viewBox="0 0 19 14"
                        fill="none"
                      >
                        <path
                          d="M12.9395 6.59583L7.65908 3.18904V10.1276L12.9395 6.59583ZM16.2202 0.407356C16.9076 0.407356 17.5325 0.68865 18.0949 1.25124C18.6574 1.81383 18.9386 2.41809 18.9386 3.06402V10.8777C18.9177 11.6279 18.6157 12.2686 18.0325 12.7999C17.4492 13.3313 16.866 13.5969 16.2827 13.5969H2.62862C1.87874 13.5969 1.25384 13.2844 0.753914 12.6593C0.253992 12.0342 0.00403162 11.4612 0.00403162 10.9403V3.06402C-0.0376285 2.43892 0.243578 1.82945 0.84765 1.23561C1.45172 0.641768 2.06621 0.365683 2.69111 0.407356H16.2202Z"
                          fill="#CD201F"
                        />
                      </svg>
                    }
                    className="h-[37px] p-0 pl-10 pr-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ml-7 mt-3">
          <Label text="Details" required />
          <Controller
            name="details"
            control={control}
            render={({ field }) => (
              <TextArea value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />

          <div className="flex justify-between items-center flex-row gap-[916px] mt-[30px]">
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
              <div className="flex justify-start items-end flex-row gap-[10.06532096862793px] h-[34px] text-nowrap">
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
      <AIImportModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApply={handleAIApply}
        type="buyer"
      />
    </form>
  );
};

export default CompanyOverview;

