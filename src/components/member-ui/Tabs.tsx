'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, className, onTabChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={cn('w-full', className)}>
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn('tab-btn', activeTab === tab.id && 'active')}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {activeContent}
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs';
