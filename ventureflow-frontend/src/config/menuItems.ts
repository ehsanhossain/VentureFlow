import {
  DashboardIcon,
  ProspectsIcon,
  CatalystIcon,
  CurrencyIcon,
  SettingsMainIcon,
  GeneralSettingsSubIcon,
  PartnerIconCustom,
  StaffAccountsIcon,
  MatchIcon,
} from "../assets/icons";
import React from 'react';

export interface SubMenuItem {
  label: string;
  path: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: string[]; // If specified, only these roles can see this item
  partnerVisible?: boolean; // If true, partners can see this
}

export interface MenuItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  path?: string;
  subItems?: SubMenuItem[];
  roles?: string[]; // If specified, only these roles can see this item
  partnerVisible?: boolean; // If true, partners can see this (note: some items are visible but have limited sub-items)
}

export const menuItems: MenuItem[] = [
  { icon: DashboardIcon, label: "Dashboard", path: "/" },
  {
    icon: ProspectsIcon,
    label: "Prospects",
    path: "/prospects",
  },
  { icon: MatchIcon, label: "MatchIQ", path: "/matchiq" },
  { icon: CatalystIcon, label: "Deal Pipeline", path: "/deal-pipeline" },
  {
    icon: SettingsMainIcon,
    label: "Settings",
    path: "/settings",
    // Settings is now visible to all, but has different sub-items based on role
    subItems: [
      { label: "General", path: "/settings/general", icon: GeneralSettingsSubIcon, partnerVisible: true },
      { label: "Staff & Accounts", path: "/settings/staff", icon: StaffAccountsIcon },
      { label: "Currency", path: "/settings/currency", icon: CurrencyIcon },
      { label: "Partner Management", path: "/settings/partners", icon: PartnerIconCustom },
      { label: "Pipeline Workflow", path: "/settings/pipeline", icon: CatalystIcon },
    ],
  },
];


