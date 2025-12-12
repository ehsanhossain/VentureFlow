import {
  DashboardIcon,
  SellerIcon,
  BuyerIcon,
  BuyerPartnerIcon,
  ProspectsIcon,
  CatalystIcon,
  EmployeeIcon,
  CurrencyIcon,
  SettingsIcon,
} from "../assets/icons";
import React from 'react';

export interface MenuItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  path?: string;
  subItems?: { label: string; path: string; icon?: React.ComponentType<React.SVGProps<SVGSVGElement>> }[];
  roles?: string[];
}

export const menuItems: MenuItem[] = [
  { icon: DashboardIcon, label: "Dashboard", path: "/" },
  {
    icon: ProspectsIcon,
    label: "Companies",
    path: "/prospects",
    subItems: [
      { label: "Seller Register", path: "/seller-portal/add", icon: SellerIcon },
      { label: "Buyer Register", path: "/buyer-portal/create", icon: BuyerIcon },
    ],
  },
  { icon: CatalystIcon, label: "Deal Pipeline", path: "/deal-pipeline" },
  { icon: BuyerPartnerIcon, label: "Partner", path: "/partner-portal" },
  { icon: EmployeeIcon, label: "Employee", path: "/employee", roles: ['System Admin'] },
  {
    icon: SettingsIcon,
    label: "Settings",
    path: "/settings",
    subItems: [
      { label: "Currency", path: "/settings/currency", icon: CurrencyIcon },
    ],
  },
];
