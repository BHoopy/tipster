'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { rtdb } from '@/lib/firebase';
import { ref, runTransaction, onValue } from 'firebase/database';

type Suggestion = {
    value: string;
    count: number;
};

export function useAutocomplete(type: 'team' | 'tip' | 'league') {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [allData, setAllData] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Fetch all once and stay in sync - this is "fetch as fast as possible"
    useEffect(() => {
        const dbRef = ref(rtdb, `learn/${type}`);
        const unsubscribe = onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                setAllData(snapshot.val());
            } else {
                setAllData({});
            }
            setIsLoading(false);
        });
        return unsubscribe;
    }, [type]);

    // Top suggestions for "One-click" entry
    const topSuggestions = useMemo(() => {
        return Object.entries(allData)
            .map(([key, item]: [string, any]) => ({
                value: item.value || key,
                count: item.count || 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [allData]);

    const search = useCallback((query: string) => {
        const normalizedQuery = query.toLowerCase().trim();

        if (normalizedQuery.length < 1) {
            setSuggestions([]);
            return;
        }

        const matches: Suggestion[] = [];

        // Search against local cache for instant results
        Object.entries(allData).forEach(([key, item]: [string, any]) => {
            const displayValue = item.value || key;
            if (displayValue.toLowerCase().includes(normalizedQuery)) {
                matches.push({
                    value: displayValue,
                    count: item.count || 0
                });
            }
        });

        // Sort by usage count and limit
        matches.sort((a, b) => b.count - a.count);
        setSuggestions(matches.slice(0, 5));
    }, [allData]);

    const learn = useCallback(async (value: string) => {
        if (!value.trim()) return;

        const normalizedValue = value.trim();
        // Firebase RTDB keys cannot contain ., #, $, [, or ]
        const safeKey = normalizedValue.toLowerCase().replace(/[.#$[\]]/g, (char) => {
            return `_esc_${char.charCodeAt(0)}_`;
        });

        console.log(`Learning ${type}: ${normalizedValue} (key: ${safeKey})`);

        try {
            const dbRef = ref(rtdb, `learn/${type}/${safeKey}`);

            await runTransaction(dbRef, (current: any) => {
                if (current === null) {
                    return {
                        value: normalizedValue,
                        count: 1,
                        lastUsed: Date.now()
                    };
                }
                return {
                    ...current,
                    value: current.value || normalizedValue,
                    count: (current.count || 0) + 1,
                    lastUsed: Date.now()
                };
            });
            console.log(`Successfully learnt: ${normalizedValue}`);
        } catch (error) {
            console.error('Learning error:', error);
            alert('Database error: check console and RTDB rules');
        }
    }, [type]);

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
    }, []);

    return { suggestions, search, learn, clearSuggestions, isLoading, topSuggestions };
}

export function useTeamAutocomplete() {
    return useAutocomplete('team');
}

export function useTipAutocomplete() {
    return useAutocomplete('tip');
}

export function useLeagueAutocomplete() {
    return useAutocomplete('league');
}
