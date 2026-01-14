import React, { useState, useEffect } from 'react';
import { Tabs } from '../../../assets/tabs';
import Breadcrumb from '../../../assets/breadcrumb';
import LetterIcon from '../../../assets/svg/LetterIcon';
import SharedSellersIcon from '../../../assets/svg/SharedSellersIcon';
import Attachment from '../../../assets/svg/Attachment';
import PartnerOverview from './PartnerOverview';
import SharedSellers from './SharedSellers';
import SharedBuyers from './SharedBuyers';
import Attachments from './Attachments';
import PartnerAccess from './PartnerAccess';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PartnerOverviewTab = () => <PartnerOverview />;
const SharedSellersTab = () => <SharedSellers />;
const SharedBuyersTab = () => <SharedBuyers />;
const AttachmentsTab = () => <Attachments />;
const PartnerAccessTab = () => <PartnerAccess />;

interface PartnerData {
  partner_overview?: {
    reg_name?: string;
  };
}

const TabContentMap: Record<string, React.FC> = {
  'partner-overview': PartnerOverviewTab,
  'shared-sellers': SharedSellersTab,
  'shared-buyers': SharedBuyersTab,
  'attachments': AttachmentsTab,
  'partner-access': PartnerAccessTab,
};

const PartnerPortalDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('partner-overview');

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const response = await api.get(`/api/partners/${id}`);
        const partnerData = response.data?.data || {};
        setPartner(partnerData);
      } catch {
        showAlert({ type: "error", message: t('settings.partners.fetchError') });
      }
    };

    if (id) {
      fetchPartner();
    }
  }, [id, t]);

  const breadcrumbLinks = [
    { label: t('common.home'), url: '/', isCurrentPage: false },
    { label: t('settings.title'), url: '/settings', isCurrentPage: false },
    { label: t('settings.partners.title'), url: '/settings/partners', isCurrentPage: false },
    {
      label: id ? partner?.partner_overview?.reg_name || t('common.details') : t('common.detailView'),
      url: '',
      isCurrentPage: true,
    },
  ];

  const tabsData = [
    {
      id: 'partner-overview',
      label: t('settings.partners.tabs.overview'),
      activeIcon: <LetterIcon isActive={true} />,
      inactiveIcon: <LetterIcon isActive={false} />,
    },
    {
      id: 'shared-sellers',
      label: t('settings.partners.tabs.sharedSellers'),
      activeIcon: <SharedSellersIcon isActive={true} />,
      inactiveIcon: <SharedSellersIcon isActive={false} />,
    },
    {
      id: 'shared-buyers',
      label: t('settings.partners.tabs.sharedBuyers'),
      activeIcon: <SharedSellersIcon isActive={true} />,
      inactiveIcon: <SharedSellersIcon isActive={false} />,
    },
    {
      id: 'attachments',
      label: t('settings.partners.tabs.attachments'),
      activeIcon: <Attachment isActive={true} />,
      inactiveIcon: <Attachment isActive={false} />,
    },
    {
      id: 'partner-access',
      label: t('settings.partners.tabs.access'),
      activeIcon: <Settings className="w-5 h-5 text-[#064771]" />,
      inactiveIcon: <Settings className="w-5 h-5 text-gray-500" />,
    },
  ];

  const ActiveComponent = TabContentMap[activeTab] || PartnerOverviewTab;

  return (
    <div className="flex flex-col w-full py-4 font-poppins">
      <div className="flex flex-col w-full px-[25px]">
        <h1 className="text-[#00081a] text-[1.75rem] font-medium mb-4">{t('settings.partners.detailsTitle')}</h1>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex items-center gap-1 py-1 px-3 rounded bg-[#064771]">
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
            <button
              onClick={() => navigate('/settings/partners')}
              className="bg-transparent border-none p-0 cursor-pointer"
            >
              <span className="text-white text-[.8125rem] font-semibold">{t('common.back')}</span>
            </button>
          </div>
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

export default PartnerPortalDetails;
