/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { MatchFiltersState, FilterCountry, FilterIndustry, InvestorCriteria } from '../MatchIQ';
import { Dropdown, Country as DropdownCountry } from '../../prospects/components/Dropdown';
import { IndustryDropdown, Industry as DropdownIndustry } from '../../prospects/components/IndustryDropdown';
import { InvestorDropdown, InvestorOption } from './InvestorDropdown';
import filterIcon from '../../../assets/icons/prospects/filter.svg';
import { Loader2 } from 'lucide-react';

interface MatchFiltersProps {
    filters: MatchFiltersState;
    onChange: (filters: Partial<MatchFiltersState>) => void;
    countries: FilterCountry[];
    industries: FilterIndustry[];
    onCustomScore: (criteria: InvestorCriteria) => Promise<void>;
    customLoading: boolean;
}

const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '5px',
    display: 'block',
};

const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '10px',
};


const MatchFilters: React.FC<MatchFiltersProps> = ({
    filters, onChange, countries, industries, onCustomScore, customLoading
}) => {
    // Convert filter IDs to objects for the dropdowns
    const selectedCountries = countries.filter(c => filters.country_ids.includes(c.id));
    const selectedIndustries = industries.filter(i => filters.industry_ids.includes(i.id));

    // ─── Investor Criteria State ───────────────────────────────────────────
    const [criteriaSection, setCriteriaSection] = useState(true);
    const [selectedInvestor, setSelectedInvestor] = useState<InvestorOption | null>(null);
    const [criteria, setCriteria] = useState<InvestorCriteria>({
        investor_id: '',
        industry_ids: [],
        target_countries: [],
        ebitda_min: '',
        budget_min: '',
        budget_max: '',
        ownership_condition: '',
    });

    const criteriaCountries = countries.filter(c => criteria.target_countries.includes(c.id));
    const criteriaIndustries = industries.filter(i => criteria.industry_ids.includes(i.id));

    const ownershipOptions = [
        '',
        'Minority (<50%)',
        'Significant minority (25–49%)',
        'Joint control (51/49)',
        'Majority (51–99%)',
        'Full acquisition (100%)',
        'Flexible',
    ];

    return (
        <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '3px',
            padding: '16px', position: 'sticky', top: '24px',
            display: 'flex', flexDirection: 'column', gap: '0',
        }}>

            {/* ─── Standard Filters ───────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', color: '#374151' }}>
                <img src={filterIcon} alt="" style={{ width: 14, height: 14 }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Filters</span>
            </div>

            {/* Minimum Score */}
            <div className="pb-4 mb-4 border-b border-gray-100">
                <label style={labelStyle}>Min Score</label>
                <select
                    value={filters.min_score}
                    onChange={e => onChange({ min_score: Number(e.target.value) })}
                    aria-label="Minimum score"
                    className="w-full h-9 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 appearance-none cursor-pointer transition-colors"
                >
                    <option value={90}>90+ Excellent</option>
                    <option value={80}>80+ Strong</option>
                    <option value={70}>70+ Good</option>
                    <option value={60}>60+ Fair</option>
                    <option value={50}>50+ All</option>
                </select>
            </div>

            {/* Industry */}
            <div className="pb-4 mb-4 border-b border-gray-100">
                <label style={labelStyle}>Industry</label>
                <IndustryDropdown
                    industries={industries as DropdownIndustry[]}
                    selected={selectedIndustries as DropdownIndustry[]}
                    onSelect={(val) => {
                        const selected = Array.isArray(val) ? val : [val];
                        onChange({ industry_ids: selected.map((i: DropdownIndustry) => i.id) });
                    }}
                    multiSelect={true}
                    placeholder="Select industry"
                />
            </div>

            {/* Country */}
            <div className="pb-3 mb-3 border-b border-gray-100">
                <label style={labelStyle}>Country</label>
                <Dropdown
                    countries={countries as DropdownCountry[]}
                    selected={selectedCountries as DropdownCountry[]}
                    onSelect={((c: DropdownCountry | DropdownCountry[]) => {
                        if (Array.isArray(c)) {
                            onChange({ country_ids: c.map((x: DropdownCountry) => x.id) });
                        } else {
                            const exists = filters.country_ids.includes(c.id);
                            onChange({
                                country_ids: exists
                                    ? filters.country_ids.filter(id => id !== c.id)
                                    : [...filters.country_ids, c.id]
                            });
                        }
                    }) as any}
                    multiSelect
                    placeholder="Select country"
                />
            </div>

            {/* Reset standard filters */}
            <button
                onClick={() => onChange({ min_score: 60, industry_ids: [], country_ids: [], buyer_id: '', seller_id: '' })}
                className="w-full py-2 rounded-[3px] border border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors mb-4"
            >
                Reset Filters
            </button>

            {/* ─── Investor Criteria Panel ─────────────────────────────── */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
                <button
                    onClick={() => setCriteriaSection(v => !v)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px 0',
                    }}
                    title={criteriaSection ? 'Collapse criteria' : 'Expand criteria'}
                >
                    <span style={sectionHeadingStyle}>Investor Criteria</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{criteriaSection ? '▲' : '▼'}</span>
                </button>

                {criteriaSection && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Investor picker */}
                        <div>
                            <label style={labelStyle}>Investor</label>
                            <InvestorDropdown
                                selected={selectedInvestor}
                                onSelect={(inv) => {
                                    setSelectedInvestor(inv);
                                    setCriteria(prev => ({ ...prev, investor_id: inv ? String(inv.id) : '' }));
                                }}
                                placeholder="Select an investor"
                            />
                        </div>

                        {/* Target Industry */}
                        <div>
                            <label style={labelStyle}>Target Industry</label>
                            <IndustryDropdown
                                industries={industries as DropdownIndustry[]}
                                selected={criteriaIndustries as DropdownIndustry[]}
                                onSelect={(val) => {
                                    const selected = Array.isArray(val) ? val : [val];
                                    setCriteria(prev => ({ ...prev, industry_ids: selected.map((i: DropdownIndustry) => i.id) }));
                                }}
                                multiSelect
                                placeholder="Any industry"
                            />
                        </div>

                        {/* Target Country */}
                        <div>
                            <label style={labelStyle}>Target Country</label>
                            <Dropdown
                                countries={countries as DropdownCountry[]}
                                selected={criteriaCountries as DropdownCountry[]}
                                onSelect={((c: DropdownCountry | DropdownCountry[]) => {
                                    if (Array.isArray(c)) {
                                        setCriteria(prev => ({ ...prev, target_countries: c.map(x => x.id) }));
                                    } else {
                                        const exists = criteria.target_countries.includes(c.id);
                                        setCriteria(prev => ({
                                            ...prev,
                                            target_countries: exists
                                                ? prev.target_countries.filter(id => id !== c.id)
                                                : [...prev.target_countries, c.id],
                                        }));
                                    }
                                }) as any}
                                multiSelect
                                placeholder="Any country"
                            />
                        </div>

                        {/* EBITDA Min */}
                        <div>
                            <label style={labelStyle}>Min EBITDA</label>
                            <input
                                type="number"
                                value={criteria.ebitda_min}
                                onChange={e => setCriteria(prev => ({ ...prev, ebitda_min: e.target.value }))}
                                placeholder="e.g. 500000"
                                aria-label="Minimum EBITDA"
                                style={{
                                    width: '100%', height: '36px', padding: '0 10px',
                                    border: '1px solid #d1d5db', borderRadius: '3px',
                                    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Budget Range */}
                        <div>
                            <label style={labelStyle}>Investment Budget</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                    type="number"
                                    value={criteria.budget_min}
                                    onChange={e => setCriteria(prev => ({ ...prev, budget_min: e.target.value }))}
                                    placeholder="Min"
                                    aria-label="Budget minimum"
                                    style={{
                                        flex: 1, height: '36px', padding: '0 8px',
                                        border: '1px solid #d1d5db', borderRadius: '3px',
                                        fontSize: '13px', outline: 'none', minWidth: 0,
                                    }}
                                />
                                <input
                                    type="number"
                                    value={criteria.budget_max}
                                    onChange={e => setCriteria(prev => ({ ...prev, budget_max: e.target.value }))}
                                    placeholder="Max"
                                    aria-label="Budget maximum"
                                    style={{
                                        flex: 1, height: '36px', padding: '0 8px',
                                        border: '1px solid #d1d5db', borderRadius: '3px',
                                        fontSize: '13px', outline: 'none', minWidth: 0,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Ownership Condition */}
                        <div>
                            <label style={labelStyle}>Ownership Preference</label>
                            <select
                                value={criteria.ownership_condition}
                                onChange={e => setCriteria(prev => ({ ...prev, ownership_condition: e.target.value }))}
                                aria-label="Ownership preference"
                                style={{
                                    width: '100%', height: '36px', padding: '0 10px',
                                    border: '1px solid #d1d5db', borderRadius: '3px',
                                    fontSize: '13px', outline: 'none',
                                    background: '#fff', cursor: 'pointer',
                                    boxSizing: 'border-box',
                                }}
                            >
                                {ownershipOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt || 'Any'}</option>
                                ))}
                            </select>
                        </div>

                        {/* Score button */}
                        <button
                            onClick={() => onCustomScore(criteria)}
                            disabled={customLoading || !criteria.investor_id}
                            style={{
                                width: '100%', padding: '9px 0',
                                background: criteria.investor_id ? '#064771' : '#e5e7eb',
                                color: criteria.investor_id ? '#fff' : '#9ca3af',
                                border: 'none', borderRadius: '3px',
                                fontSize: '12px', fontWeight: 600,
                                cursor: criteria.investor_id && !customLoading ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                transition: 'background 0.15s',
                                marginTop: '2px',
                            }}
                        >
                            {customLoading && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
                            {customLoading ? 'Scoring…' : 'Score Targets with Criteria'}
                        </button>

                        {/* Clear criteria */}
                        <button
                            onClick={() => {
                                setCriteria({ investor_id: '', industry_ids: [], target_countries: [], ebitda_min: '', budget_min: '', budget_max: '', ownership_condition: '' });
                                setSelectedInvestor(null);
                            }}
                            style={{
                                background: 'none', border: 'none', color: '#9ca3af',
                                fontSize: '11px', cursor: 'pointer', textDecoration: 'underline',
                                padding: '0', textAlign: 'center',
                            }}
                        >
                            Clear criteria
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchFilters;
