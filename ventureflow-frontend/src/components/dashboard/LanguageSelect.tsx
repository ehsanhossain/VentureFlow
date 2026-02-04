import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "EN", name: "English", flag: "https://flagcdn.com/us.svg" },
  { code: "ja", label: "JP", name: "日本語", flag: "https://flagcdn.com/jp.svg" },
  { code: "th", label: "TH", name: "ไทย", flag: "https://flagcdn.com/th.svg" },
];

export const LanguageSelect: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Language Selector */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-[#033351] rounded-[3px] cursor-pointer hover:bg-[#044a73] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img src={currentLang.flag} alt={currentLang.label} className="w-5 h-5 rounded-sm object-cover" />
        <span className="text-white text-sm font-medium">{currentLang.label}</span>
        <ChevronDown className={`text-white w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl overflow-hidden z-50 min-w-[160px] border border-gray-100"
        >
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${currentLang.code === lang.code
                ? 'bg-blue-50 text-[#053a5c]'
                : 'hover:bg-gray-50 text-gray-700'
                }`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <img src={lang.flag} alt={lang.label} className="w-6 h-4 rounded-sm object-cover" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{lang.name}</span>
                <span className="text-xs text-gray-400">{lang.label}</span>
              </div>
              {currentLang.code === lang.code && (
                <svg className="w-4 h-4 ml-auto text-[#064771]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelect;


