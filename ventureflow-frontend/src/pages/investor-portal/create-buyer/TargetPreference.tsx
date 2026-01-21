import React, { useState, useEffect } from 'react';
import Label from '../../../components/Label';
import { Input } from '../../../components/Input';
import { useForm, Controller } from 'react-hook-form';
import SelectPicker from '../../../components/SelectPicker';
import DatePicker from '../../../components/DatePicker';
import { Industry, IndustryDropdown } from '../components/IndustryDropdown';
import { Country, Dropdown } from '../components/Dropdown';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { useTabStore } from './store/tabStore';
import { useNavigate } from 'react-router-dom';

type FormValues = {
  employeeCountRange: string;
  managementRetention: string;
  N_Y_B: string;
  certificationLicenses: string[];
  timeline: Date | null;
  borderIndustryPreference: Industry[];
  nicheIndustryPreference: Industry[];
  buyerTargetCountries: Country[];
  mainMarket: Country | null;
  preferredCompanyType: string[];
};

const TargetPreference: React.FC = () => {
  interface Industry {
    id: number;
    name: string;
    status: string;
  }

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await api.get('/api/industries');
        const formatted = response.data.map((industry: { id: number; name: string; status: string }) => ({
          id: industry.id,
          name: industry.name,
          status: industry.status,
        }));
        setIndustries(formatted);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch industries" });
      }
    };

    fetchIndustries();
  }, []);

  const {
    control,
    handleSubmit,
    register,
    formState: { isSubmitting },
    setValue,
  } = useForm<FormValues>();

  const [countries, setCountries] = useState<Country[]>([]);
  const setActiveTab = useTabStore((state) => state.setActiveTab);

  const preferredComapnyTypeOptions = [
    { value: 'LLC', label: 'LLC' },
    { value: 'Corporation', label: 'Corporation' },
    { value: 'PLC', label: 'PLC' },
    { value: 'GmbH', label: 'GmbH' },
    { value: 'Partnership', label: 'Partnership' },
  ];

  interface TargetPrefData {
    emp_count_range: string;
    mgmt_retention: string;
    years_in_biz: string;
    cert: string;
    b_ind_prefs: string;
    n_ind_prefs: string;
    main_market: number | string;
    target_countries: string;
    company_type: string;
    timeline: string;
  }
  const [targetPrefData, setTargetPrefData] = useState<TargetPrefData | null>(null);

  const { id: paramId } = useParams();
  const id = paramId || localStorage.getItem('buyer_id');
  const isEditMode = !!paramId;

  useEffect(() => {
    if (!id) return;
    const fetchCompanyData = async () => {
      try {
        const response = await api.get(`/api/buyer/${id}`);
        setTargetPrefData(response.data.data.target_preference);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch company data" });
      }
    };

    fetchCompanyData();
  }, [id]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/api/countries');
        const formatted = response.data.map((country: { id: number; name: string; svg_icon_url: string }) => ({
          id: country.id,
          name: country.name,
          flagSrc: country.svg_icon_url,
          status: 'unregistered',
        }));
        setCountries(formatted);
      } catch {
        showAlert({ type: "error", message: "Failed to load countries" });
        setError('Failed to load countries.');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    if (!targetPrefData || countries.length === 0) return;

    setValue('employeeCountRange', targetPrefData.emp_count_range || '');
    setValue('managementRetention', targetPrefData.mgmt_retention || '');
    setValue('N_Y_B', targetPrefData.years_in_biz || '');

    const certifications = targetPrefData.cert
      ? JSON.parse(targetPrefData.cert).filter(Boolean)
      : [];
    setValue('certificationLicenses', certifications);

    setValue(
      'borderIndustryPreference',
      targetPrefData.b_ind_prefs ? JSON.parse(targetPrefData.b_ind_prefs) : []
    );
    setValue(
      'nicheIndustryPreference',
      targetPrefData.n_ind_prefs ? JSON.parse(targetPrefData.n_ind_prefs) : []
    );

    const mainMarket = countries.find((c) => c.id == targetPrefData.main_market);
    setValue('mainMarket', mainMarket ?? null);

    const parsedTargetCountries = targetPrefData.target_countries
      ? JSON.parse(targetPrefData.target_countries)
      : [];
    const mappedCountries = Array.isArray(parsedTargetCountries)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? parsedTargetCountries.map((item: any) => typeof item === 'object' ? item : countries.find(c => c.id == item)).filter(Boolean)
      : [];
    setValue('buyerTargetCountries', mappedCountries);

    setValue(
      'preferredCompanyType',
      targetPrefData.company_type ? targetPrefData.company_type.split(', ') : []
    );

    const timelineString = targetPrefData.timeline;

    let timelineValue: Date | null = null;

    if (timelineString) {
      const parsedDate = new Date(timelineString);

      if (!isNaN(parsedDate.getTime())) {
        timelineValue = parsedDate;
      }
    }

    setValue('timeline', timelineValue);
  }, [targetPrefData, countries, setValue]);

  const onSubmit = async (data: FormValues) => {
    const formData = new FormData();



    const buyerId = id;
    formData.append('buyer_id', buyerId || '');

    const normalizeToArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

    const stringFields: (keyof FormValues)[] = [
      'employeeCountRange',
      'managementRetention',
      'N_Y_B',
    ];

    stringFields.forEach((field) => {
      const value = data[field];
      if (value) {
        formData.append(field, value as string);
      }
    });

    const jsonFields: { key: string; value: unknown }[] = [
      { key: 'cert', value: data.certificationLicenses },
      { key: 'b_ind_prefs', value: data.borderIndustryPreference },
      { key: 'n_ind_prefs', value: data.nicheIndustryPreference },
      { key: 'target_countries', value: data.buyerTargetCountries },
    ];

    jsonFields.forEach(({ key, value }) => {
      const normalized = normalizeToArray(value);
      if (normalized.length) {
        formData.append(key, JSON.stringify(normalized));
      }
    });

    if (data.mainMarket) {
      formData.append('main_market', String(data.mainMarket.id));
    }

    if (data.timeline) {
      formData.append('timeline', String(data.timeline));
    }

    if (data.preferredCompanyType !== undefined && data.preferredCompanyType !== null) {
      formData.append('company_type', normalizeToArray(data.preferredCompanyType).join(', '));
    }

    try {
      const response = await api.post('/api/buyer/target-preferences', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      localStorage.setItem('buyer_id', response.data.data);
      showAlert({ type: 'success', message: 'Draft Saved' });
      setActiveTab('financial-details');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showAlert({ type: 'error', message: `Failed to submit buyer target preferences: ${error.response?.data?.detail || error.message}` });
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

    const normalizeToArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

    const stringFields: (keyof FormValues)[] = [
      'employeeCountRange',
      'managementRetention',
      'N_Y_B',
    ];

    stringFields.forEach((field) => {
      const value = data[field];
      if (value) {
        formData.append(field, value as string);
      }
    });
    const jsonFields: { key: string; value: unknown }[] = [
      { key: 'cert', value: data.certificationLicenses },
      { key: 'b_ind_prefs', value: data.borderIndustryPreference },
      { key: 'n_ind_prefs', value: data.nicheIndustryPreference },
      { key: 'target_countries', value: data.buyerTargetCountries },
    ];

    jsonFields.forEach(({ key, value }) => {
      const normalized = normalizeToArray(value);
      if (normalized.length) {
        formData.append(key, JSON.stringify(normalized));
      }
    });

    if (data.mainMarket) {
      formData.append('main_market', String(data.mainMarket.id));
    }

    if (data.timeline) {
      formData.append('timeline', String(data.timeline));
    }

    if (data.preferredCompanyType !== undefined && data.preferredCompanyType !== null) {
      formData.append('company_type', normalizeToArray(data.preferredCompanyType).join(', '));
    }

    try {
      const response = await api.post('/api/buyer/target-preferences', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      localStorage.setItem('buyer_id', response.data.data);
      showAlert({ type: 'success', message: 'Draft Saved' });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showAlert({ type: 'error', message: `Failed to save draft: ${error.response?.data?.detail || error.message}` });
      } else {
        showAlert({ type: 'error', message: 'Unexpected error occurred while saving draft.' });
      }
    }
  };

  const onDraftCancel = async (data: FormValues) => {
    const formData = new FormData();

    const buyerId = id;
    formData.append('buyer_id', buyerId || '');

    formData.append('is_draft', '2');

    const normalizeToArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

    const stringFields: (keyof FormValues)[] = [
      'employeeCountRange',
      'managementRetention',
      'N_Y_B',
    ];

    stringFields.forEach((field) => {
      const value = data[field];
      if (value) {
        formData.append(field, value as string);
      }
    });

    const jsonFields: { key: string; value: unknown }[] = [
      { key: 'cert', value: data.certificationLicenses },
      { key: 'b_ind_prefs', value: data.borderIndustryPreference },
      { key: 'n_ind_prefs', value: data.nicheIndustryPreference },
      { key: 'target_countries', value: data.buyerTargetCountries },
    ];

    jsonFields.forEach(({ key, value }) => {
      const normalized = normalizeToArray(value);
      if (normalized.length) {
        formData.append(key, JSON.stringify(normalized));
      }
    });

    if (data.mainMarket) {
      formData.append('main_market', String(data.mainMarket.id));
    }

    if (data.timeline) {
      formData.append('timeline', String(data.timeline));
    }

    if (data.preferredCompanyType !== undefined && data.preferredCompanyType !== null) {
      formData.append('company_type', normalizeToArray(data.preferredCompanyType).join(', '));
    }

    try {
      const response = await api.post('/api/buyer/target-preferences', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      localStorage.setItem('buyer_id', response.data.data);
      showAlert({ type: 'success', message: 'Draft Saved' });
      navigate('/prospects?tab=investors');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showAlert({ type: 'error', message: `Failed to save draft: ${error.response?.data?.detail || error.message}` });
      } else {
        showAlert({ type: 'error', message: 'Unexpected error occurred while saving draft.' });
      }
    }
  };

  const navigate = useNavigate();
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="pl-[15px]  font-poppins">
        <div className="flex gap-[70px] ">
          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none">
            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
              Primary Preferences
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

            <div className="flex items-center gap-2">
              <Label text="Broder Industry Preferences" required />

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
              name="borderIndustryPreference"
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
              <Label text="Niche / Priority Industry Preferences" required />

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
              name="nicheIndustryPreference"
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
              <Label text="Buyer’s Targeted Countries" required />

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
              name="buyerTargetCountries"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  countries={countries}
                  selected={field.value}
                  onSelect={field.onChange}
                  multiSelect={true}
                />
              )}
            />

            <div className="flex items-center gap-2">
              <Label text="Main Market as Geography" required />

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
              name="mainMarket"
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

            <div className="flex items-center gap-2">
              <Label text="Employee Count Range (FTE)" required />

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

            <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
              <Input
                {...register('employeeCountRange', {})}
                placeholder="e.g., 1-10, 11-50, 51-200, 201-500, 500+"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label text="Management Retention" required />

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

            <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
              <Input
                {...register('managementRetention', {})}
                placeholder="e.g., Required, Preferred, Not Required+"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label text="Number of Years in Business" required />

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

            <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
              <Input
                {...register('N_Y_B', {})}
                placeholder="e.g., 0-1 Years / 1-2 Years / 2-5 Years"
              />
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none ">
            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-[Poppins]">
              Additional Preference
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

            <Label text="Timeline Expectations" />

            <Controller
              control={control}
              name="timeline"
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

            <Label text="Preferred Company Type" />

            <Controller
              control={control}
              name="preferredCompanyType"
              render={({ field }) => (
                <SelectPicker
                  options={preferredComapnyTypeOptions}
                  value={field.value as unknown as string}
                  onChange={field.onChange}
                  searchable={false}
                  placeholder="e.g., LLC, Corporation, PLC, GmbH, Partnership"
                />
              )}
            />

            <div className="flex items-center gap-2">
              <Label text="1. Certification/License" />

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
                  {...register('certificationLicenses.0')}
                  placeholder="Write the name of certification or license"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label text="2. Certification/License" />

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
                  {...register('certificationLicenses.1')}
                  placeholder="Write the name of certification or license"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label text="3. Certification/License" />

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
                  {...register('certificationLicenses.2')}
                  placeholder="Write the name of certification or license"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label text="4. Certification/License" />

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
                  {...register('certificationLicenses.3')}
                  placeholder="Write the name of certification or license"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 ml-1"></div>
          </div>

          <div className="flex w-[2px] bg-gray-300 h-[800px] mt-[75px]">
            <span className="opacity-0">|</span>
          </div>

          <div className=" ml-[-70px] mt-[65px]">
            <div className="flex self-stretch justify-start items-start flex-col gap-[23px] ml-7 ">
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
                <div className="self-stretch text-[#30313D] text-sm">
                  <span className="font-semibold">
                    For Best Matching Result Please:
                    <br />
                  </span>
                  <ul className="list-disc pl-5">
                    <li>
                      Specify your ideal acquisition targets by selecting preferences on the left.
                    </li>
                    <li>
                      Use the filters to narrow down your search based on industry, location, size,
                      and more.
                    </li>
                    <li>
                      For more precise targeting, utilize the &quot;Niche/Priority Industry Preferences&quot;
                      and &quot;Certifications Preferences&quot; sections.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center flex-row gap-[916px] mt-[40px]">
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
    </form>
  );
};

export default TargetPreference;
