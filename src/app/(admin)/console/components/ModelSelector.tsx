/**
 * AI Console - Model Selector Component
 * Provider tabs and model dropdown
 */

'use client';

import React from 'react';
import { AIProvider, AIModel, ProviderID } from '../providers/types';
import { PROVIDERS } from '../providers';
import { FiChevronDown, FiCheck, FiAlertCircle } from 'react-icons/fi';

// ============================================================================
// TYPES
// ============================================================================

interface ModelSelectorProps {
  provider: ProviderID;
  model: string;
  onProviderChange: (provider: ProviderID) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

// ============================================================================
// PROVIDER ICONS
// ============================================================================

const ProviderIcon: React.FC<{ provider: string; className?: string }> = ({ provider, className = 'h-5 w-5' }) => {
  switch (provider) {
    case 'openai':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
      );
    case 'anthropic':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.304 3.541l-5.296 16.918h3.208l5.296-16.918h-3.208zm-7.4 0L3.608 20.459h3.208l1.24-3.96h5.872l1.24 3.96h3.208L12.08 3.541H9.904zm.088 10.498l1.92-6.136 1.92 6.136H9.992z" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      );
  }
};

// ============================================================================
// MODEL SELECTOR COMPONENT
// ============================================================================

export function ModelSelector({
  provider,
  model,
  onProviderChange,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableProviders = Object.values(PROVIDERS).filter((p) => p.isEnabled);
  const currentProvider = PROVIDERS[provider];
  const currentModel = currentProvider?.models.find((m) => m.id === model);

  const handleProviderClick = (newProvider: ProviderID) => {
    if (newProvider !== provider) {
      onProviderChange(newProvider);
    }
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsModelDropdownOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Provider Tabs */}
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Provider
        </label>
        <div className="flex flex-wrap gap-2">
          {availableProviders.map((p) => {
            const isActive = p.id === provider;
            return (
              <button
                key={p.id}
                onClick={() => handleProviderClick(p.id as ProviderID)}
                disabled={disabled}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ProviderIcon provider={p.id} className="h-4 w-4" />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Dropdown */}
      <div ref={dropdownRef} className="relative">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Model
        </label>
        <button
          onClick={() => !disabled && setIsModelDropdownOpen(!isModelDropdownOpen)}
          disabled={disabled}
          className={`flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm dark:border-gray-700 dark:bg-gray-800 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <ProviderIcon provider={provider} className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {currentModel?.name || model}
            </span>
          </div>
          <FiChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isModelDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isModelDropdownOpen && (
          <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {currentProvider?.models.map((m) => (
              <button
                key={m.id}
                onClick={() => handleModelSelect(m.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{m.name}</span>
                    {m.isDefault && (
                      <span className="rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                        Default
                      </span>
                    )}
                  </div>
                  {m.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{m.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{(m.contextLength / 1000).toFixed(0)}K context</span>
                    {m.inputPricePerMillion && (
                      <span>${m.inputPricePerMillion}/M in</span>
                    )}
                    {m.outputPricePerMillion && (
                      <span>${m.outputPricePerMillion}/M out</span>
                    )}
                  </div>
                </div>
                {m.id === model && <FiCheck className="h-4 w-4 text-brand-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Model Info */}
      {currentModel && (
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>
                <strong>Context:</strong> {(currentModel.contextLength / 1000).toFixed(0)}K tokens
                {currentModel.maxOutputTokens && (
                  <> • <strong>Max output:</strong> {(currentModel.maxOutputTokens / 1000).toFixed(0)}K tokens</>
                )}
              </p>
              {currentModel.capabilities && (
                <p className="mt-1">
                  <strong>Capabilities:</strong> {currentModel.capabilities.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelSelector;
