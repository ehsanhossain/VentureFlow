import React from 'react';
import Breadcrumb from '../../../assets/breadcrumb';
import { useNavigate } from 'react-router-dom';
import InvestorRegistration from './InvestorRegistration';

const AddBuyer: React.FC = () => {
  const navigate = useNavigate();

  const breadcrumbLinks = [
    { label: 'Home', url: '/', isCurrentPage: false },
    { label: 'Prospects', url: '/prospects?tab=investors', isCurrentPage: false },
    { label: 'Investor Management', url: '', isCurrentPage: true },
  ];

  return (
    <div className="flex flex-col w-full py-6 font-poppins">
      <div className="flex flex-col w-full pl-[45px] pt-[10px]">
        <h1 className="text-[#00081a] text-[1.75rem] font-medium mb-4">Investor Management</h1>

        <div className="flex items-center gap-2.5 mb-6">
          <button
            type="button"
            className="flex items-center gap-1 py-1 px-3 rounded bg-[#064771]"
            onClick={() => navigate('/prospects?tab=investors')}
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

      <div className="w-full bg-white px-8">
        <InvestorRegistration />
      </div>
    </div>
  );
};

export default AddBuyer;
