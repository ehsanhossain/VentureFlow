import React, { useState, useEffect } from "react";
import api from "../../config/api";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../Alert";
import { useTranslation } from "react-i18next";

const BuyerPortal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [totalCounts, setTotalCounts] = useState<{ buyers: number } | null>(null);
  const [monthlyCounts, setMonthlyCounts] = useState<{ buyers: number } | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await api.get("/api/dashboard/counts");
        const res = response.data;
        setTotalCounts(res.total);
        setMonthlyCounts(res.current_month);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        showAlert({ type: "error", message: "Failed to fetch seller/buyer data" });
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="flex justify-center items-center min-w-[799px] min-h-[223px] p-[13px] px-[16px] rounded-lg border border-[#a1bed1] bg-[#fafdff] font-poppins">
      <div className="flex flex-col md:flex-row justify-between items-center w-full gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* SVG Graphic */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="145"
            height="145"
            viewBox="0 0 145 145"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.05099 0.439453C3.43301 0.439453 0.5 3.37246 0.5 6.99044C0.5 10.6084 3.43301 13.5414 7.05099 13.5414H15.0381L38.3873 106.938C31.5043 109.996 26.704 116.891 26.704 124.908C26.704 135.763 35.5029 144.561 46.3569 144.561C57.2109 144.561 66.0099 135.763 66.0099 124.908C66.0099 122.611 65.6155 120.406 64.8916 118.357H93.3321C92.6082 120.406 92.2138 122.611 92.2138 124.908C92.2138 135.763 101.012 144.561 111.867 144.561C122.721 144.561 131.52 135.763 131.52 124.908C131.52 114.054 122.721 105.255 111.867 105.255H51.4718L48.1963 92.1533H111.867C125.389 92.1533 133.498 83.6102 137.997 74.1767C142.394 64.9582 143.924 53.9409 144.458 45.9274C145.201 34.7676 135.976 26.6434 125.762 26.6434H31.8188L27.7489 10.3637C26.2907 4.53114 21.0502 0.439453 15.0381 0.439453H7.05099ZM111.867 79.0513H44.9208L35.0943 39.7454H125.762C129.385 39.7454 131.561 42.41 131.385 45.0568C130.887 52.5342 129.493 61.572 126.172 68.5363C122.952 75.2852 118.549 79.0513 111.867 79.0513ZM111.867 131.419C108.271 131.419 105.356 128.504 105.356 124.908C105.356 121.312 108.271 118.398 111.867 118.398C115.463 118.398 118.377 121.312 118.377 124.908C118.377 128.504 115.463 131.419 111.867 131.419ZM39.8464 124.908C39.8464 128.504 42.7612 131.419 46.3569 131.419C49.9526 131.419 52.8675 128.504 52.8675 124.908C52.8675 121.312 49.9526 118.398 46.3569 118.398C42.7612 118.398 39.8464 121.312 39.8464 124.908Z"
              fill="url(#paint0_linear_6_27222)"
              fillOpacity="0.15"
            />
            <defs>
              <linearGradient
                id="paint0_linear_6_27222"
                x1="37.9026"
                y1="0.43945"
                x2="144.807"
                y2="243.856"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#D3EAFA" />
                <stop offset="1" stopColor="#064771" />
              </linearGradient>
            </defs>
          </svg>
          <div className="w-6"></div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="text-[#30313d] text-center font-semibold text-2xl">
                {monthlyCounts?.buyers ?? "-"}
              </div>
              <div className="text-[#727272] text-center text-sm font-medium">
                {t('dashboard.registeredIn', {
                  month: new Date().toLocaleString(undefined, { month: "long" }),
                  year: new Date().getFullYear(),
                  defaultValue: `Registered in ${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()}`
                })}
              </div>
            </div>
            <div className="w-px h-16 bg-[#30313D] hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <div className="text-[#30313d] text-center font-semibold text-2xl">
                {totalCounts?.buyers ?? "-"}
              </div>
              <div className="text-[#727272] text-center text-sm font-medium">
                {t('dashboard.totalRegistered', 'Total Registered')}
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate("/buyer-portal")}
        >
          <div className="text-[#064771] text-xl font-semibold underline">
            {t('dashboard.buyerPortal', 'Buyer Portal')}
          </div>
          <svg
            width={25}
            height={25}
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.4991 16.853V2.73535M22.4991 2.73535H8.38143M22.4991 2.73535L2.73438 22.5001"
              stroke="#064771"
              strokeWidth="3.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default BuyerPortal;
