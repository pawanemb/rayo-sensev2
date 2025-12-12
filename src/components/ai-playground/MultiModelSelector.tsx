
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ApiInterface, API_INTERFACES, AVAILABLE_MODELS } from '@/lib/constants/models';

interface MultiModelSelectorProps {
  selectedModels: string[];
  onSelectModels: (modelIds: string[]) => void;
  apiKeys: Record<string, string>;
}

// Interface categories for grouping
const INTERFACE_GROUPS = [
  { id: 'all', name: 'All Models' },
  { id: 'openai-api', name: 'O-Series' },
  { id: 'openai-standard', name: 'GPT Models' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'claude-opus-4', name: 'Claude 4' },
  { id: 'gpt-5', name: 'GPT-5' },
];

export default function MultiModelSelector({
  selectedModels,
  onSelectModels,
  apiKeys
}: MultiModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterface, setSelectedInterface] = useState<string>('all');
  
  const filteredModels = AVAILABLE_MODELS.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInterface = selectedInterface === 'all' || model.interface === selectedInterface;
    return matchesSearch && matchesInterface;
  });
  
  const handleToggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectModels(selectedModels.filter(id => id !== modelId));
    } else {
      onSelectModels([...selectedModels, modelId]);
    }
  };
  
  const handleSelectAll = () => {
    const allFilteredIds = filteredModels.map(m => m.id);
    const newSelection = [...new Set([...selectedModels, ...allFilteredIds])];
    onSelectModels(newSelection);
  };
  
  const handleClearAll = () => {
    if (selectedInterface === 'all') {
      onSelectModels([]);
    } else {
      const filteredIds = filteredModels.map(m => m.id);
      onSelectModels(selectedModels.filter(id => !filteredIds.includes(id)));
    }
  };
  
  const getSelectedModelNames = () => {
    if (selectedModels.length === 0) return 'Select models...';
    if (selectedModels.length === 1) {
      const model = AVAILABLE_MODELS.find(m => m.id === selectedModels[0]);
      return model?.name || selectedModels[0];
    }
    return `${selectedModels.length} models selected`;
  };
  
  return (
    <div className="relative">
      {/* Selected Models Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-4 min-w-[200px]"
      >
        <div className="flex items-center gap-1">
          {selectedModels.length > 0 && selectedModels.length <= 3 ? (
            selectedModels.map(id => {
              const model = AVAILABLE_MODELS.find(m => m.id === id);
              return <span key={id} className="text-lg">{model?.icon || '🤖'}</span>;
            })
          ) : (
            <span className="text-lg">🤖</span>
          )}
        </div>
        <span className="font-medium text-sm flex-1 text-left truncate">
          {getSelectedModelNames()}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 w-[520px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Multiple Models
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedModels.length} selected
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose multiple models to compare responses side by side
              </p>
            </div>
            
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Interface Tabs */}
            <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {INTERFACE_GROUPS.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedInterface(group.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    selectedInterface === group.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSelectAll}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
              >
                Clear
              </button>
            </div>
            
            {/* Models List */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {filteredModels.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No models found
                </div>
              ) : (
                <div className="p-2 grid grid-cols-2 gap-1">
                  {filteredModels.map(model => {
                    const isSelected = selectedModels.includes(model.id);
                    const interfaceConfig = API_INTERFACES[model.interface];
                    const isEnabled = !!apiKeys[interfaceConfig.storageKey];
                    
                    return (
                      <button
                        key={model.id}
                        onClick={() => handleToggleModel(model.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-brand-500 border-brand-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        
                        <span className="text-lg flex-shrink-0">{model.icon}</span>
                        
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium truncate ${
                            isSelected
                              ? 'text-brand-600 dark:text-brand-400'
                              : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {model.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 truncate">
                              {interfaceConfig?.name}
                            </span>
                            {!isEnabled && (
                              <span className="text-[9px] uppercase font-bold text-gray-400 border border-gray-200 dark:border-gray-700 px-1 py-0 rounded">
                                Key Required
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedModels.length} of {AVAILABLE_MODELS.length} models selected
                </span>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-1.5"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
