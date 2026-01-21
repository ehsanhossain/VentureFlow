import React, { useEffect, useState } from 'react';
import { Tabs } from '../../../assets/tabs';
import Breadcrumb from '../../../assets/breadcrumb';
import CartIcon from './svg/CartIcon';
import ClosedDealsIcon from './svg/ClosedDealsIcon';
import DraftsIcon from './svg/DraftsIcon';
import FromPartnersIcon from './svg/FromPartnersIcon';
import InterestedIcon from './svg/InterestedIcon';
import NotInterestedIcon from './svg/NotInterestedIcon';
import AllSellers from './AllSellers';
import AllSellersList from './AllSellersList';
import Interested from './Interested';
import ClosedDeals from './ClosedDeals';
import NotInterested from './NotInterested';
import FromPartners from './FromPartners';
import Drafts from './Drafts';
import { useNavigate } from 'react-router-dom';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import ImportModal from '../../../components/ImportModal';

const AllSellersTab = () => (
  <div>
    <AllSellers />
  </div>
);
const AllSellersListTab = () => (
  <div>
    <AllSellersList />
  </div>
);

const InterestedTab = () => (
  <div>
    <Interested />
  </div>
);

const NotInterestedTab = () => (
  <div>
    <NotInterested />
  </div>
);

const FromPartnersTab = () => (
  <div>
    <FromPartners />
  </div>
);

const DraftsTab = () => (
  <div>
    <Drafts />
  </div>
);
const ClosedDealsTab = () => (
  <div>
    <ClosedDeals />
  </div>
);

interface ApiResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

