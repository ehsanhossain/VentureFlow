import React, { useEffect, useState } from 'react';
import { Tabs } from '../../assets/tabs';
import api from '../../config/api';
import { showAlert } from '../../components/Alert';
import { useTranslation } from 'react-i18next';

// Import icons from seller portal
import CartIcon from '../seller-portal/index/svg/CartIcon';
import ClosedDealsIcon from '../seller-portal/index/svg/ClosedDealsIcon';
import DraftsIcon from '../seller-portal/index/svg/DraftsIcon';
import FromPartnersIcon from '../seller-portal/index/svg/FromPartnersIcon';
import InterestedIcon from '../seller-portal/index/svg/InterestedIcon';
import NotInterestedIcon from '../seller-portal/index/svg/NotInterestedIcon';

// Import existing components from seller and buyer portals
import AllSellers from '../seller-portal/index/AllSellers';
import AllSellersList from '../seller-portal/index/AllSellersList';
import AllBuyers from '../buyer-portal/AllBuyers';
import AllBuyersList from '../buyer-portal/AllBuyersList';

// Type for prospect type selection
type ProspectType = 'sellers' | 'buyers' | 'all';

interface ProspectCounts {
    total: number;
    interested: number;
    notInterested: number;
    closedDeals: number;
    drafts: number;
    fromPartners: number;
}

