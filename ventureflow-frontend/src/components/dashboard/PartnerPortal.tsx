import React, { useState, useEffect } from "react";
import api from "../../config/api";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../Alert";
import { useTranslation } from "react-i18next";

const PartnerPortal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [totalPartners, setTotalPartners] = useState<number | null>(null);
  const [monthlyPartners, setMonthlyPartners] = useState<number | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await api.get("/api/dashboard/counts");
        const res = response.data;
        setTotalPartners(res.total.partners);
        setMonthlyPartners(res.current_month.partners);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        showAlert({ type: "error", message: "Failed to fetch seller/buyer data" });
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="flex justify-center items-center min-w-[799px] min-h-[223px] p-[13px] px-[16px] rounded-lg border border-[#a1bed1] bg-[#fafdff] ">
      <div className="flex flex-col md:flex-row justify-between items-center w-full gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="164"
            height="139"
            viewBox="0 0 164 139"
            fill="none"
          >
            <path
              d="M144.918 67.4996L163.255 53.9206L147.404 0.5L65.8148 3.11489L57.9545 15.3209L30.0118 8.59994L0.5 69.5273L13.9429 81.0979L6.84523 92.0816C4.60353 95.551 3.84697 99.6854 4.71511 103.724C5.58293 107.762 7.9718 111.22 11.4408 113.462C13.9721 115.098 16.8582 115.943 19.8024 115.943C20.5774 115.943 21.3559 115.881 22.1334 115.763C23.1179 119.264 25.3272 122.435 28.6144 124.559C31.2026 126.232 34.108 127.03 36.982 127.03C37.7583 127.03 38.531 126.965 39.2955 126.85C40.3121 130.486 42.5888 133.589 45.7876 135.656C48.3761 137.329 51.2812 138.127 54.1552 138.127C59.2327 138.127 64.2127 135.634 67.1674 131.061L69.2762 127.797L81.6269 135.985L81.6784 136.019C84.2096 137.654 87.0957 138.5 90.0399 138.5C91.1302 138.5 92.2292 138.384 93.3204 138.149C97.3588 137.281 100.817 134.892 103.059 131.424C104.636 128.982 105.435 126.258 105.521 123.545C106.312 123.499 107.105 123.393 107.895 123.223C111.934 122.355 115.392 119.966 117.634 116.497C119.18 114.104 120.019 111.394 120.106 108.618C120.894 108.571 121.683 108.466 122.47 108.297C126.508 107.429 129.966 105.041 132.208 101.571C133.787 99.1275 134.586 96.4004 134.67 93.6844C139.43 93.4082 144.003 90.9478 146.782 86.6452C149.024 83.1759 149.78 79.0415 148.913 75.0032C148.295 72.1308 146.909 69.5521 144.918 67.4996ZM71.6479 13.4133L139.658 11.2339L151.121 49.8657L135.875 61.1546L77.5774 23.1964L61.0291 48.3126L61.0037 48.3517C59.5115 50.6595 56.4211 51.3235 54.1133 49.833C51.8054 48.3418 51.1411 45.2507 52.6367 42.9359L71.6479 13.4133ZM24.0188 103.179C22.5266 105.487 19.4356 106.151 17.1287 104.66C16.0107 103.938 15.2408 102.823 14.9611 101.522C14.6816 100.22 14.9251 98.8881 15.648 97.7701L26.1289 81.5496C27.0816 80.0756 28.6856 79.2723 30.3224 79.2723C31.2484 79.2723 32.1852 79.5298 33.0193 80.0686C34.1373 80.7911 34.9069 81.9053 35.1866 83.2067C35.4663 84.5081 35.2225 85.8407 34.5003 86.9587L24.0188 103.179ZM41.1923 114.276C39.7002 116.584 36.6094 117.247 34.3019 115.757C31.9941 114.266 31.3297 111.175 32.8212 108.867L43.3024 92.6462C44.2551 91.1722 45.8591 90.3689 47.4959 90.3689C48.4219 90.3689 49.3587 90.6264 50.1928 91.1655C52.5006 92.6567 53.165 95.7478 51.6738 98.0556L41.1923 114.276ZM68.8464 109.152L58.3652 125.373C56.8741 127.681 53.783 128.345 51.4755 126.854C50.3575 126.131 49.5876 125.017 49.3082 123.715C49.0284 122.414 49.2719 121.082 49.9945 119.963L60.4757 103.743C61.1982 102.625 62.3124 101.855 63.6138 101.576C63.9657 101.5 64.3195 101.463 64.6704 101.463C65.6193 101.463 66.5494 101.735 67.3651 102.262C69.6732 103.754 70.3376 106.844 68.8464 109.152ZM137.98 80.9564C137.257 82.0744 136.143 82.844 134.842 83.1238C133.54 83.4038 132.208 83.1597 131.09 82.4374L127.613 80.1907L127.613 80.1903L111.392 69.7092L105.704 78.5113L109.182 80.7587L121.925 88.9931C123.043 89.7157 123.813 90.8298 124.092 92.1312C124.372 93.4326 124.128 94.7652 123.406 95.8832C122.684 97.0012 121.569 97.7711 120.268 98.0508C118.966 98.3302 117.634 98.0867 116.516 97.3645L100.295 86.8833L94.6079 95.6855L107.351 103.919C109.659 105.41 110.323 108.501 108.832 110.809C108.109 111.927 106.995 112.697 105.694 112.977C104.392 113.256 103.06 113.013 101.942 112.291L88.0957 103.344L82.4082 112.146L92.7766 118.846C95.0844 120.338 95.7491 123.428 94.2576 125.736C93.535 126.854 92.4208 127.624 91.1194 127.904C89.8263 128.182 88.5026 127.942 87.3891 127.231L74.966 118.995L77.6498 114.841C82.2772 107.679 80.2158 98.0877 73.0542 93.4606C69.7645 91.335 65.9626 90.6245 62.3642 91.1674C61.3807 87.6634 59.1708 84.4894 55.8813 82.3637C52.5938 80.2396 48.7951 79.5285 45.1989 80.0695C44.182 76.4343 41.9057 73.333 38.7078 71.2668C32.7888 67.4414 25.2112 68.1909 20.1463 72.6095L13.4467 66.8431L35.7667 20.7637L51.9459 24.6549L43.8314 37.2554C39.204 44.4169 41.2654 54.008 48.427 58.6354C55.5812 63.2587 65.1609 61.2049 69.794 54.0605L80.5953 37.6667L136.501 74.0667C137.619 74.7892 138.389 75.9034 138.668 77.2048C138.946 78.5059 138.702 79.8381 137.98 80.9564Z"
              fill="url(#paint0_linear_6_27238)"
              fillOpacity="0.15"
            />
            <defs>
              <linearGradient
                id="paint0_linear_6_27238"
                x1="42.7741"
                y1="0.499997"
                x2="133.642"
                y2="244.724"
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
              <div className="text-gray-900 text-center font-semibold text-2xl">
                {monthlyPartners ?? "-"}
              </div>
              <div className="text-gray-500 text-center text-sm font-medium">
                {t('dashboard.registeredIn', {
                  month: new Date().toLocaleString(undefined, { month: "long" }),
                  year: new Date().getFullYear(),
                  defaultValue: `Registered in ${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()}`
                })}
              </div>
            </div>
            <div className="w-px h-16 bg-[#30313D] hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <div className="text-gray-900 text-center font-semibold text-2xl">
                {totalPartners ?? "-"}
              </div>
              <div className="text-gray-500 text-center text-sm font-medium">
                {t('dashboard.totalRegistered', 'Total Registered')}
              </div>
            </div>
          </div>
        </div>
        {/* Fixed onClick syntax */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate("/partner-portal")}
        >
          <div className="text-[#064771] text-xl font-semibold underline">
            {t('dashboard.partnerPortal', 'Partner Portal')}
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

export default PartnerPortal;
