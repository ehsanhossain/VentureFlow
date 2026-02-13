/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../assets/breadcrumb';
import { Input } from '../../components/Input';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Country, Dropdown } from './components/Dropdown';
import api from '../../config/api';
import axios from 'axios';
import { showAlert } from '../../components/Alert';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const getBreadcrumbLinks = (t: any) => [
  { label: t('common.home'), url: '/', isCurrentPage: false },
  { label: t('settings.title'), url: '/settings', isCurrentPage: false },
  { label: t('settings.currency.title'), url: '/settings/currency', isCurrentPage: false },
  { label: t('common.register'), url: '', isCurrentPage: true },
];

type FormValues = {
  currencyName: string;
  currencyCode: string;
  currencySign: string;
  country: Country | null;
  exchangeRate: string;
  source: string;
};



interface ApiCurrency {
  id: number;
  currency_name: string;
  currency_code: string;
  currency_sign: string;
  origin_country: number;
  exchange_rate: number;
  source: string;
}

const Register: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbLinks = getBreadcrumbLinks(t);
  const [selectedOption, setSelectedOption] = useState('api');
  const navigate = useNavigate();

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  const [apiRate, setApiRate] = useState<string>(t('settings.currency.ratePlaceholder', 'Enter value equivalent to 1 USD'));

  const { id } = useParams();

  const {
    control,
    handleSubmit,
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

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
        showAlert({ type: "error", message: t('settings.partners.error.fetchCountries') });
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const [currencyData, setCurrencyData] = useState<ApiCurrency | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCurrency = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/currencies/${id}`);
        setCurrencyData(response.data);
      } catch {
        showAlert({ type: "error", message: t('settings.currency.fetchError') });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, [id]);

  useEffect(() => {
    if (!currencyData || countries.length === 0) return;

    setValue('currencyName', currencyData.currency_name);
    setValue('currencyCode', currencyData.currency_code);
    setValue('currencySign', currencyData.currency_sign);



    const selectedCountry = countries.find((c) => String(c.id) === String(currencyData.origin_country));
    setValue('country', selectedCountry ?? null);

    setValue('source', currencyData.source);

    if (currencyData.source == 'manual') {
      setValue('exchangeRate', currencyData.exchange_rate.toString());
      setSelectedOption('manual');
    }
  }, [currencyData, countries, setValue]);

  const currencyCode = useWatch({
    control,
    name: 'currencyCode',
  });

  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!currencyCode) return;

      try {
        const { data } = await axios.get(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
        );

        const code = currencyCode.trim().toLowerCase();
        const rate = data.usd[code];

        if (rate) {
          setApiRate(rate.toString());
          setValue('exchangeRate', rate.toString());
        } else {
          setValue('exchangeRate', '');
          setApiRate(t('settings.currency.invalidCode', 'Invalid currency code'));
        }
      } catch {
        showAlert({ type: "error", message: t('settings.currency.fetchRateError', 'Error fetching exchange rate') });
        setValue('exchangeRate', '');
        setApiRate(t('settings.currency.fetchRateError', 'Error fetching rate'));
      }
    };

    if (selectedOption === 'manual') {
      setValue('exchangeRate', '');
      setValue('source', 'manual');
    } else if (selectedOption === 'api') {
      setValue('exchangeRate', '');
      setValue('source', 'api');
      fetchExchangeRate();
    }
  }, [selectedOption, currencyCode, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        currency_name: data.currencyName,
        currency_code: data.currencyCode,
        currency_sign: data.currencySign,
        origin_country: data.country?.id,
        dollar_unit: 'USD',
        exchange_rate: data.exchangeRate ? parseFloat(data.exchangeRate) : 0,
        source: data.source,
      };
      let response;

      if (id) {
        response = await api.put(`/api/currencies/${id}`, payload);
      } else {
        response = await api.post('/api/currencies', payload);
      }

      showAlert({ type: 'success', message: response.data.message || t('settings.currency.saveSuccess') });
      navigate('/settings/currency');
    } catch (error: any) {
      console.error('Currency save error:', error);
      const errorMessage = error.response?.data?.message || error.message || t('common.errorOccurred');
      showAlert({
        type: 'error',
        message: errorMessage,
      });
    }
  };

  return (
    <div className="h-full overflow-auto">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="animate-spin border-4 border-white border-t-transparent rounded-full w-5 h-5 mr-2"></span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="">
            <div className="flex items-center gap-[13px] w-[1315px] ml-10 mt-4">
              <div className="flex flex-col flex-shrink-0 justify-center items-start gap-4 w-[682px]">
                <div className="flex items-center self-stretch text-gray-900 text-right text-[1.75rem] font-medium leading-[normal]">
                  {t('settings.currency.management')}
                </div>
                <div className="flex items-center self-stretch">
                  <div className="flex items-center gap-2.5 w-[447px]">
                    <button
                      onClick={() => navigate(-1)}
                      className="flex flex-col flex-shrink-0 justify-center items-center gap-1 py-1 px-3 w-[4.125rem] rounded bg-[#064771]"
                    >
                      <div className="flex items-center gap-1">
                        <svg
                          width={14}
                          height={11}
                          viewBox="0 0 14 11"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3.66681 9.85943H9.28387C11.2247 9.85943 12.8003 8.2839 12.8003 6.34304C12.8003 4.40217 11.2247 2.82666 9.28387 2.82666H1.55469"
                            stroke="white"
                            strokeWidth="1.56031"
                            strokeMiterlimit={10}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3.17526 4.59629L1.38281 2.79245L3.17526 1"
                            stroke="white"
                            strokeWidth="1.56031"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <button>
                          <span className="text-white text-[.8125rem] font-semibold">{t('common.back', 'Back')}</span>
                        </button>
                      </div>
                    </button>
                    <div className="flex items-start">
                      <Breadcrumb links={breadcrumbLinks} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start items-start flex-col gap-[33px] mt-10">
              <div className="flex justify-start items-start flex-col gap-4 w-[887px] mt-10 ml-10">
                <p className="self-stretch text-[#0C5577] text-lg font-medium leading-5">
                  {t('settings.currency.details')}
                </p>
                <svg
                  width="880"
                  height="2"
                  viewBox="0 0 920 2"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 1H920" stroke="#BCC2C5" />
                </svg>
              </div>

              <div className="flex self-stretch justify-start items-start flex-row gap-[65px] ml-10">
                <div className="flex justify-start items-start flex-col gap-[30px] w-[394px]">
                  <div className="flex self-stretch justify-between items-start flex-col gap-3.5 h-[70px]">
                    <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                      <span className="text-[#EC1D42] font-semibold leading-[19.28569984436035px]">
                        *
                      </span>
                      <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                        {t('settings.currency.name')}
                      </span>
                    </div>

                    <Input
                      {...register('currencyName', {
                        required: t('settings.currency.nameRequired', 'Currency Name is required'),
                      })}
                      placeholder={t('settings.currency.namePlaceholder')}
                      error={!!errors.currencyName}
                    />
                    {errors.currencyName && (
                      <span className="text-sm text-red-500 mt-[-10px]">
                        {errors.currencyName.message}
                      </span>
                    )}
                  </div>
                  <div className="flex self-stretch justify-between items-start flex-col gap-3.5 h-[70px]">
                    <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                      <span className="text-[#EC1D42] font-semibold leading-[19.28569984436035px]">
                        *
                      </span>
                      <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                        {t('settings.currency.code')}
                      </span>
                    </div>

                    <Input
                      {...register('currencyCode', {
                        required: t('settings.currency.codeRequired', 'Currency Code is required'),
                      })}
                      placeholder={t('settings.currency.codePlaceholder')}
                      error={!!errors.currencyCode}
                    />
                    {errors.currencyCode && (
                      <span className="text-sm text-red-500 mt-[-5px]">
                        {errors.currencyCode.message}
                      </span>
                    )}
                  </div>

                  <div className="flex self-stretch justify-between items-start flex-col gap-3.5 h-[70px]">
                    <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                      <span className="text-[#EC1D42] font-['SF_Pro_Display'] font-semibold leading-[19.28569984436035px]">
                        *
                      </span>
                      <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                        {t('settings.currency.sign')}
                      </span>
                    </div>

                    <Input
                      {...register('currencySign', {
                        required: t('settings.currency.signRequired', 'Currency Sign is required'),
                      })}
                      placeholder={t('settings.currency.signPlaceholder')}
                      error={!!errors.currencySign}
                    />
                    {errors.currencySign && (
                      <span className="text-sm text-red-500 mt-[-5px]">
                        {errors.currencySign.message}
                      </span>
                    )}
                  </div>

                  <div className="flex self-stretch justify-between items-start flex-col gap-3.5 h-[70px]">
                    <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                      <span className="text-[#EC1D42] font-['SF_Pro_Display'] font-semibold leading-[19.28569984436035px]">
                        *
                      </span>
                      <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                        {t('settings.currency.country')}
                      </span>
                    </div>
                    <Controller
                      name="country"
                      control={control}
                      rules={{ required: t('settings.currency.countryRequired', 'Country is required') }}
                      render={({ field }) => (
                        <div className="flex flex-col gap-1 w-full">
                          <Dropdown
                            {...field}
                            countries={countries}
                            selected={field.value}
                            onSelect={field.onChange}
                            placeholder={t('settings.currency.countryPlaceholder')}
                          />
                          {errors.country && (
                            <span className="text-sm text-red-500 ">
                              {errors.country.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                  </div>

                  <div className="flex self-stretch justify-between items-start flex-col gap-3.5 h-[70px]">
                    <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                      <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                        {t('settings.currency.dollarUnit')}
                      </span>
                    </div>
                    <Input placeholder={t('settings.currency.dollarUnit')} readOnly value={t('settings.currency.dollarUnitDefault', 'Default is set to 1.0 USD')} />
                  </div>
                </div>

                <div className="flex justify-start items-start flex-col gap-[41px] w-[394px]">
                  <div className="flex self-stretch justify-start items-start flex-col gap-[30px]">
                    <div className="flex self-stretch justify-start items-start flex-col gap-[18px]">
                      <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                        <div className="flex justify-start items-center flex-row gap-[3px]">
                          <span className="text-gray-900 font-medium leading-[19.2857px]">
                            {t('settings.currency.exchangeRateSource')}
                          </span>
                        </div>
                        <div
                          className="flex justify-center items-center flex-row gap-[8.3333px] py-[1.6667px] px-[2.5px] w-[18px] h-[18px]"
                          style={{ width: '18px' }}
                        ></div>
                      </div>

                      <div>
                        <div className="flex">
                          <div
                            className={`flex justify-center items-center py-[13px] px-[27px] border-solid border-[#CBD5E1] border-[0.5px] rounded-tl-[5px] rounded-bl-[5px] w-[100px] h-[40px] relative ${selectedOption === 'api' ? 'bg-[#D7EBFF]' : 'bg-[#FFFFFF]'
                              }`}
                            onClick={() => setSelectedOption('api')}
                          >
                            <span
                              className={`text-${selectedOption === 'api' ? '#30313D' : '#727272'
                                } text-center font-semibold leading-[20.25px]`}
                            >
                              API
                            </span>
                            {selectedOption === 'api' && (
                              <div
                                className="bg-[#064771] rounded-bl-[40px] absolute w-[100px] h-[5px]"
                                style={{ left: '0px', top: '35px' }}
                              ></div>
                            )}
                          </div>

                          <div
                            className={`flex justify-center items-center py-[13px] px-[27px] border-solid border-[#CBD5E1] border-[0.5px] rounded-tr-[5px] rounded-br-[5px] w-[99px] h-[40px] relative ${selectedOption === 'manual' ? 'bg-[#D7EBFF]' : 'bg-[#FFFFFF]'
                              }`}
                            onClick={() => setSelectedOption('manual')}
                          >
                            <span
                              className={`text-${selectedOption === 'manual' ? '#30313D' : '#727272'
                                } text-center font-semibold leading-[20.25px]`}
                            >
                              Manual
                            </span>
                            {selectedOption === 'manual' && (
                              <div
                                className="bg-[#064771] rounded-bl-[40px] absolute w-[99px] h-[5px]"
                                style={{ left: '0px', top: '35px' }}
                              ></div>
                            )}
                          </div>
                        </div>

                        {selectedOption === 'api' && (
                          <div className="flex justify-start items-start flex-col gap-[22px] w-[361px] mt-5">
                            <div className="flex self-stretch justify-start items-center flex-row gap-3">
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9 0C7.21997 0 5.47991 0.527841 3.99987 1.51677C2.51983 2.50571 1.36628 3.91131 0.685088 5.55585C0.00389957 7.20038 -0.17433 9.00998 0.172936 10.7558C0.520203 12.5016 1.37737 14.1053 2.63604 15.364C3.89471 16.6226 5.49836 17.4798 7.24419 17.8271C8.99002 18.1743 10.7996 17.9961 12.4442 17.3149C14.0887 16.6337 15.4943 15.4802 16.4832 14.0001C17.4722 12.5201 18 10.78 18 9C17.9974 6.61384 17.0484 4.32616 15.3611 2.63889C13.6738 0.951621 11.3862 0.00258081 9 0ZM9 16.5C7.51664 16.5 6.06659 16.0601 4.83323 15.236C3.59986 14.4119 2.63856 13.2406 2.07091 11.8701C1.50325 10.4997 1.35473 8.99168 1.64411 7.53682C1.9335 6.08196 2.64781 4.74559 3.6967 3.6967C4.7456 2.6478 6.08197 1.9335 7.53683 1.64411C8.99168 1.35472 10.4997 1.50325 11.8701 2.0709C13.2406 2.63856 14.4119 3.59985 15.236 4.83322C16.0601 6.06659 16.5 7.51664 16.5 9C16.4978 10.9885 15.7069 12.8948 14.3009 14.3009C12.8948 15.7069 10.9885 16.4978 9 16.5Z"
                                  fill="#16607B"
                                />
                                <path
                                  d="M9 7.50098H8.25C8.05109 7.50098 7.86032 7.57999 7.71967 7.72065C7.57902 7.8613 7.5 8.05206 7.5 8.25098C7.5 8.44989 7.57902 8.64065 7.71967 8.78131C7.86032 8.92196 8.05109 9.00098 8.25 9.00098H9V13.501C9 13.6999 9.07902 13.8907 9.21967 14.0313C9.36032 14.172 9.55109 14.251 9.75 14.251C9.94891 14.251 10.1397 14.172 10.2803 14.0313C10.421 13.8907 10.5 13.6999 10.5 13.501V9.00098C10.5 8.60315 10.342 8.22162 10.0607 7.94032C9.77936 7.65901 9.39782 7.50098 9 7.50098Z"
                                  fill="#16607B"
                                />
                                <path
                                  d="M9 5.99853C9.62132 5.99853 10.125 5.49486 10.125 4.87354C10.125 4.25221 9.62132 3.74854 9 3.74854C8.37868 3.74854 7.875 4.25221 7.875 4.87354C7.875 5.49486 8.37868 5.99853 9 5.99853Z"
                                  fill="#16607B"
                                />
                              </svg>
                              <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                                Application Programming Interface (API)
                              </span>
                            </div>
                            <p className="self-stretch text-gray-600 text-sm">
                              Our API dynamically fetches real-time exchange rates, continuously
                              updated from trusted sources. Rates are converted from USD to the
                              selected country’s currency, ensuring accurate and up-to-date
                              conversions for financial calculations and transactions.
                            </p>
                            <div className="flex self-stretch justify-start items-start flex-col gap-[30px]">
                              <div className="flex self-stretch justify-between items-start flex-col gap-3.5 h-[70px]">
                                <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                                  <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                                    {t('settings.currency.manualRate')}
                                  </span>
                                </div>
                                <Input
                                  placeholder={t('settings.currency.ratePlaceholder')}
                                  readOnly
                                  value={apiRate}
                                />
                              </div>
                              <div className="flex justify-start items-start flex-col gap-[22px] w-[352px]">
                                <div className="flex justify-start items-center flex-row gap-3">
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M9 0C7.21997 0 5.47991 0.527841 3.99987 1.51677C2.51983 2.50571 1.36628 3.91131 0.685088 5.55585C0.00389957 7.20038 -0.17433 9.00998 0.172936 10.7558C0.520203 12.5016 1.37737 14.1053 2.63604 15.364C3.89471 16.6226 5.49836 17.4798 7.24419 17.8271C8.99002 18.1743 10.7996 17.9961 12.4442 17.3149C14.0887 16.6337 15.4943 15.4802 16.4832 14.0001C17.4722 12.5201 18 10.78 18 9C17.9974 6.61384 17.0484 4.32616 15.3611 2.63889C13.6738 0.951621 11.3862 0.00258081 9 0ZM9 16.5C7.51664 16.5 6.06659 16.0601 4.83323 15.236C3.59986 14.4119 2.63856 13.2406 2.07091 11.8701C1.50325 10.4997 1.35473 8.99168 1.64411 7.53682C1.9335 6.08196 2.64781 4.74559 3.6967 3.6967C4.7456 2.6478 6.08197 1.9335 7.53683 1.64411C8.99168 1.35472 10.4997 1.50325 11.8701 2.0709C13.2406 2.63856 14.4119 3.59985 15.236 4.83322C16.0601 6.06659 16.5 7.51664 16.5 9C16.4978 10.9885 15.7069 12.8948 14.3009 14.3009C12.8948 15.7069 10.9885 16.4978 9 16.5Z"
                                      fill="#16607B"
                                    />
                                    <path
                                      d="M9 7.50098H8.25C8.05109 7.50098 7.86032 7.57999 7.71967 7.72065C7.57902 7.8613 7.5 8.05206 7.5 8.25098C7.5 8.44989 7.57902 8.64065 7.71967 8.78131C7.86032 8.92196 8.05109 9.00098 8.25 9.00098H9V13.501C9 13.6999 9.07902 13.8907 9.21967 14.0313C9.36032 14.172 9.55109 14.251 9.75 14.251C9.94891 14.251 10.1397 14.172 10.2803 14.0313C10.421 13.8907 10.5 13.6999 10.5 13.501V9.00098C10.5 8.60315 10.342 8.22162 10.0607 7.94032C9.77936 7.65901 9.39782 7.50098 9 7.50098Z"
                                      fill="#16607B"
                                    />
                                    <path
                                      d="M9 5.99853C9.62132 5.99853 10.125 5.49486 10.125 4.87354C10.125 4.25221 9.62132 3.74854 9 3.74854C8.37868 3.74854 7.875 4.25221 7.875 4.87354C7.875 5.49486 8.37868 5.99853 9 5.99853Z"
                                      fill="#16607B"
                                    />
                                  </svg>
                                  <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                                    Manual Currency Rate
                                  </span>
                                </div>
                                <p className="self-stretch text-gray-600 text-sm">
                                  Enter the exchange rate manually if you&apos;d prefer to set your own.
                                  This option is useful when you need custom rates that are not tied
                                  to real-time data. Ensure the rates are accurate to maintain
                                  consistency in your financial calculations.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedOption === 'manual' && (
                          <div className="flex justify-start items-start flex-col gap-[22px] w-[361px] mt-5">
                            <div className="flex self-stretch justify-start items-center flex-row gap-3">
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9 0C7.21997 0 5.47991 0.527841 3.99987 1.51677C2.51983 2.50571 1.36628 3.91131 0.685088 5.55585C0.00389957 7.20038 -0.17433 9.00998 0.172936 10.7558C0.520203 12.5016 1.37737 14.1053 2.63604 15.364C3.89471 16.6226 5.49836 17.4798 7.24419 17.8271C8.99002 18.1743 10.7996 17.9961 12.4442 17.3149C14.0887 16.6337 15.4943 15.4802 16.4832 14.0001C17.4722 12.5201 18 10.78 18 9C17.9974 6.61384 17.0484 4.32616 15.3611 2.63889C13.6738 0.951621 11.3862 0.00258081 9 0ZM9 16.5C7.51664 16.5 6.06659 16.0601 4.83323 15.236C3.59986 14.4119 2.63856 13.2406 2.07091 11.8701C1.50325 10.4997 1.35473 8.99168 1.64411 7.53682C1.9335 6.08196 2.64781 4.74559 3.6967 3.6967C4.7456 2.6478 6.08197 1.9335 7.53683 1.64411C8.99168 1.35472 10.4997 1.50325 11.8701 2.0709C13.2406 2.63856 14.4119 3.59985 15.236 4.83322C16.0601 6.06659 16.5 7.51664 16.5 9C16.4978 10.9885 15.7069 12.8948 14.3009 14.3009C12.8948 15.7069 10.9885 16.4978 9 16.5Z"
                                  fill="#16607B"
                                />
                                <path
                                  d="M9 7.50098H8.25C8.05109 7.50098 7.86032 7.57999 7.71967 7.72065C7.57902 7.8613 7.5 8.05206 7.5 8.25098C7.5 8.44989 7.57902 8.64065 7.71967 8.78131C7.86032 8.92196 8.05109 9.00098 8.25 9.00098H9V13.501C9 13.6999 9.07902 13.8907 9.21967 14.0313C9.36032 14.172 9.55109 14.251 9.75 14.251C9.94891 14.251 10.1397 14.172 10.2803 14.0313C10.421 13.8907 10.5 13.6999 10.5 13.501V9.00098C10.5 8.60315 10.342 8.22162 10.0607 7.94032C9.77936 7.65901 9.39782 7.50098 9 7.50098Z"
                                  fill="#16607B"
                                />
                                <path
                                  d="M9 5.99853C9.62132 5.99853 10.125 5.49486 10.125 4.87354C10.125 4.25221 9.62132 3.74854 9 3.74854C8.37868 3.74854 7.875 4.25221 7.875 4.87354C7.875 5.49486 8.37868 5.99853 9 5.99853Z"
                                  fill="#16607B"
                                />
                              </svg>
                              <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                                Application Programming Interface (API)
                              </span>
                            </div>
                            <p className="self-stretch text-gray-600 text-sm">
                              Our API dynamically fetches real-time exchange rates, continuously
                              updated from trusted sources. Rates are converted from USD to the
                              selected country’s currency, ensuring accurate and up-to-date
                              conversions for financial calculations and transactions.
                            </p>
                            <div className="flex self-stretch justify-start items-start flex-col gap-[30px]">
                              <div className="flex self-stretch justify-between items-start flex-col gap-3.5 h-[70px]">
                                <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                                  <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                                    {t('settings.currency.manualRate')}
                                  </span>
                                </div>
                                <Input
                                  {...register('exchangeRate', {
                                    required: t('settings.currency.rateRequired', 'Exchange Rate is required'),
                                  })}
                                  placeholder={t('settings.currency.ratePlaceholder')}
                                  error={!!errors.exchangeRate}
                                />
                                {errors.exchangeRate && (
                                  <span className="text-sm text-red-500 mt-[-5px]">
                                    {errors.exchangeRate.message}
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-start items-start flex-col gap-[22px] w-[352px]">
                                <div className="flex justify-start items-center flex-row gap-3">
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M9 0C7.21997 0 5.47991 0.527841 3.99987 1.51677C2.51983 2.50571 1.36628 3.91131 0.685088 5.55585C0.00389957 7.20038 -0.17433 9.00998 0.172936 10.7558C0.520203 12.5016 1.37737 14.1053 2.63604 15.364C3.89471 16.6226 5.49836 17.4798 7.24419 17.8271C8.99002 18.1743 10.7996 17.9961 12.4442 17.3149C14.0887 16.6337 15.4943 15.4802 16.4832 14.0001C17.4722 12.5201 18 10.78 18 9C17.9974 6.61384 17.0484 4.32616 15.3611 2.63889C13.6738 0.951621 11.3862 0.00258081 9 0ZM9 16.5C7.51664 16.5 6.06659 16.0601 4.83323 15.236C3.59986 14.4119 2.63856 13.2406 2.07091 11.8701C1.50325 10.4997 1.35473 8.99168 1.64411 7.53682C1.9335 6.08196 2.64781 4.74559 3.6967 3.6967C4.7456 2.6478 6.08197 1.9335 7.53683 1.64411C8.99168 1.35472 10.4997 1.50325 11.8701 2.0709C13.2406 2.63856 14.4119 3.59985 15.236 4.83322C16.0601 6.06659 16.5 7.51664 16.5 9C16.4978 10.9885 15.7069 12.8948 14.3009 14.3009C12.8948 15.7069 10.9885 16.4978 9 16.5Z"
                                      fill="#16607B"
                                    />
                                    <path
                                      d="M9 7.50098H8.25C8.05109 7.50098 7.86032 7.57999 7.71967 7.72065C7.57902 7.8613 7.5 8.05206 7.5 8.25098C7.5 8.44989 7.57902 8.64065 7.71967 8.78131C7.86032 8.92196 8.05109 9.00098 8.25 9.00098H9V13.501C9 13.6999 9.07902 13.8907 9.21967 14.0313C9.36032 14.172 9.55109 14.251 9.75 14.251C9.94891 14.251 10.1397 14.172 10.2803 14.0313C10.421 13.8907 10.5 13.6999 10.5 13.501V9.00098C10.5 8.60315 10.342 8.22162 10.0607 7.94032C9.77936 7.65901 9.39782 7.50098 9 7.50098Z"
                                      fill="#16607B"
                                    />
                                    <path
                                      d="M9 5.99853C9.62132 5.99853 10.125 5.49486 10.125 4.87354C10.125 4.25221 9.62132 3.74854 9 3.74854C8.37868 3.74854 7.875 4.25221 7.875 4.87354C7.875 5.49486 8.37868 5.99853 9 5.99853Z"
                                      fill="#16607B"
                                    />
                                  </svg>
                                  <span className="text-gray-900 font-medium leading-[19.28569984436035px]">
                                    Manual Currency Rate
                                  </span>
                                </div>
                                <p className="self-stretch text-gray-600 text-sm">
                                  Enter the exchange rate manually if you&apos;d prefer to set your own.
                                  This option is useful when you need custom rates that are not tied
                                  to real-time data. Ensure the rates are accurate to maintain
                                  consistency in your financial calculations.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div></div>
                  </div>
                </div>

                <svg
                  className=" -mr-20 -mt-3"
                  width="2"
                  height="579"
                  viewBox="0 0 2 579"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 0L1.00003 579" stroke="#BCC2C5" />
                </svg>

                <div className="flex justify-start items-start flex-col gap-[23px]  -mt-5 ml-6 ">
                  <div className="flex justify-start items-center flex-row gap-1.5">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 26 26"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.7895 22.0238H10.3012C9.89191 22.0238 9.56206 21.6915 9.56206 21.2846V20.7651C9.56692 20.3186 9.54504 20.0049 9.49803 19.8299C9.24598 18.9068 8.57898 18.1328 7.93305 17.3823C7.7199 17.1367 7.51891 16.9025 7.33412 16.6667C6.40453 15.4842 5.91016 14.0675 5.91016 12.565C5.91016 8.89685 8.89587 5.91357 12.564 5.91357C16.2313 5.91357 19.2162 8.89685 19.2162 12.565C19.2162 14.0684 18.7242 15.4866 17.7922 16.6683C17.6293 16.8774 17.4413 17.0962 17.2452 17.3272C16.5838 18.1052 15.8455 18.9732 15.591 19.8898C15.5464 20.0535 15.5246 20.3477 15.5278 20.7595V21.283C15.5278 21.6915 15.1979 22.0238 14.7895 22.0238ZM11.0419 20.5439H14.0503C14.0585 19.9685 14.1144 19.6848 14.1654 19.5C14.5083 18.2657 15.3576 17.2632 16.1073 16.383C16.3042 16.1512 16.4768 15.9486 16.63 15.7557C17.3538 14.835 17.7371 13.7336 17.7371 12.5658C17.7371 9.71298 15.4176 7.39184 12.5648 7.39184C9.71199 7.39184 7.39085 9.71298 7.39085 12.5658C7.39085 13.7312 7.77339 14.8334 8.49793 15.7541C8.66894 15.9729 8.85615 16.1877 9.05471 16.417C9.73793 17.2105 10.5848 18.1936 10.9269 19.4425C10.9771 19.6378 11.0355 19.9352 11.0419 20.5439Z"
                        fill="#DD7A01"
                      />
                      <path
                        d="M14.7899 23.9805H10.3016C9.89235 23.9805 9.5625 23.6491 9.5625 23.2398C9.5625 22.8313 9.89235 22.5015 10.3016 22.5015H14.7899C15.1984 22.5015 15.5282 22.8313 15.5282 23.2398C15.5282 23.6491 15.1984 23.9805 14.7899 23.9805Z"
                        fill="#DD7A01"
                      />
                    </svg>
                    <span className="text-gray-900 text-lg font-medium">{t('settings.currency.hints')}</span>
                  </div>

                  <div className="w-[480px] p-4  rounded-md ">
                    <ul className="list-disc pl-5 text-gray-900 text-sm">
                      <li>{t('settings.currency.hint1')}</li>
                      <li>{t('settings.currency.hint2')}</li>
                      <li>{t('settings.currency.hint3')}</li>
                    </ul>
                  </div>
                  <div className="flex justify-start items-center flex-row gap-5 fixed bottom-4 right-4">
                    <button
                      onClick={() => navigate('/settings/currency')}
                      className="flex justify-center items-center gap-2 py-1.5 px-2 bg-[#FFF6F7] border border-[#DF272A] rounded-full w-[100px] h-[34px]"
                    >
                      <svg
                        width="20"
                        height="19"
                        viewBox="0 0 20 19"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="9.842"
                          cy="9.491"
                          r="8.584"
                          stroke="#DF272A"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M13.325 6.732L7.082 12.975M13.52 13.17L7.179 6.829"
                          stroke="#DF272A"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-[#DF272A] font-medium">{t('common.cancel')}</span>
                    </button>

                    <button
                      type="submit"
                      className="flex justify-center items-center py-[5px] px-2 bg-[#064771] rounded-full w-[98px] h-[34px] disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="animate-spin border-4 border-white border-t-transparent rounded-full w-5 h-5"></span>
                      ) : (
                        <>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9.84214 0.802246C8.02302 0.802246 6.24476 1.34168 4.73222 2.35232C3.21969 3.36297 2.04081 4.79944 1.34466 6.48008C0.648516 8.16072 0.466373 10.0101 0.821265 11.7942C1.17616 13.5784 2.05214 15.2172 3.33845 16.5035C4.62476 17.7898 6.26362 18.6658 8.04778 19.0207C9.83194 19.3756 11.6813 19.1935 13.3619 18.4973C15.0426 17.8012 16.479 16.6223 17.4897 15.1098C18.5003 13.5972 19.0397 11.819 19.0397 9.99985C19.0371 7.5613 18.0672 5.22339 16.3429 3.49907C14.6186 1.77476 12.2807 0.804884 9.84214 0.802246ZM9.84214 17.6645C8.32621 17.6645 6.84432 17.215 5.58388 16.3728C4.32343 15.5306 3.34103 14.3335 2.76091 12.933C2.18079 11.5325 2.029 9.99135 2.32474 8.50455C2.62049 7.01775 3.35048 5.65203 4.4224 4.58011C5.49432 3.50819 6.86004 2.7782 8.34684 2.48245C9.83364 2.18671 11.3747 2.3385 12.7753 2.91862C14.1758 3.49874 15.3729 4.48114 16.2151 5.74159C17.0573 7.00204 17.5068 8.48392 17.5068 9.99985C17.5046 12.032 16.6963 13.9802 15.2594 15.4171C13.8225 16.854 11.8743 17.6623 9.84214 17.6645ZM13.6745 9.99985C13.6745 10.2031 13.5937 10.3981 13.45 10.5418C13.3062 10.6856 13.1113 10.7663 12.908 10.7663H10.6086V13.0657C10.6086 13.269 10.5279 13.464 10.3841 13.6077C10.2404 13.7514 10.0454 13.8322 9.84214 13.8322C9.63886 13.8322 9.4439 13.7514 9.30017 13.6077C9.15642 13.464 9.07567 13.269 9.07567 13.0657V10.7663H6.77627C6.57299 10.7663 6.37804 10.6856 6.2343 10.5418C6.09056 10.3981 6.0098 10.2031 6.0098 9.99985C6.0098 9.79657 6.09056 9.60162 6.2343 9.45788C6.37804 9.31414 6.57299 9.23338 6.77627 9.23338H9.07567V6.93398C9.07567 6.7307 9.15642 6.53575 9.30017 6.39201C9.4439 6.24827 9.63886 6.16751 9.84214 6.16751C10.0454 6.16751 10.2404 6.24827 10.3841 6.39201C10.5279 6.53575 10.6086 6.7307 10.6086 6.93398V9.23338H12.908C13.1113 9.23338 13.3062 9.31414 13.45 9.45788C13.5937 9.60162 13.6745 9.79657 13.6745 9.99985Z"
                              fill="white"
                            />
                          </svg>
                          {id ? (
                            <span className="text-white text-center font-medium ml-[4px]">
                              {t('common.update')}
                            </span>
                          ) : (
                            <span className="text-white text-center font-medium ml-[4px]">
                              {t('common.create')}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default Register;
