import React, { useState, useEffect } from "react";
import api from "../../config/api";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../Alert";
import { useTranslation } from "react-i18next";

const SellerPortal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [totalCounts, setTotalCounts] = useState<{ sellers: number } | null>(null);
  const [monthlyCounts, setMonthlyCounts] = useState<{ sellers: number } | null>(null);

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
          {/* SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="131"
            height="147"
            viewBox="0 0 131 147"
            fill="none"
          >
            <path
              d="M99.1158 37H120.493C121.786 37.0013 123.033 37.482 123.991 38.349C124.95 39.216 125.552 40.4076 125.681 41.6929L128.865 73.5H118.364L115.754 47.4286H99.1158V63.0714C99.1158 64.4543 98.5659 65.7806 97.5871 66.7585C96.6084 67.7364 95.2808 68.2857 93.8966 68.2857C92.5124 68.2857 91.1849 67.7364 90.2061 66.7585C89.2274 65.7806 88.6775 64.4543 88.6775 63.0714V47.4286H46.9244V63.0714C46.9244 64.4543 46.3745 65.7806 45.3957 66.7585C44.4169 67.7364 43.0894 68.2857 41.7052 68.2857C40.321 68.2857 38.9935 67.7364 38.0147 66.7585C37.0359 65.7806 36.4861 64.4543 36.4861 63.0714V47.4286H19.837L11.4864 130.857H67.8009V141.286H5.71399C4.98502 141.285 4.26429 141.132 3.59822 140.836C2.93216 140.54 2.33554 140.108 1.8468 139.567C1.35806 139.027 0.988036 138.39 0.760577 137.698C0.533118 137.007 0.453265 136.275 0.526162 135.55L9.92062 41.6929C10.0499 40.4076 10.6521 39.216 11.6106 38.349C12.569 37.482 13.8155 37.0013 15.1084 37H36.4861V33.3604C36.4861 15.2773 50.4316 0.5 67.8009 0.5C85.1702 0.5 99.1158 15.2773 99.1158 33.3604V37.0104V37ZM88.6775 37V33.3604C88.6775 20.9087 79.2622 10.9286 67.8009 10.9286C56.3397 10.9286 46.9244 20.9087 46.9244 33.3604V37.0104H88.6775V37ZM121.527 115.84L109.554 103.889V141.286C109.554 142.669 109.004 143.995 108.025 144.973C107.047 145.951 105.719 146.5 104.335 146.5C102.951 146.5 101.623 145.951 100.644 144.973C99.6657 143.995 99.1158 142.669 99.1158 141.286V103.889L87.1535 115.84C86.6721 116.338 86.0962 116.735 85.4594 117.009C84.8226 117.282 84.1378 117.426 83.4448 117.432C82.7518 117.438 82.0646 117.306 81.4231 117.044C80.7817 116.781 80.199 116.394 79.709 115.905C79.2189 115.415 78.8314 114.833 78.569 114.192C78.3065 113.551 78.1745 112.865 78.1805 112.172C78.1865 111.48 78.3305 110.796 78.604 110.16C78.8776 109.523 79.2752 108.948 79.7736 108.467L100.65 87.6099C101.629 86.6323 102.956 86.0832 104.34 86.0832C105.724 86.0832 107.051 86.6323 108.03 87.6099L128.907 108.467C129.405 108.948 129.803 109.523 130.076 110.16C130.35 110.796 130.494 111.48 130.5 112.172C130.506 112.865 130.374 113.551 130.111 114.192C129.849 114.833 129.461 115.415 128.971 115.905C128.481 116.394 127.899 116.781 127.257 117.044C126.616 117.306 125.928 117.438 125.236 117.432C124.543 117.426 123.858 117.282 123.221 117.009C122.584 116.735 122.008 116.338 121.527 115.84Z"
              fill="url(#paint0_linear_601_67744)"
              fillOpacity="0.15"
            />
            <defs>
              <linearGradient
                id="paint0_linear_601_67744"
                x1="34.2662"
                y1="0.499996"
                x2="150.902"
                y2="237.171"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#D3EAFA" />
                <stop offset="1" stopColor="#064771" />
              </linearGradient>
            </defs>
          </svg>

          <div className="w-6" />

          {/* Count info */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="text-[#30313d] text-center font-semibold text-2xl">
                {monthlyCounts?.sellers ?? "-"}
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
                {totalCounts?.sellers ?? "-"}
              </div>
              <div className="text-[#727272] text-center text-sm font-medium">
                {t('dashboard.totalRegistered', 'Total Registered')}
              </div>
            </div>
          </div>
        </div>

        {/* Portal header */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate("/prospects?tab=targets")}
        >
          <div className="text-[#064771] text-xl font-semibold underline">
            {t('dashboard.sellerPortal', 'Seller Portal')}
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

export default SellerPortal;
