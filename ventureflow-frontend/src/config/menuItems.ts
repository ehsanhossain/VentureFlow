import {
  DashboardIcon,
  BuyerPartnerIcon,
  ProspectsIcon,
  CatalystIcon,
  CurrencyIcon,
  SettingsIcon,
} from "../assets/icons";
import React from 'react';

export interface SubMenuItem {
  label: string;
  path: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: string[]; // If specified, only these roles can see this item
}

export interface MenuItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  path?: string;
  subItems?: SubMenuItem[];
  roles?: string[]; // If specified, only these roles can see this item
}

export const menuItems: MenuItem[] = [
  { icon: DashboardIcon, label: "Dashboard", path: "/" },
  {
    icon: ProspectsIcon,
    label: "Prospects",
    path: "/prospects",
  },
  { icon: CatalystIcon, label: "Deal Pipeline", path: "/deal-pipeline" },
  {
    icon: SettingsIcon,
    label: "Settings",
    path: "/settings",
    roles: ['System Admin', 'admin'], // Only admins can access settings
    subItems: [
      { label: "General", path: "/settings/general", icon: SettingsIcon },
      { label: "Staff Management", path: "/settings/staff", icon: BuyerPartnerIcon },
      { label: "Currency", path: "/settings/currency", icon: CurrencyIcon },
      { label: "Partner Management", path: "/settings/partners", icon: BuyerPartnerIcon },
      { label: "Pipeline Workflow", path: "/settings/pipeline", icon: CatalystIcon },
    ],
  },
];


