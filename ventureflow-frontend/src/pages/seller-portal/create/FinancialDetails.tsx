import React, { useState, useEffect } from 'react';
import Label from '../../../components/Label';
import { Input } from '../../../components/Input';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import SelectPicker from '../../../components/SelectPicker';
import { useParams } from 'react-router-dom';
import api from '../../../config/api';
import { useTabStore } from './store/tabStore';
import { showAlert } from '../../../components/Alert';
import { ApproxInput } from '../../../components/ApproxInput';
import { useNavigate } from 'react-router-dom';
import { TextArea } from '../../../components/textarea/TextArea';

type FormValues = {
  defaultCurrency: string;
  valuationMethod: string;
  monthlyRevenue: string;

  annualRevenue: { year: string; value: string }[];

  operatingProfit: { year: string; value: string }[];
  expectedInvestmentAmount: string;
  maximumInvestorSharing: string;
  ebitdavalue: string;
  ebitda_times: string;
};

const FinancialDetails: React.FC = () => {
  const setActiveTab = useTabStore((state) => state.setActiveTab);

  const {
    control,
    handleSubmit,
    register,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({});

  const valuationMethodOptions = [
    { value: 'Default EBITDA Multiple', label: 'Default EBITDA Multiple' },
  ];



  const { id: paramId } = useParams();
  const id = paramId || localStorage.getItem('seller_id');
  const isEditMode = !!paramId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchFinancialDetails = async () => {
      try {
        const response = await api.get(`/api/seller/${id}`);
        setFinancialData(response.data.data.financial_details);

      } catch {
        showAlert({ type: 'error', message: 'Failed to fetch financial data' });
      }
    };

    fetchFinancialDetails();
  }, [id]);



  useEffect(() => {
    if (!financialData) return;
    setValue('defaultCurrency', financialData.default_currency || null);
    setValue('valuationMethod', financialData.valuation_method || null);
    setValue('monthlyRevenue', financialData.monthly_revenue || '');
    setValue('annualRevenue', financialData.annual_revenue || '');
    setValue('expectedInvestmentAmount', financialData.expected_investment_amount || '');
    setValue(
      'maximumInvestorSharing',
      financialData.maximum_investor_shareholding_percentage || ''
    );
    setValue('ebitdavalue', financialData.ebitda_value || '');

    const val = financialData?.ebitda_times;

    const arr = typeof val === 'string' ? JSON.parse(val) : val || [];

    const text = arr.length > 0 ? arr[0] : '';

    setValue('ebitda_times', text);

    let parsed_annual_Value: { year: string; value: string }[] = [];
    if (Array.isArray(financialData.annual_revenue)) {
      parsed_annual_Value = financialData.annual_revenue;
    } else if (typeof financialData.annual_revenue === 'string') {
      try {
        parsed_annual_Value = JSON.parse(financialData.annual_revenue);
      } catch {
        showAlert({ type: 'error', message: 'Failed to parse annual revenue' });
      }
    }

    let parsed_operating_profit: { year: string; value: string }[] = [];

    if (Array.isArray(financialData.operating_profit)) {
      parsed_operating_profit = financialData.operating_profit;
    } else if (typeof financialData.operating_profit === 'string') {
      try {
        parsed_operating_profit = JSON.parse(financialData.operating_profit);
      } catch {
        showAlert({ type: 'error', message: 'Failed to parse operating profit' });
      }
    }

    setValue('operatingProfit', parsed_operating_profit);

    setValue('annualRevenue', parsed_annual_Value);
  }, [financialData, setValue]);

  const [currencyOptions, setCurrencyOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await api.get('/api/currencies');

        const currencies = Array.isArray(response.data.data) ? response.data.data : response.data;

        const formatted = currencies.map((currency: { id: number; currency_name: string }) => ({
          value: String(currency.id),
          label: currency.currency_name,
        }));

        setCurrencyOptions(formatted);
      } catch {
        showAlert({ type: 'error', message: 'Error fetching currencies' });
      }
    };

    fetchCurrencies();
  }, []);

  const onSubmit = async (data: FormValues) => {
    const sellerId = id;

    if (!sellerId) {
      showAlert({
        type: 'error',
        message: 'Seller ID not found. Please complete the previous steps before continuing.',
      });
      return;
    }

    try {
      const payload = {
        default_currency: data.defaultCurrency,
        valuation_method: data.valuationMethod,
        monthly_revenue: data.monthlyRevenue,

        annual_revenue: JSON.stringify(data.annualRevenue),
        operating_profit: JSON.stringify(data.operatingProfit),
        expected_investment_amount: data.expectedInvestmentAmount,
        maximum_investor_shareholding_percentage: data.maximumInvestorSharing,
        ebitda_value: data.ebitdavalue,

        ebitda_times: [data.ebitda_times || ''],
        seller_id: sellerId,
      };

      const response = await api.post('/api/seller/financial-details', payload);


      if (response.data?.data) {
        localStorage.setItem('seller_id', response.data.data);
      }

      showAlert({ type: 'success', message: 'Draft Saved' });
      setActiveTab('partnership-details');
    } catch {
      showAlert({
        type: 'error',
        message: 'Something went wrong while saving. Please try again.',
      });
    }
  };

  const onDraft = async (data: FormValues) => {
    const sellerId = id;

    if (!sellerId) {
      showAlert({
        type: 'error',
        message: 'Seller ID not found. Please complete the previous steps before continuing.',
      });
      return;
    }

    try {
      const payload = {
        default_currency: data.defaultCurrency,
        valuation_method: data.valuationMethod,
        monthly_revenue: data.monthlyRevenue,

        annual_revenue: JSON.stringify(data.annualRevenue),
        operating_profit: JSON.stringify(data.operatingProfit),
        expected_investment_amount: data.expectedInvestmentAmount,
        maximum_investor_shareholding_percentage: data.maximumInvestorSharing,
        ebitda_value: data.ebitdavalue,
        ebitda_times: data.ebitda_times,
        seller_id: sellerId,
        is_draft: '2',
      };

      const response = await api.post('/api/seller/financial-details', payload);



      if (response.data?.data) {
        localStorage.setItem('seller_id', response.data.data);
      }

      showAlert({ type: 'success', message: 'Draft Saved' });
    } catch {
      showAlert({
        type: 'error',
        message: 'Something went wrong while saving. Please try again.',
      });
    }
  };

  const onDraftCancel = async (data: FormValues) => {
    const sellerId = id;

    if (!sellerId) {
      showAlert({
        type: 'error',
        message: 'Seller ID not found. Please complete the previous steps before continuing.',
      });
      return;
    }

    try {
      const payload = {
        default_currency: data.defaultCurrency,
        valuation_method: data.valuationMethod,
        monthly_revenue: data.monthlyRevenue,

        annual_revenue: JSON.stringify(data.annualRevenue),
        operating_profit: JSON.stringify(data.operatingProfit),
        expected_investment_amount: data.expectedInvestmentAmount,
        maximum_investor_shareholding_percentage: data.maximumInvestorSharing,
        ebitda_value: data.ebitdavalue,
        ebitda_times: data.ebitda_times,
        seller_id: sellerId,
        is_draft: '2',
      };

      const response = await api.post('/api/seller/financial-details', payload);
      if (response.data?.data) {
        localStorage.setItem('seller_id', response.data.data);
      }

      showAlert({ type: 'success', message: 'Draft Saved' });
      navigate('/seller-portal');
    } catch {
      showAlert({
        type: 'error',
        message: 'Something went wrong while saving. Please try again.',
      });
    }
  };

  const navigate = useNavigate();

  useForm<FormValues>({
    defaultValues: {
      annualRevenue: [{ year: '', value: '' }],
      operatingProfit: [{ year: '', value: '' }],
    },
  });

  const { fields: annualRevenueFields, append: appendAnnualRevenue } = useFieldArray({
    control,
    name: 'annualRevenue',
  });

  const { fields: operatingProfitFields, append: appendOperatingProfit } = useFieldArray({
    control,
    name: 'operatingProfit',
  });

  useEffect(() => {
    if (annualRevenueFields.length === 0 && control._formValues.annualRevenue?.length === 0) {
      appendAnnualRevenue({ year: '', value: '' });
    }
  }, [annualRevenueFields, appendAnnualRevenue, control]);

  useEffect(() => {
    if (operatingProfitFields.length === 0 && control._formValues.operatingProfit?.length === 0) {
      appendOperatingProfit({ year: '', value: '' });
    }
  }, [operatingProfitFields, appendOperatingProfit, control]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="ml-3 font-poppins ">
        <div className="flex gap-[70px] ">
          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none">
            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-poppins">
              Financial Details
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
              <Label text="Default Currency" required />

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

              <div className="flex row-auto ml-[130px] mt-[25px] ">
                <button
                  className="text-[#064771] text-sm font-medium leading-[19.29px] underline"
                  onClick={() => navigate('/settings/currency/add')}
                  type="button"
                >
                  Register Currency Here
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

            <Controller
              control={control}
              name="defaultCurrency"
              render={({ field }) => (
                <SelectPicker
                  options={currencyOptions}
                  value={field.value}
                  onChange={field.onChange}
                  searchable={false}
                  placeholder="Select from Registered Currency"
                />
              )}
            />

            <Label text="Monthly Revenue" />

            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('monthlyRevenue', {})}
                  placeholder="What is their monthly Revenue"
                />
              </div>
            </div>

            <Label text="Annual Revenue" />

            <div>
              {annualRevenueFields.map((field, index) => (
                <div key={field.id} className="flex gap-[13px] mb-3">
                  <div className="w-[200px]">
                    <Input
                      placeholder="Year"
                      {...register(`annualRevenue.${index}.year`)}
                      type="number"
                    />
                  </div>
                  <span className="text-[#30313D] leading-5 mt-2">-</span>
                  <div className="w-[200px]">
                    <Input placeholder="Value" {...register(`annualRevenue.${index}.value`)} />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="flex items-center gap-2 mt-2 ml-1"
                onClick={() => appendAnnualRevenue({ year: '', value: '' })}
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
                  Add Another Revenue Entry
                </span>
              </button>
            </div>

            <Label text="Operating Profit (Annual/Monthly)" />

            <div>
              {operatingProfitFields.map((field, index) => (
                <div key={field.id} className="flex gap-[13px] mb-3">
                  <div className="w-[200px]">
                    <Input
                      placeholder="Year"
                      {...register(`operatingProfit.${index}.year`)}
                      type="number"
                    />
                  </div>
                  <span className="text-[#30313D] leading-5 mt-2">-</span>
                  <div className="w-[200px]">
                    <Input placeholder="Value" {...register(`operatingProfit.${index}.value`)} />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="flex items-center gap-2 mt-2 ml-1"
                onClick={() => appendOperatingProfit({ year: '', value: '' })}
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
                  Add Another Operating Profit
                </span>
              </button>
            </div>

            <Label text="Expected Investment Amount (Desired Amount)" />

            <div className="flex items-center gap-3 p-[10px_20px_10px_20px]rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <div className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pr-2">
                <Input
                  {...register('expectedInvestmentAmount', {})}
                  placeholder="what is the expected investment?"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label text="Maximum Investor Shareholding Percentage " />
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
              name="maximumInvestorSharing"
              control={control}
              render={({ field }) => <ApproxInput {...field} placeholder="e.g., 54%" />}
            />
          </div>

          <div className="flex flex-col items-start gap-4 p-0 pt-12 pl-7 rounded-none ">
            <p className="w-full text-left text-[#064771] text-lg font-medium leading-5 font-[Poppins]">
              Valuation Details
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
              <Label text="Valuation Method" required />

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
              control={control}
              name="valuationMethod"
              render={({ field }) => (
                <SelectPicker
                  options={valuationMethodOptions}
                  value={field.value}
                  onChange={field.onChange}
                  searchable={false}
                  placeholder="Default EBITDA Multiple"
                />
              )}
            />

            <div className="flex items-center gap-2">
              <Label text="EBITDA Details " />

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

            <div className="flex items-center gap-3 rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
              <Controller
                name="ebitda_times"
                control={control}
                render={({ field }) => (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '500px',
                      minHeight: '80px',
                      overflow: 'auto',
                      wordBreak: 'break-word',
                    }}
                  >
                    <TextArea value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                  </div>
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label text="EBITDA Value" />

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
                <Input {...register('ebitdavalue', {})} placeholder="৳" />
              </div>
            </div>
          </div>

          <div className="flex w-[2px] bg-gray-300 h-[700px] mt-[90px]">
            <span className="opacity-0">|</span>
          </div>

          <div className=" ml-[-70px] mt-[90px]">
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
                  <p>
                    Use the buttons to toggle the visibility of information you want to show or
                    hide. Checkboxed content cannot be toggled off, as it forms the core of the
                    presentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ml-7 mt-[40px]">
          <div className="flex justify-between items-center flex-row gap-[916px] ">
            <div
              className="flex justify-start items-end flex-row gap-[10.06532096862793px] w-[93px] h-[34px]"
              style={{ width: '93px' }}
            >
              <button
                className="flex justify-center items-center flex-row gap-[4.313709259033203px] py-[5.032660484313965px] px-[6.470563888549805px] bg-[#FFF6F7] border-solid border-[#DF272A] border-[0.7664670944213867px] rounded-[49.82036209106445px] w-[100px] h-[34px]"
                style={{ width: '100px' }}
                onClick={() => navigate('/seller-portal')}
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
      </div>
    </form>
  );
};

export default FinancialDetails;
