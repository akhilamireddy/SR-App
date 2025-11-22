import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

interface Option {
    value: string | number;
    label: string;
}

interface GlassSelectProps {
    value: string | number;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    label?: string;
    className?: string;
    required?: boolean;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    label,
    className,
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string | number) => {
        onChange(String(optionValue));
        setIsOpen(false);
    };

    return (
        <div className={clsx("relative", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-indigo-200 mb-2 ml-1">
                    {label} {required && <span className="text-red-400">*</span>}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200",
                    "bg-white/5 border border-white/10 text-left",
                    "hover:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
                    isOpen && "ring-2 ring-indigo-500/50 border-indigo-500/50 bg-white/10"
                )}
            >
                <span className={clsx("block truncate", !selectedOption && "text-gray-400")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={clsx(
                    "w-4 h-4 text-indigo-200 transition-transform duration-200",
                    isOpen && "transform rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 rounded-xl bg-[#1a1f3c]/95 backdrop-blur-xl border border-white/10 shadow-xl max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={clsx(
                                "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                                "hover:bg-indigo-500/20 hover:text-white",
                                option.value === value ? "text-indigo-300 bg-indigo-500/10" : "text-gray-300"
                            )}
                        >
                            <span className="truncate font-medium">{option.label}</span>
                            {option.value === value && (
                                <Check className="w-4 h-4 text-indigo-400" />
                            )}
                        </button>
                    ))}
                    {options.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No options available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
