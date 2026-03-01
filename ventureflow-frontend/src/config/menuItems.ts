/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

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
import { Factory, DollarSign, History } from "lucide-react";
import React from 'react';

export interface SubMenuItem {
  label: string;
  path: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: string[]; // If specified, only these roles can see this item
  partnerVisible?: boolean; // If true, partners can see this
  partnerOnly?: boolean; // If true, ONLY partners can see this (hidden from admin/staff)
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
    partnerVisible: true,
  },
  { icon: MatchIcon, label: "MatchIQ", path: "/matchiq" },
  { icon: CatalystIcon, label: "Deal Pipeline", path: "/deal-pipeline" },
  {
    icon: SettingsMainIcon,
    label: "Settings",
    path: "/settings",
    partnerVisible: true,
    // Settings is now visible to all, but has different sub-items based on role
    subItems: [
      { label: "General", path: "/settings/general", icon: GeneralSettingsSubIcon, partnerVisible: true },
      { label: "My Profile", path: "/settings/profile", icon: StaffAccountsIcon, partnerVisible: true, partnerOnly: true },
      { label: "Staff & Accounts", path: "/settings/staff", icon: StaffAccountsIcon },
      { label: "Currency", path: "/settings/currency", icon: CurrencyIcon },
      { label: "Partner Management", path: "/settings/partners", icon: PartnerIconCustom },
      { label: "Pipeline Workflow", path: "/settings/pipeline", icon: CatalystIcon },
      { label: "Industries", path: "/settings/industries", icon: Factory },
      { label: "Fee Structure", path: "/settings/fee-structure", icon: DollarSign },
      { label: "Audit Log", path: "/settings/audit-log", icon: History, roles: ["System Admin"] },
    ],
  },
];


