import { useState, useMemo, useEffect, useRef } from 'react';
import ArrowIcon from '../../assets/svg/ArrowIcon';
import { RefreshCwIcon, MoreVertical, Globe, User } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { useTranslation } from 'react-i18next';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/table/table';
import api from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '../../components/ActionButton';
import clsx from 'clsx';
import { showAlert } from '../../components/Alert';

type Currency = {
  id: string | number;
  name: string;
  code: string;
  sign: string;
  country: string | number;
  countryFlag: string;
  dollarUnit: string;
  exchangeRate: string;
  source: string;
  lastUpdated: string;
  modifyIcon: string;
};

interface ApiCurrency {
  id: string | number;
  currency_name: string;
  currency_code: string;
  currency_sign: string;
  origin_country: string;
  flag: string;
  exchange_rate: string;
  source: string;
  updated_at: string;
}

const CurrencyTable = (): JSX.Element => {
  const { t } = useTranslation();

  const tableHeaders: { label: string; key: keyof Currency | 'actions' }[] = [
    { label: t('settings.currency.name'), key: 'name' },
    { label: t('settings.currency.country'), key: 'country' },
    { label: t('settings.currency.exchangeRate'), key: 'exchangeRate' },
    { label: t('settings.currency.lastUpdated'), key: 'lastUpdated' },
  ];

  const [currencyData, setCurrencyData] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Currency;
    direction: 'asc' | 'desc';
  } | null>(null);

  const navigate = useNavigate();
  const [meta, setMeta] = useState<{ total: number; last_page: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openActionId, setOpenActionId] = useState<string | number | null>(null);

  const fetchCurrencyData = async (page = 1, query = '') => {
    try {
      setLoading(true);

      const response = await api.get('/api/currencies', {
        params: { page, search: query },
      });

      const currencyList = response.data.data;
      const meta = response.data.meta;
      if (!Array.isArray(currencyList)) {
        throw new Error("Expected 'data' to be an array of currencies");
      }

      const transformedData: Currency[] = currencyList.map((item: ApiCurrency) => ({
        id: item.id,
        name: item.currency_name ?? '',
        code: item.currency_code ?? '',
        sign: item.currency_sign ?? '',
        country: item.origin_country ?? '',
        countryFlag: item.flag || '/default-flag.png',
        dollarUnit: '1 USD',
        exchangeRate: item.exchange_rate ? parseFloat(item.exchange_rate).toFixed(2) : '0.00',
        source: (item.source || '').toLowerCase(),
        lastUpdated: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '',
        modifyIcon: '/group-291491.png',
      }));

      setCurrencyData(transformedData);
      setMeta(meta);
      setTotalPages(meta?.last_page || 1);
    } catch {
      showAlert({ type: "error", message: t('settings.currency.fetchError') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCurrencyData(1, searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const sortedCurrencyData = useMemo(() => {
    if (!sortConfig || currencyData.length === 0) return currencyData;

    return [...currencyData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === 'exchangeRate') {
        const parse = (val: string | number) => parseFloat(String(val).replace(/[^0-9.]/g, '') || '0');
        return sortConfig.direction === 'asc'
          ? parse(aValue) - parse(bValue)
          : parse(bValue) - parse(aValue);
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [sortConfig, currencyData]);

  const handleSort = (key: keyof Currency | 'actions') => {
    if (key === 'actions') return;
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const [selectedCurrencyIds, setSelectedCurrencyIds] = useState<Set<string | number>>(new Set());

  const handleExportData = () => {
    alert('Exporting data... (Parent function)');
  };

  const handleDeleteData = async (idsToDelete: (number | string)[]) => {
    if (!idsToDelete || idsToDelete.length === 0) {
      alert('Please select at least one item to delete.');
      return false;
    }

    const confirmDelete = window.confirm(
      t('settings.currency.confirmDelete')
    );

    if (!confirmDelete) {

      return false;
    }

    try {

      await api.delete('/api/currencies', {
        data: { ids: idsToDelete },
      });

      fetchCurrencyData();
      return true;
    } catch {
      showAlert({ type: "error", message: t('settings.currency.deleteError') });
      return false;
    }
  };

  const [isComponentOpen, setIsComponentOpen] = useState(false);
  const handleComponentOpen = () => {
    setIsComponentOpen(true);
  };

  const handleBulkDeleteClick = async () => {
    const idsToDeleteArray = Array.from(selectedCurrencyIds);

    if (idsToDeleteArray.length === 0) {
      alert('Please select at least one currency to delete.');
      return;
    }

    const success = await handleDeleteData(idsToDeleteArray);

    if (success) {
      setSelectedCurrencyIds(new Set());
    }
  };

  const handleComponentClose = () => {
    setIsComponentOpen(false);
    setSelectedCurrencyIds(new Set());
  };

  const handleCheckboxChange = (sellerId: number | string) => {
    setSelectedCurrencyIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(sellerId)) {
        newSelectedIds.delete(sellerId);
      } else {
        newSelectedIds.add(sellerId);
      }
      return newSelectedIds;
    });
  };
  const [countries, setCountries] = useState<{ id: number; name: string; svg_icon_url: string }[]>(
    []
  );
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

  return (
    <div className="bg-white flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex flex-col gap-4 px-10 pt-[35px] w-full">
        <div className="flex flex-wrap justify-between items-center gap-4 w-full">
          <div className="text-[#00081a] font-poppins text-[1.75rem] font-medium leading-normal">
            {t('settings.currency.management')}
          </div>

          <button
            className="flex items-center gap-1.5 py-2 px-4 bg-[#064771] rounded-lg hover:bg-[#053a5c] transition-colors h-[40px] shadow-sm"
            onClick={() => navigate('/settings/currency/add')}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.37729 0.556641C7.55818 0.556641 5.77992 1.09607 4.26738 2.10672C2.75484 3.11736 1.57596 4.55383 0.879817 6.23447C0.183673 7.91512 0.00152946 9.76445 0.356421 11.5486C0.711313 13.3328 1.5873 14.9716 2.87361 16.2579C4.15991 17.5442 5.79877 18.4202 7.58293 18.7751C9.36709 19.13 11.2164 18.9479 12.8971 18.2517C14.5777 17.5556 16.0142 16.3767 17.0248 14.8642C18.0355 13.3516 18.5749 11.5734 18.5749 9.75424C18.5723 7.3157 17.6024 4.97778 15.8781 3.25347C14.1538 1.52916 11.8158 0.559278 9.37729 0.556641ZM9.37729 17.4189C7.86137 17.4189 6.37948 16.9694 5.11903 16.1272C3.85858 15.285 2.87618 14.0879 2.29606 12.6874C1.71594 11.2869 1.56416 9.74574 1.8599 8.25894C2.15564 6.77214 2.88563 5.40643 3.95756 4.3345C5.02948 3.26258 6.39519 2.53259 7.88199 2.23685C9.36879 1.94111 10.9099 2.09289 12.3104 2.67301C13.711 3.25313 14.908 4.23553 15.7502 5.49598C16.5924 6.75643 17.042 8.23832 17.042 9.75424C17.0397 11.7864 16.2315 13.7346 14.7946 15.1715C13.3576 16.6084 11.4094 17.4167 9.37729 17.4189ZM13.2096 9.75424C13.2096 9.95752 13.1289 10.1525 12.9851 10.2962C12.8414 10.44 12.6464 10.5207 12.4432 10.5207H10.1438V12.8201C10.1438 13.0234 10.063 13.2183 9.91927 13.3621C9.77553 13.5058 9.58057 13.5866 9.37729 13.5866C9.17402 13.5866 8.97906 13.5058 8.83532 13.3621C8.69158 13.2183 8.61083 13.0234 8.61083 12.8201V10.5207H6.31143C6.10815 10.5207 5.91319 10.44 5.76945 10.2962C5.62571 10.1525 5.54496 9.95752 5.54496 9.75424C5.54496 9.55096 5.62571 9.35601 5.76945 9.21227C5.91319 9.06853 6.10815 8.98778 6.31143 8.98778H8.61083V6.68838C8.61083 6.4851 8.69158 6.29014 8.83532 6.1464C8.97906 6.00266 9.17402 5.92191 9.37729 5.92191C9.58057 5.92191 9.77553 6.00266 9.91927 6.1464C10.063 6.29014 10.1438 6.4851 10.1438 6.68838V8.98778H12.4432C12.6464 8.98778 12.8414 9.06853 12.9851 9.21227C13.1289 9.35601 13.2096 9.55096 13.2096 9.75424Z"
                fill="white"
              />
            </svg>
            <span className="text-white text-sm font-medium font-poppins">{t('settings.currency.add')}</span>
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center py-[25px] px-[20px] ml-4 mr-4 mt-5">
        <div className="flex justify-between items-center gap-3 py-2 px-3 bg-white border border-gray-500 rounded-md w-full max-w-[300px] h-[35px]">
          <div className="flex items-center gap-3 w-full">
            <svg
              width="21"
              height="21"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M9.93309 16.0908C13.5356 16.0908 16.456 13.1704 16.456 9.56786C16.456 5.96534 13.5356 3.04492 9.93309 3.04492C6.33057 3.04492 3.41016 5.96534 3.41016 9.56786C3.41016 13.1704 6.33057 16.0908 9.93309 16.0908Z"
                stroke="#838383"
                strokeWidth="1.49096"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.5469 14.1807L18.3209 17.9547"
                stroke="#838383"
                strokeWidth="1.49096"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder={t('common.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-gray-500 text-sm leading-normal font-poppins bg-transparent border-none outline-none"
            />
          </div>
          <div className="flex items-center gap-2 font-poppins">
            <div className="flex items-center gap-1">
              <div className="flex items-center justify-center bg-gray-200 rounded px-1 w-6 h-5">
                <span className="text-gray-500 text-[10px] font-bold">Ctrl</span>
              </div>
              <span className="text-gray-500 text-xs font-bold">/</span>
              <div className="flex items-center justify-center bg-gray-200 rounded px-1 w-5 h-5">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 17 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.5324 3.52979H11.5324C11.9938 3.52979 12.4362 3.71305 12.7624 4.03926C13.0886 4.36547 13.2719 4.8079 13.2719 5.26923V5.26924C13.2719 5.73057 13.0886 6.173 12.7624 6.49921C12.4362 6.82542 11.9937 7.00868 11.5324 7.00868H9.79297V5.26924C9.79297 4.8079 9.97623 4.36547 10.3024 4.03926C10.6287 3.71305 11.0711 3.52979 11.5324 3.52979V3.52979Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.8125 7.00879H5.07305C4.61172 7.00879 4.16928 6.82553 3.84307 6.49932C3.51686 6.17311 3.3336 5.73067 3.3336 5.26934V5.26934C3.3336 4.80801 3.51686 4.36557 3.84307 4.03936C4.16928 3.71315 4.61172 3.52989 5.07305 3.52989H5.07305C5.53438 3.52989 5.97682 3.71315 6.30303 4.03936C6.62924 4.36557 6.8125 4.80801 6.8125 5.26934V7.00879Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.79297 9.99072H11.5324C11.9937 9.99072 12.4362 10.174 12.7624 10.5002C13.0886 10.8264 13.2719 11.2688 13.2719 11.7302V11.7302C13.2719 12.1915 13.0886 12.6339 12.7624 12.9602C12.4362 13.2864 11.9938 13.4696 11.5324 13.4696H11.5324C11.0711 13.4696 10.6287 13.2864 10.3024 12.9601C9.97623 12.6339 9.79297 12.1915 9.79297 11.7302V9.99072Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.07305 13.4692H5.07305C4.61172 13.4692 4.16928 13.286 3.84307 12.9598C3.51686 12.6336 3.3336 12.1911 3.3336 11.7298V11.7298C3.3336 11.2685 3.51686 10.826 3.84307 10.4998C4.16928 10.1736 4.61172 9.99034 5.07305 9.99034H6.8125V11.7298C6.8125 12.1911 6.62924 12.6336 6.30303 12.9598C5.97682 13.286 5.53438 13.4692 5.07305 13.4692V13.4692Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.79441 7.00879H6.8125V9.9907H9.79441V7.00879Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <span className="text-gray-500 text-xs font-bold">+</span>
            <div className="flex items-center justify-center bg-gray-200 rounded px-1 w-5 h-5">
              <span className="text-gray-600 text-sm font-medium">F</span>
            </div>
          </div>
        </div>

        <div className="flex justify-start items-center gap-2">
          <span className="text-xs sm:text-sm leading-5 font-poppins text-center whitespace-nowrap">
            <span className="text-gray-500">{t('common.showing')}</span>
            <span className="text-gray-800 font-poppins mx-1">{currencyData?.length ?? 0}</span>
            <span className="text-gray-500">{t('common.of')}</span>
            <span className="text-gray-800 font-poppins mx-1">{meta?.total ?? 0}</span>
            <span className="text-gray-500">{t('common.cases')}</span>
          </span>

          <div className="flex items-center gap-2 h-8">
            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-2 h-9">
                <ActionButton
                  onExport={handleExportData}
                  onDelete={handleBulkDeleteClick}
                  onOpen={handleComponentOpen}
                  onClose={handleComponentClose}
                />
              </div>

              <button>
                <div className="flex justify-center items-center flex-row gap-2 py-2 px-3 bg-[#FFFFFF] border-solid border-[#000000] border rounded h-[34px]">
                  <svg
                    width="16"
                    height="17"
                    viewBox="0 0 16 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 8.5H12"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M1.5 5.5H14.5"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.5 11.5H9.5"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#000000] text-sm font-medium leading-normal font-poppins">
                    {t('common.sortBy')}
                  </span>
                </div>
              </button>

              <div className="flex justify-center items-center gap-2 py-2 px-3 bg-white border border-gray-500 rounded-md h-[35px]">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.82902 3.53027H13.5037C13.6 3.53027 13.6942 3.55824 13.7749 3.61078C13.8556 3.66331 13.9193 3.73815 13.9582 3.8262C13.9972 3.91425 14.0097 4.01172 13.9943 4.10676C13.9789 4.2018 13.9362 4.29033 13.8715 4.36157L9.78657 8.85495C9.70341 8.94643 9.65733 9.06562 9.65733 9.18925V12.707C9.65733 12.7888 9.63713 12.8694 9.59852 12.9415C9.55991 13.0137 9.5041 13.0752 9.43602 13.1205L7.44808 14.4458C7.37323 14.4957 7.28624 14.5244 7.19639 14.5287C7.10655 14.5331 7.0172 14.5129 6.93789 14.4705C6.85858 14.4281 6.79228 14.3649 6.74605 14.2877C6.69983 14.2105 6.67541 14.1223 6.67541 14.0323V9.18925C6.67541 9.06562 6.62933 8.94643 6.54617 8.85495L2.46128 4.36157C2.39651 4.29033 2.35383 4.2018 2.33843 4.10676C2.32303 4.01172 2.33557 3.91425 2.37452 3.8262C2.41347 3.73815 2.47716 3.66331 2.55784 3.61078C2.63853 3.55824 2.73274 3.53027 2.82902 3.53027V3.53027Z"
                    stroke="#30313D"
                    strokeWidth="1.49096"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-gray-800 text-sm font-medium font-poppins">{t('common.filter')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <section className="flex-1 w-full px-4 overflow-auto">
        <div className="min-w-full inline-block align-middle">
          <Table className="w-full border-separate border-spacing-y-[10px] font-poppins">
            <TableHeader>
              <TableRow>
                {tableHeaders.map(({ label, key }, idx) => (
                  <TableHead
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`cursor-pointer py-[10px] px-3 font-semibold text-[#727272] text-sm border-t border-b ${idx === 0 ? 'border-l first:rounded-l-lg' : ''
                      } bg-[#F9F9F9] text-center hover:bg-[#d1d1d1] transition-colors`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {label}
                      <ArrowIcon />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="py-[10px] px-3 text-center border-t border-b border-r border-[#E4E4E4] bg-[#F9F9F9] last:rounded-r-lg">
                  <button className="flex items-center justify-center gap-2 bg-[#064771] text-white rounded-full px-4 py-[5px] text-base font-medium hover:bg-[#053d61] transition-colors whitespace-nowrap">
                    <RefreshCwIcon className="w-[15px] h-[15px]" />
                    {t('common.refresh')}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`loading-${i}`} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j} className="py-[10px] px-3 bg-white">
                        <div className="h-4 rounded bg-blue-900/10 w-full"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedCurrencyData.length > 0 ? (
                sortedCurrencyData.map((currency, idx) => {
                  const isSelected = selectedCurrencyIds.has(currency.id);
                  const isActionsOpen = openActionId === currency.id;

                  const countryData = getCountryById(Number(currency.country));

                  return (
                    <TableRow key={idx}>
                      <TableCell
                        className={clsx(
                          'py-[10px] px-3 font-semibold text-[#30313D] text-sm border-t border-b border-l min-w-[120px] rounded-l-lg',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        <div className="flex items-center gap-2 justify-center group relative cursor-help" title={currency.name}>
                          {isComponentOpen && (
                            <input
                              type="checkbox"
                              className="h-5 w-5 border-gray-300 rounded focus:ring-blue-500 shrink-0"
                              style={{ accentColor: '#064771' }}
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(currency.id)}
                            />
                          )}
                          <span className="whitespace-nowrap">{currency.code} {currency.sign}</span>
                        </div>
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[10px] px-3 border-t border-b border-[#E4E4E4] bg-white text-center',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {countryData?.svg_icon_url ? (
                            <img
                              src={countryData?.svg_icon_url}
                              alt="flag"
                              className="w-[20px] h-[20px] rounded-full bg-gray-200 shrink-0"
                            />
                          ) : (
                            <span className="w-[20px] h-[20px] rounded-full bg-gray-200 text-gray-800 text-[8px] flex items-center justify-center shrink-0">
                              n/a
                            </span>
                          )}
                          <span className="text-[#30313D] text-xs font-semibold whitespace-nowrap">
                            {countryData?.name ?? 'N/A'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[10px] px-3 text-center font-semibold text-[#064771] text-sm border-t border-b border-[#E4E4E4] whitespace-nowrap',
                          {
                            'bg-[#F5FBFF] border-[#064771]': isSelected,
                            'bg-white border-[#E4E4E4]': !isSelected,
                          }
                        )}
                      >
                        1 USD = {currency.exchangeRate} {currency.sign}
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[10px] px-3 text-center text-[#30313D] text-sm border-t border-b border-[#E4E4E4] whitespace-nowrap',
                          {
                            'bg-[#F5FBFF] border-[#064771]': isSelected,
                            'bg-white border-[#E4E4E4]': !isSelected,
                          }
                        )}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {currency.source === 'api' ? (
                            <Globe className="w-4 h-4 text-blue-500" />
                          ) : (
                            <User className="w-4 h-4 text-orange-500" />
                          )}
                          <span>{currency.lastUpdated}</span>
                        </div>
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[10px] px-3 text-center border-t border-b border-r rounded-r-lg relative',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        <div className="flex justify-center relative">
                          <button
                            onClick={() => setOpenActionId(isActionsOpen ? null : currency.id)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>

                          {isActionsOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenActionId(null)}
                              ></div>
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20 flex flex-col py-1">
                                <button
                                  onClick={() => {
                                    setOpenActionId(null);
                                    navigate(`/settings/currency/edit/${currency.id}`);
                                  }}
                                  className="px-4 py-2 text-sm text-left hover:bg-gray-100 text-gray-700"
                                >
                                  {t('common.edit')}
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenActionId(null);
                                    handleDeleteData([currency.id]);
                                  }}
                                  className="px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600"
                                >
                                  {t('common.delete')}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-4 text-center text-sm text-gray-500">
                    {t('settings.currency.noCurrencies')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

export default CurrencyTable;
