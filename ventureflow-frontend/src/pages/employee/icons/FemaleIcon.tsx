/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from "react";

const FemaleIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 26,
  color = "black",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 26 26"
    fill="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.7382 17.4304C15.9939 18.1725 15.0448 18.6752 14.0127 18.8737C12.9727 19.075 11.8962 18.964 10.9192 18.5543C8.91766 17.7163 7.60814 15.766 7.58996 13.5962C7.57949 12.0011 8.29077 10.4869 9.52504 9.4765C10.7593 8.46611 12.3842 8.06792 13.9458 8.39322C14.9752 8.62672 15.9125 9.1593 16.64 9.924C17.6604 10.9029 18.2508 12.2464 18.2819 13.6601C18.2921 15.0727 17.7361 16.4306 16.7382 17.4304Z"
      stroke={color}
      strokeWidth="1.61316"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 19V22"
      stroke={color}
      strokeWidth="1.61316"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 22H15"
      stroke={color}
      strokeWidth="1.61316"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default FemaleIcon;
