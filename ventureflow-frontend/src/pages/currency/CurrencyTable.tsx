import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Plus, Globe, User, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../../components/Alert';
import DataTable, { DataTableColumn } from "../../components/table/DataTable";
import DataTableSearch from "../../components/table/DataTableSearch";

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
  const navigate = useNavigate();

  const [currencyData, setCurrencyData] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'name',
    direction: 'asc'
  });
  const [countries, setCountries] = useState<{ id: number; name: string; svg_icon_url: string }[]>([]);

  useEffect(() => {
    fetchCountries();
    fetchCurrencyData();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await api.get('/api/countries');
      setCountries(res.data);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const fetchCurrencyData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/currencies');
      const currencyList = response.data.data;

      if (!Array.isArray(currencyList)) {
        throw new Error("Expected 'data' to be an array of currencies");
      }

      const transformedData: Currency[] = currencyList.map((item: ApiCurrency) => ({
        id: item.id,
        name: item.currency_name ?? '',
        code: item.currency_code ?? '',
        sign: item.currency_sign ?? '',
        country: item.origin_country ?? '',
        countryFlag: item.flag || '',
        dollarUnit: '1 USD',
        exchangeRate: item.exchange_rate ? parseFloat(item.exchange_rate).toFixed(4) : '0.0000',
        source: (item.source || '').toLowerCase(),
        lastUpdated: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '',
      }));

      setCurrencyData(transformedData);
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      showAlert({ type: "error", message: t('settings.currency.fetchError') });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRates = async () => {
    try {
      setRefreshing(true);
      const res = await api.post('/api/currencies/refresh');
      showAlert({ type: 'success', message: res.data.message || 'Exchange rates refreshed!' });
      await fetchCurrencyData(); // Reload table with fresh rates
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to refresh exchange rates';
      showAlert({ type: 'error', message: msg });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (ids: (string | number)[]) => {
    if (!window.confirm(t('settings.currency.confirmDelete'))) return;

    try {
      await api.delete('/api/currencies', { data: { ids } });
      showAlert({ type: "success", message: "Currency deleted successfully" });
      setSelectedIds(new Set());
      fetchCurrencyData();
    } catch (error) {
      showAlert({ type: "error", message: t('settings.currency.deleteError') });
    }
  };

  const filteredCurrency = useMemo(() => {
    let result = currencyData.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sign.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aVal: any = (a as any)[sortConfig.key] || '';
        let bVal: any = (b as any)[sortConfig.key] || '';

        if (sortConfig.key === 'exchangeRate') {
          aVal = parseFloat(aVal);
          bVal = parseFloat(bVal);
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (sortConfig.direction === 'asc') {
          return aVal.toString().localeCompare(bVal.toString());
        } else {
          return bVal.toString().localeCompare(aVal.toString());
        }
      });
    }

    return result;
  }, [currencyData, searchQuery, sortConfig]);

  const getCountryById = (id: number | string) => countries.find((c) => c.id === Number(id));

  const columns: DataTableColumn<Currency>[] = [
    {
      id: 'name',
      header: t('settings.currency.name'),
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100/50">
            <span className="text-[#064771] font-medium text-sm">{row.sign}</span>
          </div>
          <div className="overflow-hidden">
            <div className="font-medium text-gray-900 truncate">{row.name}</div>
            <div className="text-[10px] text-[#064771] font-mono tracking-wider uppercase bg-blue-50/50 px-1.5 rounded inline-block">
              {row.code}
            </div>
          </div>
        </div>
      ),
      width: 250,
      sortable: true,
      sticky: 'left'
    },
    {
      id: 'country',
      header: t('settings.currency.country'),
      accessor: (row) => {
        const country = getCountryById(row.country);
        return (
          <div className="flex items-center gap-2">
            {country?.svg_icon_url ? (
              <img src={country.svg_icon_url} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-100" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <Globe className="w-3 h-3 text-gray-400" />
              </div>
            )}
            <span className="text-sm text-gray-700">{country?.name || 'N/A'}</span>
          </div>
        );
      },
      width: 200,
      sortable: true
    },
    {
      id: 'exchangeRate',
      header: t('settings.currency.exchangeRate'),
      accessor: (row) => (
        <div className="flex flex-col items-start gap-1">
          <div className="text-sm font-medium text-[#064771] bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/30">
            1 USD = {row.exchangeRate} {row.sign}
          </div>
        </div>
      ),
      width: 220,
      sortable: true
    },
    {
      id: 'lastUpdated',
      header: t('settings.currency.lastUpdated'),
      accessor: (row) => (
        <div className="flex items-center gap-2 text-gray-500 whitespace-nowrap">
          {row.source === 'api' ? (
            <Globe className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <User className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-xs">{row.lastUpdated}</span>
        </div>
      ),
      width: 180,
      sortable: true
    }
  ];

  const actionsColumn = (row: Currency) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/settings/currency/edit/${row.id}`);
        }}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors"
        title={t('common.edit')}
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete([row.id]);
        }}
        className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
        title={t('common.delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#f9fafb] overflow-hidden ">
      <div className="px-8 py-6">
        {/* Header & Search */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 flex-1">
            <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">
              {t('settings.currency.management')}
            </h1>
            <DataTableSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search currencies..."
            />
          </div>

          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={() => handleDelete(Array.from(selectedIds))}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-[3px] text-sm font-medium transition-all"
              >
                Delete Selected ({selectedIds.size})
              </button>
            )}
            <button
              onClick={handleRefreshRates}
              className={`flex items-center gap-2 px-4 py-2 bg-white text-gray-600 hover:text-[#064771] border border-gray-200 rounded-[3px] text-sm font-medium transition-all hover:border-[#064771]/30 hover:bg-gray-50 shadow-sm active:scale-95 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={refreshing}
              title="Refresh exchange rates from API"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => navigate('/settings/currency/add')}
              className="flex items-center gap-2 bg-[#064771] hover:bg-[#053a5e] text-white px-5 py-2 rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {t('settings.currency.add')}
            </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 px-8 pb-8 overflow-hidden">
        <div className="h-full bg-white rounded-[3px] border border-gray-100 overflow-hidden">
          <DataTable
            data={filteredCurrency}
            columns={columns}
            isLoading={loading}
            emptyMessage={t('settings.currency.noCurrencies')}
            getRowId={(row) => row.id}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            sortConfig={sortConfig}
            onSortChange={(key, direction) => setSortConfig({ key, direction })}
            actionsColumn={actionsColumn}
            actionsColumnWidth={120}
          />
        </div>
      </div>
    </div>
  );
};

export default CurrencyTable;