const ProspectsPortal: React.FC = () => {
    const { t } = useTranslation();
    // Clear stored IDs
    localStorage.removeItem('seller_id');
    localStorage.removeItem('buyer_id');

    // State for type selection
    const [prospectType, setProspectType] = useState<ProspectType>('all');
    const [activeTab, setActiveTab] = useState('all-prospects');
    const [activeButton, setActiveButton] = useState('button1');

    // Seller counts
    const [sellerCounts, setSellerCounts] = useState<ProspectCounts>({
        total: 0, interested: 0, notInterested: 0, closedDeals: 0, drafts: 0, fromPartners: 0
    });

    // Buyer counts
    const [buyerCounts, setBuyerCounts] = useState<ProspectCounts>({
        total: 0, interested: 0, notInterested: 0, closedDeals: 0, drafts: 0, fromPartners: 0
    });

    // Fetch seller data
    const fetchSellerCounts = async () => {
        try {
            const [all, interested, notInterested, closed, drafts, partners] = await Promise.all([
                api.get('/api/seller'),
                api.get('/api/seller/pinned'),
                api.get('/api/seller/unpinned'),
                api.get('/api/seller/closed'),
                api.get('/api/seller/drafts'),
                api.get('/api/seller/partnerships'),
            ]);

            setSellerCounts({
                total: all.data?.meta?.total ?? 0,
                interested: interested.data?.meta?.total ?? 0,
                notInterested: notInterested.data?.meta?.total ?? 0,
                closedDeals: closed.data?.meta?.total ?? 0,
                drafts: drafts.data?.meta?.total ?? 0,
                fromPartners: partners.data?.meta?.total ?? 0,
            });
        } catch {
            showAlert({ type: 'error', message: t('settings.partners.error.fetchSellerData') });
        }
    };

    // Fetch buyer data
    const fetchBuyerCounts = async () => {
        try {
            const [all, interested, notInterested, closed, drafts, partners] = await Promise.all([
                api.get('/api/buyer'),
                api.get('/api/buyer/pinned'),
                api.get('/api/buyer/unpinned'),
                api.get('/api/buyer/closed-deals'),
                api.get('/api/buyer/drafts'),
                api.get('/api/buyer/from-partners'),
            ]);

            setBuyerCounts({
                total: all.data?.meta?.total ?? 0,
                interested: interested.data?.meta?.total ?? 0,
                notInterested: notInterested.data?.meta?.total ?? 0,
                closedDeals: closed.data?.meta?.total ?? 0,
                drafts: drafts.data?.meta?.total ?? 0,
                fromPartners: partners.data?.meta?.total ?? 0,
            });
        } catch {
            showAlert({ type: 'error', message: t('settings.partners.error.fetchBuyerData') });
        }
    };

    useEffect(() => {
        fetchSellerCounts();
        fetchBuyerCounts();
    }, []);

    // Calculate combined counts based on selected type
    const getCounts = () => {
        if (prospectType === 'sellers') return sellerCounts;
        if (prospectType === 'buyers') return buyerCounts;
        // Combined counts for 'all'
        return {
            total: sellerCounts.total + buyerCounts.total,
            interested: sellerCounts.interested + buyerCounts.interested,
            notInterested: sellerCounts.notInterested + buyerCounts.notInterested,
            closedDeals: sellerCounts.closedDeals + buyerCounts.closedDeals,
            drafts: sellerCounts.drafts + buyerCounts.drafts,
            fromPartners: sellerCounts.fromPartners + buyerCounts.fromPartners,
        };
    };

    const counts = getCounts();

    const tabsData = [
        {
            id: 'all-prospects',
            label: prospectType === 'sellers' ? t('prospects.allSellers') : prospectType === 'buyers' ? t('prospects.allBuyers') : t('prospects.allProspects'),
            count: counts.total,
            activeIcon: <CartIcon isActive={true} />,
            inactiveIcon: <CartIcon isActive={false} />,
        },
        {
            id: 'interested',
            label: t('prospects.interested'),
            count: counts.interested,
            activeIcon: <InterestedIcon isActive={true} />,
            inactiveIcon: <InterestedIcon isActive={false} />,
        },
        {
            id: 'not-interested',
            label: t('prospects.notInterested'),
            count: counts.notInterested,
            activeIcon: <NotInterestedIcon isActive={true} />,
            inactiveIcon: <NotInterestedIcon isActive={false} />,
        },
        {
            id: 'closed-deals',
            label: t('prospects.closedDeals'),
            count: counts.closedDeals,
            activeIcon: <ClosedDealsIcon isActive={true} />,
            inactiveIcon: <ClosedDealsIcon isActive={false} />,
        },
        {
            id: 'drafts',
            label: t('prospects.drafts'),
            count: counts.drafts,
            activeIcon: <DraftsIcon isActive={true} />,
            inactiveIcon: <DraftsIcon isActive={false} />,
        },
        {
            id: 'from-partners',
            label: t('prospects.fromPartners'),
            count: counts.fromPartners,
            activeIcon: <FromPartnersIcon isActive={true} />,
            inactiveIcon: <FromPartnersIcon isActive={false} />,
        },
    ];

    // Dummy handlers for child component props
    const handleClearFilters = () => {
        // Refresh counts when filters are cleared
        fetchSellerCounts();
        fetchBuyerCounts();
    };

    const handleApplyFilters = () => {
        // Could implement filter state tracking here if needed
    };

    // Render content based on type and tab
    const renderContent = () => {
        if (activeTab !== 'all-prospects') {
            const activeTabLabel = tabsData.find(tab => tab.id === activeTab)?.label || activeTab;
            return (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <p>{t('prospects.comingSoon', { tab: activeTabLabel })}</p>
                </div>
            );
        }

        const isCardView = activeButton === 'button1';

        if (prospectType === 'sellers') {
            return isCardView
                ? <AllSellers onClearFilters={handleClearFilters} />
                : <AllSellersList onClearFilters={handleClearFilters} />;
        }

        if (prospectType === 'buyers') {
            return isCardView
                ? <AllBuyers onApplyFilters={handleApplyFilters} onClearFilters={handleClearFilters} />
                : <AllBuyersList onClearFilters={handleClearFilters} />;
        }

        // Show both for 'all' type
        return (
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{t('prospects.sellers')}</span>
                        <span className="text-gray-400 text-sm">({sellerCounts.total} {t('prospects.total')})</span>
                    </h3>
                    {isCardView
                        ? <AllSellers onClearFilters={handleClearFilters} />
                        : <AllSellersList onClearFilters={handleClearFilters} />}
                </div>
                <hr className="border-gray-200" />
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{t('prospects.buyers')}</span>
                        <span className="text-gray-400 text-sm">({buyerCounts.total} {t('prospects.total')})</span>
                    </h3>
                    {isCardView
                        ? <AllBuyers onApplyFilters={handleApplyFilters} onClearFilters={handleClearFilters} />
                        : <AllBuyersList onClearFilters={handleClearFilters} />}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full min-h-screen font-poppins overflow-x-hidden">
            {/* Header Section */}
            <div className="flex flex-col w-full px-4 sm:px-6 lg:px-9 pt-6 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h1 className="text-2xl font-semibold text-[#1F2937]">
                        {t('prospects.title')}
                    </h1>

                    {/* Type Switcher */}
                    <div className="inline-flex rounded-lg bg-gray-100 p-1 flex-wrap sm:ml-4">
                        <button
                            onClick={() => setProspectType('all')}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${prospectType === 'all'
                                ? 'bg-white text-[#064771] shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {t('prospects.all')} ({sellerCounts.total + buyerCounts.total})
                        </button>
                        <button
                            onClick={() => setProspectType('sellers')}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${prospectType === 'sellers'
                                ? 'bg-white text-[#064771] shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {t('prospects.sellers')} ({sellerCounts.total})
                        </button>
                        <button
                            onClick={() => setProspectType('buyers')}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${prospectType === 'buyers'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {t('prospects.buyers')} ({buyerCounts.total})
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs and Content Section */}
            <div className="flex-1 bg-white w-full">
                <div className="flex flex-col w-full">
                    {/* Tabs Row with View Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 px-4 sm:px-6 lg:px-9">
                        <div className="overflow-x-auto">
                            <Tabs
                                tabs={tabsData}
                                activeTab={activeTab}
                                onTabChange={(tabId) => setActiveTab(tabId)}
                            />
                        </div>

                        {/* View Toggle */}
                        {activeTab === 'all-prospects' && (
                            <div className="flex items-center py-2 sm:py-0">
                                <button
                                    onClick={() => setActiveButton('button1')}
                                    className={`flex justify-center items-center w-9 h-9 rounded-l-md border ${activeButton === 'button1'
                                        ? 'bg-[#064771] border-[#064771]'
                                        : 'bg-white border-gray-300'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
                                        <rect x="2" y="2" width="7" height="7" rx="1" fill={activeButton === 'button1' ? 'white' : '#54575C'} />
                                        <rect x="11" y="2" width="7" height="7" rx="1" fill={activeButton === 'button1' ? 'white' : '#54575C'} />
                                        <rect x="2" y="11" width="7" height="7" rx="1" fill={activeButton === 'button1' ? 'white' : '#54575C'} />
                                        <rect x="11" y="11" width="7" height="7" rx="1" fill={activeButton === 'button1' ? 'white' : '#54575C'} />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setActiveButton('button2')}
                                    className={`flex justify-center items-center w-9 h-9 rounded-r-md border-t border-r border-b ${activeButton === 'button2'
                                        ? 'bg-[#064771] border-[#064771]'
                                        : 'bg-white border-gray-300'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 16" fill="none">
                                        <rect x="0" y="1" width="20" height="3" rx="1" fill={activeButton === 'button2' ? 'white' : '#54575C'} />
                                        <rect x="0" y="6" width="20" height="3" rx="1" fill={activeButton === 'button2' ? 'white' : '#54575C'} />
                                        <rect x="0" y="11" width="20" height="3" rx="1" fill={activeButton === 'button2' ? 'white' : '#54575C'} />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="w-full px-4 sm:px-6 lg:px-9 py-6">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProspectsPortal;

