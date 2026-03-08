'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { rtdb } from '@/lib/firebase';
import { ref, get, set, runTransaction } from 'firebase/database';

type Suggestion = {
    value: string;
    count: number;
};

export function useAutocomplete(type: 'team' | 'tip') {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const search = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            const normalizedQuery = query.toLowerCase().trim();
            
            try {
                const dbRef = ref(rtdb, `learn/${type}`);
                const snapshot = await get(dbRef);
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const matches: Suggestion[] = [];
                    
                    Object.entries(data).forEach(([key, value]: [string, any]) => {
                        if (key.toLowerCase().includes(normalizedQuery)) {
                            matches.push({
                                value: key,
                                count: value.count || 0
                            });
                        }
                    });
                    
                    matches.sort((a, b) => b.count - a.count);
                    setSuggestions(matches.slice(0, 3));
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error('Autocomplete error:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 200);
    }, [type]);

    const learn = useCallback(async (value: string) => {
        if (!value.trim()) return;
        
        const normalizedValue = value.trim();
        
        try {
            const dbRef = ref(rtdb, `learn/${type}/${normalizedValue}`);
            
            await runTransaction(dbRef, (current: any) => {
                if (current === null) {
                    return { count: 1, lastUsed: Date.now() };
                }
                return {
                    count: (current.count || 0) + 1,
                    lastUsed: Date.now()
                };
            });
        } catch (error) {
            console.error('Learning error:', error);
        }
    }, [type]);

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
    }, []);

    return { suggestions, search, learn, clearSuggestions, isLoading };
}

export function useTeamAutocomplete() {
    return useAutocomplete('team');
}

export function useTipAutocomplete() {
    return useAutocomplete('tip');
}
