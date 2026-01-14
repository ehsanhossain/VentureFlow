import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

import Pagination from '../../../components/Pagination';
import ArrowIcon from '../../../assets/svg/ArrowIcon';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/table/table';
import { useTranslation } from 'react-i18next';

const safeJsonParse = <T,>(value: unknown, fallback: T): T => {
  try {
    if (typeof value !== 'string') return value as T;
    if (value === 'N/A' || value.trim() === '') return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

type BuyerRow = {
  no: string;
  seller_name: string;
  countryFlag: string;
  country_pref: string;
  industry_pref: string;
  ebitda_pref: string;
  investment_range: string;
  dealroom: string;
  quickActions: string;
};

const SharedBuyers = (): JSX.Element => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState<any[]>([]);
  const navigate = useNavigate();

  const tableHeaders: {
    label: string;
    key: keyof BuyerRow;
    sortable: boolean;
  }[] = [
      { label: t('common.no'), key: 'no', sortable: false },
      { label: t('settings.partners.buyersName'), key: 'seller_name', sortable: true },
      { label: t('settings.partners.countryPreference'), key: 'country_pref', sortable: true },
      { label: t('settings.partners.industryPref'), key: 'industry_pref', sortable: true },
      { label: t('settings.partners.ebitdaPref'), key: 'ebitda_pref', sortable: true },
      { label: t('settings.partners.investmentRange'), key: 'investment_range', sortable: true },
      { label: t('settings.partners.buyerId'), key: 'dealroom', sortable: false },
      { label: t('common.quickActions'), key: 'quickActions', sortable: false },
    ];

  const [countries, setCountries] = useState<any[]>([]);
  useEffect(() => {
    api
      .get('/api/countries')
      .then((res) => {
        setCountries(res.data);
      })
      .catch((_err) => showAlert({ type: "error", message: t('settings.partners.error.fetchCountries') }))
      .finally(() => setLoading(false));
  }, [t]);

  const getCountryById = (id: number | null) => id ? countries.find((c: any) => c.id === id) : null;

  const [sortConfig, setSortConfig] = useState<{
    key: keyof BuyerRow;
    direction: 'asc' | 'desc';
  } | null>({ key: 'seller_name', direction: 'asc' });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/api/partners/${id}/shared-buyers`)
      .then((res) => {
        setBuyers(res.data.data || []);
      })
      .catch(() => {
        setBuyers([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const buyerData: BuyerRow[] = useMemo(() => {

    if (!Array.isArray(buyers)) return [];
    return buyers.map((buyer: any, index: number) => ({
      no: String(index + 1).padStart(2, '0'),
      buyer_id: buyer?.id || buyer?.buyer_id || t('common.na'),
      seller_name: buyer?.company_overview?.reg_name || t('common.na'),

      hq: buyer?.target_preference?.target_countries
        ? buyer.target_preference.target_countries
        : t('common.na'),
      countryFlag: '/default-flag.png',
      country_pref: buyer?.target_preference?.preferred_country || t('common.na'),

      industry_pref: (() => {
        const raw = buyer?.target_preference?.b_ind_prefs;
        const parsed = safeJsonParse(raw, []);
        if (!Array.isArray(parsed) || parsed.length === 0) return t('common.na');

        const joinedNames = parsed.map((item: any) => item.name).join(', ');
        return joinedNames.length > 50 ? joinedNames.substring(0, 20) + '...' : joinedNames;
      })(),

      ebitda_pref: (() => {
        const raw = buyer?.financial_details?.ebitda_multiple;
        const parsed = safeJsonParse<any>(raw, null);
        if (parsed && typeof parsed === 'object') {
          return `${parsed.years || t('common.na')} - ${parsed.amount || t('common.na')}`;
        }
        return t('common.na');
      })(),

      investment_range: buyer?.financial_details?.investment_budget
        ? (() => {
          const { min, max } = JSON.parse(buyer.financial_details.investment_budget);
          return `${min} - ${max}`;
        })()
        : t('common.na'),

      dealroom: buyer?.buyer_id || t('common.na'),
      quickActions: buyer?.status || t('common.na'),
    }));
  }, [buyers, t]);

  const sortedBuyerData = useMemo(() => {
    if (!sortConfig) return buyerData;
    const sorted = [...buyerData];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });
    return sorted;
  }, [sortConfig, buyerData]);

  const handleSort = (key: keyof BuyerRow) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  if (loading) return <p className="p-4">{t('common.loading')}</p>;
  if (!buyerData.length) return <p className="p-4">{t('settings.partners.noSharedBuyers')}</p>;

  return (
    <div>
      <section className="flex flex-col gap-3.5 w-full px-8 mt-[15px]">
        <div className="w-full">
          <Table className="w-full border-separate border-spacing-y-[10px]">
            <TableHeader>
              <TableRow className="rounded-lg">
                {tableHeaders.map((header, idx) => (
                  <TableHead
                    key={header.key}
                    onClick={() => header.sortable && handleSort(header.key)}
                    className={`py-[10px] px-3 font-semibold text-[#727272] text-sm border-t border-b ${idx === 0 ? 'border-l first:rounded-l-lg text-left' : 'text-center'
                      } ${idx === tableHeaders.length - 1 ? 'border-r last:rounded-r-lg' : ''
                      } bg-[#F9F9F9] ${header.key === 'seller_name' || header.key === 'industry_pref' ? '' : 'whitespace-nowrap'} transition-colors ${header.sortable ? 'cursor-pointer hover:bg-[#d1d1d1]' : 'cursor-default'
                      }`}
                  >
                    <div className={`flex items-center gap-2 justify-center`}>
                      {header.label}
                      {header.sortable && sortConfig?.key === header.key && <ArrowIcon />}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBuyerData.map((buyer: any, index) => {
                const hqData = safeJsonParse<any[]>(buyer.hq, []);
                const countryId = Array.isArray(hqData) && hqData.length > 0 ? hqData[0].id : null;
                const countryData = getCountryById(countryId);

                return (
                  <TableRow key={index}>
                    <TableCell className="py-[10px] px-3 font-semibold text-[#30313D] text-sm border-t border-b border-l border-[#E4E4E4] bg-white rounded-l-lg whitespace-nowrap text-left">
                      {buyer.no}
                    </TableCell>

                    <TableCell className="text-center px-3 py-2 bg-white border-t border-b border-[#E4E4E4]">
                      {buyer.seller_name ?? t('common.na')}
                    </TableCell>

                    <TableCell className="text-center px-3 py-2 bg-white border-t border-b border-[#E4E4E4]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-3">
                          {countryData?.svg_icon_url ? (
                            <img
                              src={countryData?.svg_icon_url}
                              alt="flag"
                              className="w-[20px] h-[20px] rounded-full bg-gray-200 shrink-0"
                            />
                          ) : (
                            <span className="w-[20px] h-[20px] rounded-full bg-gray-200 text-gray-800 text-[8px] flex items-center justify-center shrink-0">
                              {t('common.na')}
                            </span>
                          )}
                          <span className="text-[#30313D] text-xs font-semibold leading-tight">
                            {countryData?.name ?? t('common.na')}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center px-3 py-2 bg-white border-t border-b border-[#E4E4E4]">
                      {buyer.industry_pref ?? t('common.na')}
                    </TableCell>

                    <TableCell className="text-center px-3 py-2 bg-white border-t border-b border-[#E4E4E4]">
                      <span className="whitespace-nowrap">{buyer.ebitda_pref ?? t('common.na')}</span>
                    </TableCell>

                    <TableCell className="text-center px-3 py-2 bg-white border-t border-b border-[#E4E4E4]">
                      <span className="whitespace-nowrap">{buyer.investment_range ?? t('common.na')}</span>
                    </TableCell>

                    <TableCell className="text-center px-3 py-2 text-[#064771] underline bg-white border-t border-b border-[#E4E4E4] whitespace-nowrap">
                      {buyer.dealroom ?? t('common.na')}
                    </TableCell>

                    <TableCell className="py-2 px-3 text-center border-t border-b border-r border-[#E4E4E4] bg-white rounded-r-lg whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          className="flex items-center justify-center w-[35px] h-[35px] bg-[#FFF7F7] border rounded-full p-1"
                          onClick={() => navigate(`/buyer-portal/view/${buyer.buyer_id}`)}
                        >
                          <svg
                            width="21"
                            height="16"
                            viewBox="0 0 21 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M19.7781 5.79048C18.5013 3.62804 15.5969 0 10.4995 0C5.40213 0 2.4978 3.62804 1.22098 5.79048C0.826265 6.45437 0.617188 7.21947 0.617188 8C0.617187 8.78053 0.826265 9.54564 1.22098 10.2095C2.4978 12.372 5.40213 16 10.4995 16C15.5969 16 18.5013 12.372 19.7781 10.2095C20.1728 9.54564 20.3819 8.78053 20.3819 8C20.3819 7.21947 20.1728 6.45437 19.7781 5.79048ZM18.3745 9.31322C17.278 11.1675 14.7959 14.2879 10.4995 14.2879C6.20313 14.2879 3.72111 11.1675 2.62458 9.31322C2.39007 8.91861 2.26586 8.46388 2.26586 8C2.26586 7.53612 2.39007 7.0814 2.62458 6.68678C3.72111 4.83253 6.20313 1.71215 10.4995 1.71215C14.7959 1.71215 17.278 4.82911 18.3745 6.68678C18.609 7.0814 18.7332 7.53612 18.7332 8C18.7332 8.46388 18.609 8.91861 18.3745 9.31322Z"
                              fill="#064771"
                            />
                            <path
                              d="M10.5009 3.76465C9.66326 3.76465 8.84441 4.01304 8.14792 4.47842C7.45143 4.9438 6.90858 5.60527 6.58802 6.37917C6.26746 7.15306 6.18359 8.00464 6.34701 8.82621C6.51043 9.64777 6.9138 10.4024 7.50612 10.9947C8.09843 11.5871 8.85309 11.9904 9.67466 12.1539C10.4962 12.3173 11.3478 12.2334 12.1217 11.9128C12.8956 11.5923 13.5571 11.0494 14.0224 10.3529C14.4878 9.65645 14.7362 8.8376 14.7362 7.99994C14.7349 6.87708 14.2882 5.8006 13.4942 5.00662C12.7003 4.21264 11.6238 3.76599 11.6238 3.76599C11.6238 3.76599 10.5009 3.76465 10.5009 3.76465ZM10.5009 10.5411C9.99832 10.5411 9.50701 10.3921 9.08912 10.1129C8.67122 9.83362 8.34552 9.43675 8.15318 8.97241C7.96084 8.50807 7.91052 7.99712 8.00857 7.50418C8.10662 7.01124 8.34865 6.55845 8.70404 6.20306C9.05943 5.84767 9.51222 5.60565 10.0052 5.50759C10.4981 5.40954 11.009 5.45987 11.4734 5.6522C11.9377 5.84454 12.3346 6.17025 12.6138 6.58814C12.8931 7.00603 13.0421 7.49734 13.0421 7.99994C13.0421 8.6739 12.7744 9.32026 12.2978 9.79682C11.8212 10.2734 11.1749 10.5411 10.5009 10.5411Z"
                              fill="#064771"
                            />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={() => { }}
      />
    </div>
  );
};

export default SharedBuyers;
