'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { LuChevronDown as ChevronDown } from 'react-icons/lu';

type Suggestion = {
    value: string;
    count: number;
};

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (value: string) => void;
    suggestions: Suggestion[];
    isLoading: boolean;
    placeholder?: string;
    onBlur?: () => void;
    style?: React.CSSProperties;
    inputId?: string;
}

export default function AutocompleteInput({
    value,
    onChange,
    onSelect,
    suggestions,
    isLoading,
    placeholder,
    onBlur,
    style,
    inputId
}: AutocompleteInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const uniqueId = useId();
    const inputIdFinal = inputId || uniqueId;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsFocused(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isFocused && suggestions.length > 0 && value.length >= 1) {
            setIsOpen(true);
        } else if (!isFocused) {
            setIsOpen(false);
        }
    }, [suggestions, value, isFocused]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setIsFocused(true);
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (value.length >= 1 && suggestions.length > 0) {
            setIsOpen(true);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        setTimeout(() => {
            if (!wrapperRef.current?.contains(document.activeElement)) {
                setIsOpen(false);
            }
        }, 150);
        onBlur?.();
    };

    const handleSuggestionClick = (suggestion: Suggestion) => {
        onSelect(suggestion.value);
        onChange(suggestion.value);
        setIsOpen(false);
        setIsFocused(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setIsFocused(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <input
                    ref={inputRef}
                    id={inputIdFinal}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="input"
                    autoComplete="off"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-controls={`${inputIdFinal}-listbox`}
                    style={{
                        width: '100%',
                        paddingRight: isLoading ? '2rem' : '0.5rem',
                        ...style
                    }}
                />
                {isLoading && (
                    <div style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)'
                    }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid var(--color-border)',
                            borderTopColor: 'var(--color-primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                    </div>
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div 
                    id={`${inputIdFinal}-listbox`}
                    role="listbox"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 50,
                        marginTop: '4px',
                        overflow: 'hidden',
                        animation: 'fadeInUp 0.15s ease-out',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}
                >
                    {suggestions.map((suggestion, idx) => (
                        <div
                            key={suggestion.value}
                            role="option"
                            aria-selected={idx === 0}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseDown={(e) => e.preventDefault()}
                            style={{
                                padding: '0.625rem 0.875rem',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: idx % 2 === 0 ? 'var(--color-bg)' : 'white',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-light)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'var(--color-bg)' : 'white'}
                        >
                            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{suggestion.value}</span>
                            <span style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-text-muted)',
                                background: 'var(--color-bg)',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px'
                            }}>
                                {suggestion.count}x used
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