const SellerPortal: React.FC = () => {
  const navigate = useNavigate();
  localStorage.removeItem('seller_id');

  const [sellers, setsellers] = useState([]);
  const [interested, setInterested] = useState([]);
  const [notInterested, setNotInterested] = useState([]);
  const [closedDeals, setClosedDeals] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [fromPartners, setFromPartners] = useState([]);

  const fetchsellers = async (page = 1, query = '') => {
    try {
      const response = await api.get('/api/seller', {
        params: { page, search: query },
      });
      setsellers(response.data);

      const interested = await api.get('/api/seller/pinned', {
        params: { page, search: query },
      });
      setInterested(interested.data?.meta?.total);

      const notInterested = await api.get('/api/seller/unpinned', {
        params: { page, search: query },
      });
      setNotInterested(notInterested.data?.meta?.total);

      const closedDeals = await api.get('/api/seller/closed', {
        params: { page, search: query },
      });
      setClosedDeals(closedDeals.data?.meta?.total);

      const drafts = await api.get('/api/seller/drafts', {
        params: { page, search: query },
      });
      setDrafts(drafts.data?.meta?.total);

      const fromPartners = await api.get('/api/seller/partnerships', {
        params: { page, search: query },
      });
      setFromPartners(fromPartners.data?.meta?.total);
    } catch {
      showAlert({ type: 'error', message: 'Failed to fetch sellers' });
    }
  };

  useEffect(() => {
    fetchsellers();
  }, []);

  const tabsData = [
    {
      id: 'all-sellers',
      label: 'All Targets',
      count: sellers.meta?.total ?? 0,
      activeIcon: <CartIcon isActive={true} />,
      inactiveIcon: <CartIcon isActive={false} />,
    },
    {
      id: 'interested',
      label: 'Interested',
      count: interested ?? 0,
      activeIcon: <InterestedIcon isActive={true} />,
      inactiveIcon: <InterestedIcon isActive={false} />,
    },
    {
      id: 'not-interested',
      label: 'Not Interested',
      count: notInterested ?? 0,
      activeIcon: <NotInterestedIcon isActive={true} />,
      inactiveIcon: <NotInterestedIcon isActive={false} />,
    },
    {
      id: 'closed-deals',
      label: 'Closed Deals',
      count: closedDeals ?? 0,
      activeIcon: <ClosedDealsIcon isActive={true} />,
      inactiveIcon: <ClosedDealsIcon isActive={false} />,
    },
    {
      id: 'drafts',
      label: 'Drafts',
      count: drafts ?? 0,
      activeIcon: <DraftsIcon isActive={true} />,
      inactiveIcon: <DraftsIcon isActive={false} />,
    },
    {
      id: 'from-partners',
      label: 'From Partners',
      count: fromPartners ?? 0,
      activeIcon: <FromPartnersIcon isActive={true} />,
      inactiveIcon: <FromPartnersIcon isActive={false} />,
    },
  ];

  const breadcrumbLinks = [
    { label: 'Home', url: '/', isCurrentPage: false },
    { label: 'Target Portal', url: '/seller-portal', isCurrentPage: true },
  ];

  const [activeTab, setActiveTab] = useState('all-sellers');
  const [activeButton, setActiveButton] = useState('button1');

  const TabContentMap: Record<string, React.FC | (() => JSX.Element)> = {
    'all-sellers': () => (activeButton === 'button1' ? <AllSellersTab /> : <AllSellersListTab />),
    interested: InterestedTab,
    'not-interested': NotInterestedTab,
    'closed-deals': ClosedDealsTab,
    drafts: DraftsTab,
    'from-partners': FromPartnersTab,
  };

  const ActiveComponent = TabContentMap[activeTab];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleActualImport = async (file: File | null): Promise<void> => {
    if (!file) {
      showAlert({ type: 'error', message: 'No file selected for import' });
      throw new Error('No file selected.');
    }


    const formData = new FormData();
    formData.append('excel_file', file);

    try {
      const response = await api.post<ApiResponse>('/api/import/buyers-company-overview', formData);

      alert(response.data.message || 'Import successful!');
      closeModal();
    } catch (error: unknown) {
      showAlert({ type: 'error', message: 'API request error during import' });
      let errorMessage = 'An unexpected error occurred during import.';

      // Type guard for AxiosError-like structure
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as Record<string, unknown>).response === 'object' &&
        (error as Record<string, unknown>).response !== null &&
        'data' in ((error as Record<string, unknown>).response as Record<string, unknown>)
      ) {
        const responseData = ((error as Record<string, unknown>).response as Record<string, unknown>).data;
        showAlert({ type: 'error', message: 'Import failed with server response' });

        // Further type guard for responseData
        if (
          typeof responseData === 'object' &&
          responseData !== null &&
          'errors' in responseData &&
          typeof (responseData as ApiResponse).errors === 'object'
        ) {
          const messages = Object.values((responseData as ApiResponse).errors!).flat();
          errorMessage = messages.join(' ');
        } else if (
          typeof responseData === 'object' &&
          responseData !== null &&
          'message' in responseData &&
          typeof (responseData as ApiResponse).message === 'string'
        ) {
          errorMessage = (responseData as ApiResponse).message!;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Error).message === 'string'
      ) {
        errorMessage = (error as Error).message;
      }

      alert(`Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  };

  const handleImportNotification = (_data?: Record<string, unknown>) => {

  };

  return (
    <div className="flex items-center gap-[13px] w-auto font-poppins">
      <div className="flex flex-col flex-shrink-0  items-start gap-0  flex-wrap  w-full">
        <div className="flex items-center self-stretch text-[#00081a] text-right font-poppins text-[1.75rem] font-medium leading-[normal] ml-9 mt-7">
          Target Portal
        </div>
        <div className="flex items-center self-stretch ml-9 w-auto pt-4">
          <div className="flex items-center gap-2.5 w-auto ">
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
                <span className="text-white text-[.8125rem] font-semibold">Back</span>
              </div>
            </button>
            <div className="flex items-start">
              <Breadcrumb links={breadcrumbLinks} />
            </div>

            <div className="absolute right-0 pr-10 flex justify-between ">
              <div className="flex justify-start items-center flex-row gap-4">
                <div className="flex justify-start items-end flex-row gap-[10.06532096862793px] h-[34px]">
                  <button onClick={() => navigate('/seller-portal/add')}>
                    <div className="flex items-center justify-center h-[34px] gap-1 py-1 px-2 bg-[#064771] rounded-full">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.0609 0.802734C8.24177 0.802734 6.46351 1.34216 4.95097 2.35281C3.43844 3.36346 2.25956 4.79993 1.56341 6.48057C0.867266 8.16121 0.685123 10.0105 1.04001 11.7947C1.39491 13.5789 2.27089 15.2177 3.5572 16.504C4.84351 17.7903 6.48237 18.6663 8.26653 19.0212C10.0507 19.3761 11.9 19.194 13.5807 18.4978C15.2613 17.8017 16.6978 16.6228 17.7084 15.1103C18.7191 13.5977 19.2585 11.8195 19.2585 10.0003C19.2559 7.56179 18.286 5.22388 16.5617 3.49956C14.8373 1.77525 12.4994 0.805372 10.0609 0.802734ZM10.0609 17.665C8.54496 17.665 7.06307 17.2155 5.80263 16.3733C4.54218 15.5311 3.55978 14.334 2.97966 12.9335C2.39954 11.5329 2.24775 9.99184 2.54349 8.50504C2.83924 7.01824 3.56923 5.65252 4.64115 4.5806C5.71307 3.50867 7.07879 2.77869 8.56559 2.48294C10.0524 2.1872 11.5935 2.33899 12.994 2.91911C14.3946 3.49923 15.5916 4.48163 16.4338 5.74208C17.276 7.00252 17.7256 8.48441 17.7256 10.0003C17.7233 12.0324 16.9151 13.9807 15.4782 15.4176C14.0412 16.8545 12.093 17.6628 10.0609 17.665ZM13.8932 10.0003C13.8932 10.2036 13.8125 10.3986 13.6687 10.5423C13.525 10.6861 13.33 10.7668 13.1268 10.7668H10.8274V13.0662C10.8274 13.2695 10.7466 13.4644 10.6029 13.6082C10.4591 13.7519 10.2642 13.8327 10.0609 13.8327C9.85761 13.8327 9.66265 13.7519 9.51892 13.6082C9.37517 13.4644 9.29442 13.2695 9.29442 13.0662V10.7668H6.99502C6.79174 10.7668 6.59679 10.6861 6.45305 10.5423C6.30931 10.3986 6.22855 10.2036 6.22855 10.0003C6.22855 9.79706 6.30931 9.60211 6.45305 9.45836C6.59679 9.31462 6.79174 9.23387 6.99502 9.23387H9.29442V6.93447C9.29442 6.73119 9.37517 6.53624 9.51892 6.3925C9.66265 6.24876 9.85761 6.168 10.0609 6.168C10.2642 6.168 10.4591 6.24876 10.6029 6.3925C10.7466 6.53624 10.8274 6.73119 10.8274 6.93447V9.23387H13.1268C13.33 9.23387 13.525 9.31462 13.6687 9.45836C13.8125 9.60211 13.8932 9.79706 13.8932 10.0003Z"
                          fill="white"
                        />
                      </svg>
                      <span className="text-white font-poppins text-sm leading-5">
                        Create a Target
                      </span>
                    </div>
                  </button>
                </div>
                <button onClick={openModal}>
                  <div className="flex items-end h-[34px] gap-2.5">
                    <div className="flex items-center gap-1 py-1.5 px-3 h-[34px] bg-[#F1FBFF] border border-[#064771] rounded-full cursor-pointer hover:bg-blue-100 transition-colors">
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 19 19"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.07031 5.25391C2.07031 4.20381 2.07031 3.67876 2.27467 3.27767C2.45444 2.92487 2.74128 2.63803 3.09408 2.45827C3.49516 2.25391 4.02021 2.25391 5.07031 2.25391C6.12041 2.25391 6.64546 2.25391 7.04655 2.45827C7.39935 2.63803 7.68618 2.92487 7.86595 3.27767C8.07031 3.67876 8.07031 4.20381 8.07031 5.25391V14.2539C8.07031 15.304 8.07031 15.8291 7.86595 16.2302C7.68618 16.583 7.39935 16.8698 7.04655 17.0495C6.64546 17.2539 6.12041 17.2539 5.07031 17.2539C4.02021 17.2539 3.49516 17.2539 3.09408 17.0495C2.74128 16.8698 2.45444 16.583 2.27467 16.2302C2.07031 15.8291 2.07031 15.304 2.07031 14.2539V5.25391Z"
                          stroke="#064771"
                          strokeWidth="1.3125"
                        />
                        <path
                          d="M5.82031 15.0039H4.32031"
                          stroke="#064771"
                          strokeWidth="1.3125"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.5556 4.45111L8.94901 6.05768C8.51544 6.49123 8.29869 6.708 8.18446 6.98366C8.07031 7.25932 8.07031 7.56588 8.07031 8.179V15.4217L14.7982 8.69379C15.5408 7.95122 15.912 7.57996 16.0511 7.15184C16.1735 6.77526 16.1735 6.36961 16.0511 5.99303C15.912 5.56491 15.5408 5.19364 14.7982 4.45111C14.0557 3.70858 13.6844 3.33732 13.2563 3.19822C12.8797 3.07585 12.4741 3.07585 12.0974 3.19822C11.6693 3.33732 11.2981 3.70858 10.5556 4.45111Z"
                          stroke="#064771"
                          strokeWidth="1.3125"
                        />
                        <path
                          d="M5.07031 17.2539H14.0703C15.1204 17.2539 15.6455 17.2539 16.0466 17.0495C16.3994 16.8698 16.6862 16.583 16.8659 16.2302C17.0703 15.8291 17.0703 15.304 17.0703 14.2539C17.0703 13.2038 17.0703 12.6788 16.8659 12.2777C16.6862 11.9249 16.3994 11.6381 16.0466 11.4583C15.6455 11.2539 15.1204 11.2539 14.0703 11.2539H12.1953"
                          stroke="#064771"
                          strokeWidth="1.3125"
                        />
                      </svg>
                      <span className="text-[#064771] font-poppins text-sm leading-5">
                        Batch Register
                      </span>
                    </div>
                  </div>
                </button>

                <ImportModal
                  isOpen={isModalOpen}
                  onClose={closeModal}
                  onImport={handleImportNotification}
                  handleImportClick={handleActualImport}
                />

                <div className="flex items-end gap-[13px]">
                  <div className="flex items-end h-[34px] gap-[10px]">
                    <button className="flex items-center gap-1 py-[5px] px-2 bg-[#F1FBFF] border border-[#0C5577] rounded-full h-[34px] cursor-pointer hover:bg-blue-100 transition-colors">
                      <svg
                        width="21"
                        height="22"
                        viewBox="0 0 21 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.7378 15.7037C18.47 12.9714 18.47 8.53642 15.7378 5.80416C13.0055 3.0719 8.57052 3.0719 5.83826 5.80416C3.106 8.53642 3.106 12.9714 5.83826 15.7037"
                          stroke="#0C5577"
                          strokeWidth="1.4"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10.7889 11.743L10.7889 19.8606"
                          stroke="#0C5577"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8.39823 18.2617L10.789 20.6524L13.1797 18.2617"
                          stroke="#0C5577"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-[#0C5577] font-poppins text-sm leading-5">
                        Export
                      </span>
                    </button>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>

        <div className="bg-white flex flex-row justify-center w-full mt-[45px]">
          <div className="bg-white w-full min-h-screen">
            <div className="flex flex-col w-full items-start relative">
              <div className="w-full h-0.5 absolute top-[39px] bg-gray-200" />

              <Tabs
                tabs={tabsData}
                activeTab={activeTab}
                onTabChange={(tabId) => {
                  setActiveTab(tabId);
                }}
              />

              {activeTab === 'all-sellers' && (
                <div className="absolute right-0 mr-9 -mt-5 pr-5">
                  <div className="flex justify-start items-center flex-row">
                    <button
                      onClick={() => setActiveButton('button1')}
                      className={`flex justify-center items-center gap-2 py-2 px-3 rounded-tl rounded-bl w-10 h-10 ${activeButton === 'button1'
                        ? 'bg-[#064771]'
                        : 'bg-white border-solid border-[#E5E7EB] border rounded-tr'
                        }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M10.8353 20L16.252 20C18.3195 20 20.002 18.1645 20.002 15.9091L20.002 12.7273C20.002 11.7245 19.2545 10.9091 18.3353 10.9091L10.8353 10.9091C9.91612 10.9091 9.16862 11.7245 9.16862 12.7273L9.16862 18.1818C9.16862 19.1845 9.91612 20 10.8353 20ZM18.3353 12.7273L18.3353 15.9091C18.3353 17.1627 17.4003 18.1818 16.252 18.1818L10.8353 18.1818L10.8353 12.7273L18.3353 12.7273ZM3.75196 18.1818L5.83529 18.1818C6.75445 18.1818 7.50195 17.3664 7.50195 16.3636L7.50196 4.54545C7.50196 3.54273 6.75446 2.72727 5.83529 2.72727L3.75196 2.72727C1.68446 2.72727 0.00195617 4.56273 0.00195601 6.81818L0.00195547 14.0909C0.0019553 16.3464 1.68445 18.1818 3.75196 18.1818ZM1.66862 6.81818C1.66862 5.56454 2.60362 4.54545 3.75196 4.54545L5.83529 4.54545L5.83529 16.3636L3.75196 16.3636C2.60362 16.3636 1.66862 15.3445 1.66862 14.0909L1.66862 6.81818ZM10.8353 9.09091L16.6686 9.09091C17.5878 9.09091 18.3353 8.27546 18.3353 7.27273L18.3353 4.09091C18.3353 1.83545 16.6528 1.56508e-06 14.5853 1.35379e-06L10.8353 9.70557e-07C9.91612 8.76622e-07 9.16862 0.815455 9.16862 1.81818L9.16862 7.27273C9.16862 8.27545 9.91612 9.09091 10.8353 9.09091ZM10.8353 1.81818L14.5853 1.81818C15.7336 1.81818 16.6686 2.83727 16.6686 4.09091L16.6686 7.27273L10.8353 7.27273L10.8353 1.81818Z"
                          fill={activeButton === 'button1' ? 'white' : '#54575C'}
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() => setActiveButton('button2')}
                      className={`flex justify-center items-center gap-2 py-2 px-3 border-solid border-[#E5E7EB] border rounded-tr rounded-br w-10 h-10 ${activeButton === 'button2' ? 'bg-[#064771]' : 'bg-white'
                        }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="16"
                        viewBox="0 0 20 16"
                        fill="none"
                      >
                        <path
                          d="M13.3358 12.3628L1.25152 12.3628C0.919977 12.3628 0.60201 12.494 0.367571 12.7276C0.133131 12.9611 0.0014237 13.2779 0.00142373 13.6083C0.00142376 13.9386 0.133131 14.2554 0.367571 14.4889C0.60201 14.7225 0.919977 14.8537 1.25152 14.8537L13.3358 14.8537C13.6674 14.8537 13.9854 14.7225 14.2198 14.4889C14.4542 14.2554 14.5859 13.9386 14.5859 13.6083C14.5859 13.2779 14.4542 12.9611 14.2198 12.7276C13.9854 12.494 13.6674 12.3628 13.3358 12.3628Z"
                          fill={activeButton === 'button2' ? 'white' : '#54575C'}
                        />
                        <path
                          d="M1.25152 9.03322L13.3358 9.03322C13.6674 9.03322 13.9854 8.902 14.2198 8.66842C14.4542 8.43485 14.5859 8.11805 14.5859 7.78773C14.5859 7.45741 14.4542 7.14061 14.2198 6.90704C13.9854 6.67346 13.6674 6.54224 13.3358 6.54224L1.25152 6.54224C0.919977 6.54224 0.60201 6.67346 0.367571 6.90704C0.133131 7.14061 0.0014237 7.45741 0.00142373 7.78773C0.00142376 8.11806 0.133131 8.43485 0.367571 8.66842C0.60201 8.902 0.919977 9.03322 1.25152 9.03322Z"
                          fill={activeButton === 'button2' ? 'white' : '#54575C'}
                        />
                        <path
                          d="M1.25153 3.2277L13.3358 3.2277C13.6674 3.2277 13.9854 3.09648 14.2198 2.8629C14.4542 2.62933 14.5859 2.31253 14.5859 1.98221C14.5859 1.65189 14.4542 1.33509 14.2198 1.10152C13.9854 0.867944 13.6674 0.736723 13.3358 0.736723L1.25153 0.736724C0.919978 0.736724 0.602011 0.867945 0.367572 1.10152C0.133132 1.33509 0.0014237 1.65189 0.00142373 1.98221C0.00142376 2.31254 0.133132 2.62933 0.367572 2.8629C0.602011 3.09648 0.919978 3.2277 1.25153 3.2277Z"
                          fill={activeButton === 'button2' ? 'white' : '#54575C'}
                        />
                        <path
                          d="M17.9185 11.5272C16.7678 11.5272 15.8349 12.4566 15.8349 13.603C15.8349 14.7494 16.7678 15.6788 17.9185 15.6788C19.0691 15.6788 20.002 14.7494 20.002 13.603C20.002 12.4566 19.0691 11.5272 17.9185 11.5272Z"
                          fill={activeButton === 'button2' ? 'white' : '#54575C'}
                        />
                        <path
                          d="M17.9185 6.1267C16.7678 6.1267 15.8349 7.05608 15.8349 8.20252C15.8349 9.34896 16.7678 10.2783 17.9185 10.2783C19.0691 10.2783 20.002 9.34896 20.002 8.20252C20.002 7.05608 19.0691 6.1267 17.9185 6.1267Z"
                          fill={activeButton === 'button2' ? 'white' : '#54575C'}
                        />
                        <path
                          d="M17.9185 0.321185C16.7678 0.321185 15.8349 1.25056 15.8349 2.397C15.8349 3.54344 16.7678 4.47281 17.9185 4.47281C19.0691 4.47281 20.002 3.54344 20.002 2.397C20.002 1.25056 19.0691 0.321185 17.9185 0.321185Z"
                          fill={activeButton === 'button2' ? 'white' : '#54575C'}
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-8 w-full">
                {ActiveComponent ? <ActiveComponent /> : <div>No content found.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPortal;
