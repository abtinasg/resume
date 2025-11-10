'use client';

import React, { useState } from 'react';

export interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: number;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab = 0,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-3 font-medium transition-all rounded-t-xl ${
              activeTab === index
                ? 'text-[#3B82F6] border-b-2 border-[#3B82F6] bg-blue-50'
                : 'text-[#374151] hover:text-[#3B82F6] hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-white rounded-b-xl shadow-sm">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default Tabs;
