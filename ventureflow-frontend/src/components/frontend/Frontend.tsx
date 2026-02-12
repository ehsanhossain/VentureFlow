import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";

interface DealHighlight {
  icon: string;
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
  sellerRank,
  businessFeatures,
  dealHighlights,
  desiredInvestment,
  stake,
}: FrontendProps): JSX.Element => {
  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-[1440px] h-[1024px]">
        <div className="flex w-[1315px] items-center gap-[66px] relative top-[43px] left-[29px]">
          <div className="relative w-[507px] h-[562px]" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "cover" }}>
            <div className="h-[562px] rounded-[15px] bg-gradient-to-b from-transparent to-black/70" />
          </div>

          <Card className="flex flex-col w-[709.29px] items-start gap-4 relative border-none shadow-none">
            <CardContent className="flex flex-col items-start gap-2 w-full p-0">
              <div className="flex flex-col items-center gap-[22px] w-full">
                <div className="flex flex-col items-start justify-center gap-[22px] w-full">
                  <div className="text-[28px] font-medium text-black">
                    {title}
                  </div>

                  <div className="flex justify-between w-full">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-[3px]">
                        <img className="w-5 h-5" src="/location-pin-alt-svgrepo-com--1--1.svg" alt="Location" />
                        <span className="text-base font-medium text-black">{location}</span>
                      </div>

                      <div className="flex items-center gap-[3px]">
                        <img className="w-5 h-5" src="/industry-svgrepo-com-1.svg" alt="Industry" />
                        <span className="text-base font-medium text-gray-500">Industry: <span className="font-medium text-black">{industry}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-[5px]">
                      <img className="w-[17.25px] h-[18px]" src="/vector-2.svg" alt="Seller Rank" />
                      <span className="text-base text-black">
                        <span className="text-gray-600">Seller Rank</span> &quot;{sellerRank}&quot;
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-base font-medium text-black leading-[26px]">
                  {businessFeatures.map((feature, index) => (
                    <React.Fragment key={index}>
                      {feature}
                      {index < businessFeatures.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex justify-end w-full">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-[#1d7595] underline">See is Details</span>
                  <img className="w-[13.65px] h-[14.97px]" src="/vector-3.svg" alt="Details arrow" />
                </div>
              </div>

              <Separator className="w-[709px]" />
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
                        <img className="w-5 h-5" src={item.icon} alt={item.label} />
                        <span className="text-base font-medium text-black">{item.label}</span>
                      </div>
                      <span className="text-base font-medium text-black">{item.value}</span>
                    </div>
                    {index < dealHighlights.length - 1 && (
                      <img className="w-full h-px" src="/vector-3852.svg" alt="Divider" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="flex flex-col items-end gap-[8.44px]">
                  <div className="flex items-center gap-[7.51px]">
                    <span className="text-[15px] font-medium text-gray-500">Desired Investment & Stake</span>
                    <img className="w-[15.64px] h-[15.64px]" src="/group-22120.png" alt="Investment Info" />
                  </div>
                  <div className="text-[22.3px] text-[#1d7595] text-right">
                    <span className="font-medium">{desiredInvestment}</span>
                    <span className="font-normal"> for </span>
                    <span className="font-medium">{stake}</span>
                  </div>
                </div>

                <Button className="w-[182.29px] h-11 gap-[10.37px] bg-[#c5e6f3] hover:bg-[#b0dbed] text-[#02293d] rounded-[4.32px]">
                  <span className="text-[19px] font-medium">Contact Business</span>
                  <img className="w-[14.7px] h-[14.7px]" src="/vector.svg" alt="Arrow" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
