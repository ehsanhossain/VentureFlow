import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';

interface DealHighlight {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface FrontendProps {
  imageUrl: string;
  title: string;
  location: string;
  industry: string;
  sellerRank: string;
  businessFeatures: string[];
  dealHighlights: DealHighlight[];
  desiredInvestment: string;
  stake: string;
}

export const Frontend = ({
  imageUrl,
  title,
  location,
  industry,
  businessFeatures,
  dealHighlights,
  desiredInvestment,
  stake,
}: FrontendProps): JSX.Element => {
  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white flex flex-row justify-center w-full">
        <div className="flex w-[1315px] items-center gap-[66px] relative top-[43px] left-[29px]">
          <div
            className="relative w-[507px] h-[562px]"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
            }}
          >
            <div className="h-[562px] rounded-[15px] bg-gradient-to-b from-transparent to-black/70" />
          </div>

          <Card className="flex flex-col w-[709.29px] items-start gap-4 relative border-none shadow-none">
            <CardContent className="flex flex-col items-start gap-2 w-full p-0">
              <div className="flex flex-col items-center gap-[22px] w-full">
                <div className="flex flex-col items-start justify-center gap-[22px] w-full">
                  <div className="text-[28px] font-medium text-black">{title}</div>

                  <div className="flex justify-between w-full">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-[3px]">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.99935 18C12.916 15 15.8327 12.3137 15.8327 9C15.8327 5.68629 13.221 3 9.99935 3C6.77769 3 4.16602 5.68629 4.16602 9C4.16602 12.3137 7.08268 15 9.99935 18Z"
                            stroke="#1D7595"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        <span className="text-base font-medium text-[#757575] text-nowrap">
                          Interested Country:{' '}
                          <span className="text-base font-medium text-black">{location}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-[3px]">
                        <svg
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_180_33410)">
                            <path
                              d="M18.4563 4.34375C18.3612 4.28889 18.2535 4.26002 18.1438 4.26002C18.034 4.26002 17.9263 4.28889 17.8313 4.34375L12.5 6.9875V4.875C12.4997 4.76846 12.4721 4.66377 12.42 4.57087C12.3678 4.47798 12.2927 4.39996 12.2019 4.34423C12.1111 4.28849 12.0076 4.2569 11.9012 4.25244C11.7947 4.24798 11.6889 4.27081 11.5938 4.31875L6.25 6.9875V2.375C6.25 2.20924 6.18415 2.05027 6.06694 1.93306C5.94973 1.81585 5.79076 1.75 5.625 1.75H1.875C1.70924 1.75 1.55027 1.81585 1.43306 1.93306C1.31585 2.05027 1.25 2.20924 1.25 2.375V18H18.75V4.875C18.7502 4.76878 18.7234 4.66427 18.672 4.57132C18.6206 4.47836 18.5463 4.40004 18.4563 4.34375ZM13.75 16.75H11.25V12.375H13.75V16.75ZM17.5 16.75H15V11.75C15 11.5842 14.9342 11.4253 14.8169 11.3081C14.6997 11.1908 14.5408 11.125 14.375 11.125H10.625C10.4592 11.125 10.3003 11.1908 10.1831 11.3081C10.0658 11.4253 10 11.5842 10 11.75V16.75H2.5V3H5V9.0125L11.25 5.8875V9.0125L17.5 5.8875V16.75Z"
                              fill="#005E80"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_180_33410">
                              <rect
                                width="20"
                                height="20"
                                fill="white"
                                transform="translate(0 0.5)"
                              />
                            </clipPath>
                          </defs>
                        </svg>

                        <span className="text-base font-medium text-[#757575] text-nowrap">
                          {' '}
                          Target Industry:{''}
                          <span className="font-bold text-black">
                            {industry.length > 15 ? `${industry.slice(0, 15)}...` : industry}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-[5px]"></div>
                  </div>
                </div>

                <div className="w-full text-left text-base font-medium text-black leading-[26px]  min-h-[100px] p-2 [&>div>p]:m-0">
                  {businessFeatures.map((feature, index) => (
                    <React.Fragment key={index}>
                      <div dangerouslySetInnerHTML={{ __html: feature }} />
                      {index < businessFeatures.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <button className="flex justify-end w-full">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1d7595] underline">See in Details</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.2859 10.1422V1.33447V10.1422ZM14.2859 1.33447H5.47818H14.2859ZM14.2859 1.33447L1.95508 13.6653L14.2859 1.33447Z"
                      fill="#02293E"
                    />
                    <path
                      d="M14.2859 10.1422V1.33447M14.2859 1.33447H5.47818M14.2859 1.33447L1.95508 13.6653"
                      stroke="#3B728F"
                      strokeWidth="2.64232"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>

              <Separator className="w-[709px] border-t-2 border-dotted border-gray-500" />
            </CardContent>

            <div className="flex flex-col items-end w-full">
              <div className="w-full text-lg font-medium text-black">Deal Highlights</div>
            </div>

            <div className="flex justify-end w-full gap-[70px]">
              <div className="flex flex-col w-[457px] gap-2.5">
                {dealHighlights.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className="flex justify-between w-full">
                      <div className="flex items-center gap-3.5">
                        {item.icon}

                        <span className="text-base font-medium text-black">{item.label}</span>
                      </div>
                      <span className="text-base font-medium text-black">{item.value}</span>
                    </div>
                    {index < dealHighlights.length - 1 && (
                      <img
                        className="w-full h-px"
                        src="/vector-3852.svg"
                       
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="flex flex-col items-end gap-[8.44px]">
                  <div className="flex items-center gap-[7.51px] text-nowrap">
                    <span className="text-[15px] font-medium text-[#757575]">
                      Investment Range & Stake
                    </span>

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      viewBox="0 0 17 17"
                      fill="none"
                    >
                      <path
                        d="M8.46826 0.420898C6.92203 0.420898 5.41053 0.879408 4.12489 1.73845C2.83925 2.59749 1.83721 3.81847 1.24549 5.247C0.653778 6.67553 0.498958 8.24744 0.800612 9.76396C1.10227 11.2805 1.84685 12.6735 2.94019 13.7668C4.03354 14.8602 5.42655 15.6048 6.94307 15.9064C8.45959 16.2081 10.0315 16.0533 11.46 15.4615C12.8886 14.8698 14.1095 13.8678 14.9686 12.5821C15.8276 11.2965 16.2861 9.785 16.2861 8.23877C16.2839 6.16603 15.4595 4.17882 13.9939 2.71318C12.5282 1.24753 10.541 0.42314 8.46826 0.420898ZM8.46826 14.7537C7.17974 14.7537 5.92015 14.3716 4.84878 13.6557C3.77741 12.9398 2.94239 11.9223 2.44929 10.7319C1.95619 9.54147 1.82718 8.23154 2.07855 6.96777C2.32993 5.70401 2.95042 4.54317 3.86154 3.63204C4.77266 2.72092 5.93351 2.10044 7.19727 1.84906C8.46103 1.59768 9.77096 1.7267 10.9614 2.21979C12.1518 2.71289 13.1693 3.54792 13.8852 4.61929C14.6011 5.69066 14.9832 6.95024 14.9832 8.23877C14.9813 9.96604 14.2943 11.622 13.0729 12.8434C11.8515 14.0648 10.1955 14.7518 8.46826 14.7537Z"
                        fill="#1D7595"
                      />
                      <path
                        d="M8.46899 6.93652H7.8175C7.64472 6.93652 7.47901 7.00516 7.35683 7.12734C7.23465 7.24952 7.16602 7.41523 7.16602 7.58801C7.16602 7.7608 7.23465 7.92651 7.35683 8.04868C7.47901 8.17086 7.64472 8.2395 7.8175 8.2395H8.46899V12.1484C8.46899 12.3212 8.53763 12.4869 8.65981 12.6091C8.78199 12.7313 8.9477 12.7999 9.12048 12.7999C9.29327 12.7999 9.45898 12.7313 9.58115 12.6091C9.70333 12.4869 9.77197 12.3212 9.77197 12.1484V8.2395C9.77197 7.89393 9.63469 7.56251 9.39034 7.31816C9.14598 7.0738 8.81456 6.93652 8.46899 6.93652Z"
                        fill="#1D7595"
                      />
                      <path
                        d="M8.46747 5.63147C9.00718 5.63147 9.4447 5.19395 9.4447 4.65424C9.4447 4.11452 9.00718 3.677 8.46747 3.677C7.92776 3.677 7.49023 4.11452 7.49023 4.65424C7.49023 5.19395 7.92776 5.63147 8.46747 5.63147Z"
                        fill="#1D7595"
                      />
                    </svg>
                  </div>
                  <div className="text-[22.3px] text-[#1d7595] text-right">
                    <span className="font-medium">{desiredInvestment}</span>
                    <span className="font-light"> for </span>
                    <span className="font-medium">{stake}</span>
                  </div>
                </div>

                <Button
                  className="w-[212.29px] h-11 gap-[10.37px] bg-[#c5e6f3] hover:bg-[#b0dbed] text-[#02293d] rounded-[4.32px]"
                  type="button"
                >
                  <span className="text-[19px] font-medium">Contact Buyer</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="15"
                    viewBox="0 0 16 15"
                    fill="none"
                  >
                    <path
                      d="M13.8814 10.0938V1.448V10.0938ZM13.8814 1.448H5.23565H13.8814ZM13.8814 1.448L1.77734 13.5521L13.8814 1.448Z"
                      fill="#02293E"
                    />
                    <path
                      d="M13.8814 10.0938V1.448M13.8814 1.448H5.23565M13.8814 1.448L1.77734 13.5521"
                      stroke="#02293E"
                      strokeWidth="2.59373"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
