/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from "react";

type SecondaryButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: "before" | "after";
};

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  onClick,
  className = "",
  icon,
  iconPosition = "before",
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex min-w-[100px] min-h-[35px] items-center justify-center gap-[5px] flex-shrink-0 bg-[#FFF6F7] text-gray-600 border border-[#54575C] px-[8px] py-[5px] rounded-[49.82036209106445px] hover:bg-opacity-90 transition ${className}`}
    >
      {icon && iconPosition === "before" && <span className="ml-[8px] py-[5px]">{icon}</span>}
      <span className="mr-[8px] py-[5px]">{children}</span>
      {icon && iconPosition === "after" && <span className="ml-[8px] py-[5px]">{icon}</span>}
    </button>
  );
};

export default SecondaryButton;
