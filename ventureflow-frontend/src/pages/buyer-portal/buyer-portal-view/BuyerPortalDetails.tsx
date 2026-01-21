import React, { useEffect, useState } from 'react';
import { Tabs } from '../../../assets/tabs';
import Breadcrumb from '../../../assets/breadcrumb';
import LetterIcon from '../../../assets/svg/LetterIcon';
import FinancialBagIcon from '../../../assets/svg/FinancialBagIcon';
import PartnershipDetailsIcon from '../../../assets/svg/PartnershipDetails';

import TargetPreferenceIcon from '../../../assets/svg/TargetPreference';
import CompanyOverview from './CompanyOverview';
import FinancialDetails from './FinancialDetails';
import PartnershipDetails from './PartnershipDetails';
import TargetPreferences from './TargetPreferences';

import { useTabStore } from './store/tabStore';
import { useParams } from 'react-router-dom';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { useNavigate } from 'react-router-dom';
const CompanyOverviewTab = () => <CompanyOverview />;
const TargetPreferencesTab = () => <TargetPreferences />;
const FinancialDetailsTab = () => <FinancialDetails />;
const PartnershipDetailsTab = () => <PartnershipDetails />;


const tabsData = [
  {
    id: 'company-overview',
    label: 'Company Overview',
    activeIcon: <LetterIcon isActive={true} />,
    inactiveIcon: <LetterIcon isActive={false} />,
  },

  {
    id: 'target-preferences',
    label: 'Target Preferences',
    activeIcon: <TargetPreferenceIcon isActive={true} />,
    inactiveIcon: <TargetPreferenceIcon isActive={false} />,
  },

  {
    id: 'financial-details',
    label: 'Financial Preferences',
    activeIcon: <FinancialBagIcon isActive={true} />,
    inactiveIcon: <FinancialBagIcon isActive={false} />,
  },
  {
    id: 'partnership-details',
    label: 'Partnership Details',
    activeIcon: <PartnershipDetailsIcon isActive={true} />,
    inactiveIcon: <PartnershipDetailsIcon isActive={false} />,
  },
];

const TabContentMap: Record<string, React.FC> = {
  'company-overview': CompanyOverviewTab,
  'target-preferences': TargetPreferencesTab,
  'financial-details': FinancialDetailsTab,
  'partnership-details': PartnershipDetailsTab,

};

const BuyerPortalDetails: React.FC = () => {
  const { id } = useParams();
  const [buyer, setBuyer] = useState(null);

  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        const response = await api.get(`/api/buyer/${id}`);
        const buyerData = response.data?.data || {};

        setBuyer(buyerData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to fetch buyer" });
      }
    };

    if (id) {
      fetchBuyer();
    }
  }, [id]);

  const breadcrumbLinks = [
    { label: 'Home', url: '/', isCurrentPage: false },
    { label: 'Investor Portal', url: '/buyer-portal', isCurrentPage: false },
    {
      label: buyer?.company_overview?.reg_name || 'Investor Details',
      url: '',
      isCurrentPage: true,
    },
  ];

  const activeTab = useTabStore((state) => state.activeTab);
  const setActiveTab = useTabStore((state) => state.setActiveTab);

  useEffect(() => {
    if (!activeTab) {
      setActiveTab('company-overview');
    }
  }, [activeTab, setActiveTab]);

  const ActiveComponent = TabContentMap[activeTab] || CompanyOverviewTab;

  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full px-10 py-4 font-poppins">
      <div className="flex flex-col w-full">
        <h1 className="text-[#00081a] text-[1.75rem] font-medium mb-4">Investor Details</h1>

        <div className="flex items-center gap-2.5 mb-6">
          <button
            className="flex items-center gap-1 py-1 px-3 rounded bg-[#064771]"
            onClick={() => navigate('/buyer-portal')}
          >
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
            <span className="text-white text-[.8125rem] font-semibold">Back</span>
          </button>
          <Breadcrumb links={breadcrumbLinks} />
        </div>
      </div>

      <div className="w-full bg-white">
        <div className="relative">
          <div className="w-full h-0.5 absolute top-[39px] bg-gray-200" />
          <Tabs tabs={tabsData} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="mt-8 w-full">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default BuyerPortalDetails;
