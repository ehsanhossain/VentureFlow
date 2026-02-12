import React from "react";

type DangerButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: "before" | "after";
};

const DangerButton: React.FC<DangerButtonProps> = ({
    children,
    onClick,
    className = "",
    icon,
    iconPosition = "before",
}) => {
    return (
        <button
            onClick={onClick}
            className={`inline-flex min-w-[100px] min-h-[35px] items-center justify-center gap-[5px] flex-shrink-0 border border-[#DF272A] text-[#DF272A] px-[8px] py-[5px] rounded-[49.82036209106445px] hover:bg-[#DF272A] hover:text-white transition ${className}`}
        >
            {icon && iconPosition === "before" && <span className="ml-[8px] py-[5px]">{icon}</span>}
            <span className="mr-[8px] py-[5px]">{children}</span>
            {icon && iconPosition === "after" && <span className="ml-[8px] py-[5px]">{icon}</span>}
        </button>
    );
};

export default DangerButton;
