'use client';

import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface HeaderTabsContextType {
  activeTab: 'free' | 'premium' | 'history';
  switchTab: (tab: 'free' | 'premium' | 'history') => void;
  tabsEnabled: boolean;
  setTabsEnabled: (enabled: boolean) => void;
}

const HeaderTabsContext = createContext<HeaderTabsContextType>({
  activeTab: 'free',
  switchTab: () => {},
  tabsEnabled: false,
  setTabsEnabled: () => {},
});

export function HeaderTabsProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<'free' | 'premium' | 'history'>('free');
  const [tabsEnabled, setTabsEnabled] = useState(false);

  const switchTab = useCallback((tab: 'free' | 'premium' | 'history') => {
    setActiveTab(tab);
  }, []);

  return (
    <HeaderTabsContext.Provider value={{ activeTab, switchTab, tabsEnabled, setTabsEnabled }}>
      {children}
    </HeaderTabsContext.Provider>
  );
}

export function useHeaderTabs() {
  return useContext(HeaderTabsContext);
}
