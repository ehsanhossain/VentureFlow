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
    label: "Prospects",
    path: "/prospects",
    subItems: [
      { label: "Seller Register", path: "/seller-portal/add", icon: SellerIcon },
      { label: "Buyer Register", path: "/buyer-portal/create", icon: BuyerIcon },
    ],
  },
  { icon: CatalystIcon, label: "Deal Pipeline", path: "/deal-pipeline" },
  { icon: EmployeeIcon, label: "Employee", path: "/employee", roles: ['System Admin'] },
  {
    icon: SettingsIcon,
    label: "Settings",
    path: "/settings",
    subItems: [
      { label: "General", path: "/settings/general", icon: SettingsIcon },
      { label: "Currency", path: "/settings/currency", icon: CurrencyIcon },
      { label: "Partner Management", path: "/settings/partners", icon: BuyerPartnerIcon },
      { label: "Pipeline Workflow", path: "/settings/pipeline", icon: CatalystIcon },
    ],
  },
];
