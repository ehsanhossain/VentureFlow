/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { MatchFiltersState, FilterCountry, FilterIndustry } from '../MatchIQ';
import { Dropdown, Country as DropdownCountry } from '../../prospects/components/Dropdown';
import { IndustryDropdown, Industry as DropdownIndustry } from '../../prospects/components/IndustryDropdown';
import filterIcon from '../../../assets/icons/prospects/filter.svg';

interface MatchFiltersProps {
    filters: MatchFiltersState;
    onChange: (filters: Partial<MatchFiltersState>) => void;
    countries: FilterCountry[];
    industries: FilterIndustry[];
}

const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px',
    display: 'block',
};

const MatchFilters: React.FC<MatchFiltersProps> = ({ filters, onChange, countries, industries }) => {
    // Convert filter IDs to objects for the dropdowns
    const selectedCountries = countries.filter(c => filters.country_ids.includes(c.id));
    const selectedIndustries = industries.filter(i => filters.industry_ids.includes(i.id));

    return (
        <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '3px',
            padding: '16px', position: 'sticky', top: '24px',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                marginBottom: '16px', color: '#374151'
            }}>
                <img src={filterIcon} alt="" style={{ width: 14, height: 14 }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Filters</span>
            </div>

            {/* Minimum Score */}
            <div className="pb-4 mb-4 border-b border-gray-100">
                <label style={labelStyle}>Min Score</label>
                <div className="relative">
                    <select
                        value={filters.min_score}
                        onChange={e => onChange({ min_score: Number(e.target.value) })}
                        aria-label="Minimum score"
                        className="w-full h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 appearance-none cursor-pointer transition-colors"
                    >
                        <option value={90}>90+ Excellent</option>
                        <option value={80}>80+ Strong</option>
                        <option value={70}>70+ Good</option>
                        <option value={60}>60+ Fair</option>
                        <option value={50}>50+ All</option>
                    </select>
                </div>
            </div>

            {/* Industry — using IndustryDropdown like ProspectsPortal */}
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

            {/* Country — using Dropdown like ProspectsPortal */}
            <div className="pb-4 mb-4 border-b border-gray-100">
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

            {/* Reset */}
            <button
                onClick={() => onChange({
                    min_score: 60, industry_ids: [], country_ids: [],
                    buyer_id: '', seller_id: '',
                })}
                className="w-full py-2 rounded-[3px] border border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors mt-1"
            >
                Reset Filters
            </button>
        </div>
    );
};

export default MatchFilters;
