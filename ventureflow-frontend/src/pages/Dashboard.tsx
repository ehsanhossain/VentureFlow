import TableHeader from '../components/dashboard/TableHeader';
import Rows from '../components/dashboard/TableRows';
import SellerPortal from '../components/dashboard/SellerPortal';
import BuyerPortal from '../components/dashboard/BuyerPortal';
import PartnerPortal from '../components/dashboard/PartnerPortal';
import api from '../config/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DashboardRow {
  id: number;
  type: number;
  label: string;
  image: string | undefined;
  status: string;
  statusColor: string;
  textColor: string;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<DashboardRow[]>([]);

  const columns = [
    { label: t('dashboard.projects', 'Projects'), width: 'w-[350px]', sortable: true },
    { label: t('dashboard.status', 'Status'), width: 'w-[100px]', sortable: true },
  ];

  useEffect(() => {
    const fetchSellerBuyer = async () => {
      try {
        const response = await api.get('/api/dashboard/data');
        const res = response.data;

        const formattedRows: DashboardRow[] = res.map((item: { id: number; type: string; reg_name: string; image: string | null; status: string }) => ({
          id: item.id,
          type: item.type === 'seller' ? 1 : 2,
          label: item.reg_name,
          image: item.image || undefined,
          status: item.status || 'Unknown',
          statusColor: getStatusColor(item.status),
          textColor: getTextColor(item.status),
        }));

        setRows(formattedRows);
      } catch {
        // Handle error silently
      }
    };

    fetchSellerBuyer();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-800';
      case 'Completed':
        return 'bg-green-600';
      case 'Failed':
        return 'bg-red-600';
      case 'Active':
        return 'bg-[#1A941F]';
      case 'Deal Closed':
        return 'bg-[#2196F3]';
      case 'Interested':
        return 'bg-[#FF9800]';
      case 'On Hold':
        return 'bg-[#FFC107]';
      case 'Not Interested':
        return 'bg-[#FF5722]';
      case 'Canceled':
        return 'bg-[#F44]';
      case 'In Active':
        return 'bg-[#6F6F6F]';
      case 'Drafts':
        return 'bg-[#795548]';
      default:
        return 'bg-gray-400';
    }
  };

  const getTextColor = (status: string) => {
    switch (status) {
      case 'In Progress':
      case 'Completed':
      case 'Failed':
        return 'text-white';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="ml-7 mt-7">
      <h1 className="text-[28px] font-medium mb-6 text-[#30313D] leading-[33.214px] font-poppins">
        {t('dashboard.title', 'Dashboard')}
      </h1>

      <div className="flex flex-col md:flex-row gap-6 overflow-x-hidden ">
        <div className="flex-1 min-w-[300px] max-w-full min-h-[400px] p-[12px_7px] md:w-[491px] md:h-[718px] bg-[#FBFBFB]">
          <p className="text-[22px] font-semibold mb-4 text-[#30313D] leading-[33.214px] font-poppins pb-[25px]">
            {t('dashboard.projectStatus', 'Project Status')}
          </p>

          <div className="overflow-y-auto max-h-[calc(718px-100px)] custom-scrollbar">
            <table className="w-full table-auto border-collapse overflow-y-auto custom-scrollbar">
              <thead>
                <tr className="text-left bg-[#F5F5F5]">
                  <TableHeader columns={columns} />
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.type}-${row.id}`}>
                    <td
                      className="border-b border-[#e0e0e0] pt-2 pb-2 w-full"
                      colSpan={columns.length}
                    >
                      <Rows
                        id={row.id}
                        type={row.type}
                        label={row.label}
                        status={row.status}
                        image={row.image}
                        statusColor={row.statusColor}
                        textColor={row.textColor}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full md:w-auto md:min-w-[300px] space-y-5 mr-5">
          <SellerPortal />
          <BuyerPortal />
          <PartnerPortal />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
