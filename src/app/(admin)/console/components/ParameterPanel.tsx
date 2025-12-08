/**
 * AI Console - Parameter Panel Component
 * Sliders and inputs for AI parameters
 */

'use client';

import React, { useState } from 'react';
import { ChatParameters } from '../providers/types';
import { FiSettings, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// ============================================================================
// TYPES
// ============================================================================

interface ParameterPanelProps {
  parameters: ChatParameters;
  onParametersChange: (params: Partial<ChatParameters>) => void;
  disabled?: boolean;
}

// ============================================================================
// SLIDER COMPONENT
// ============================================================================

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  description?: string;
}

function Slider({ label, value, min, max, step, onChange, disabled, description }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-brand-500 dark:bg-gray-700"
      />
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}

// ============================================================================
// PARAMETER PANEL COMPONENT
// ============================================================================

export function ParameterPanel({
  parameters,
  onParametersChange,
  disabled = false,
}: ParameterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <FiSettings className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Parameters</span>
        </div>
        {isExpanded ? (
          <FiChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-5 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              System Prompt
            </label>
            <textarea
              value={parameters.systemPrompt || ''}
              onChange={(e) => onParametersChange({ systemPrompt: e.target.value })}
              disabled={disabled}
              placeholder="You are a helpful assistant..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Instructions that guide the AI&apos;s behavior throughout the conversation.
            </p>
          </div>

          {/* Temperature */}
          <Slider
            label="Temperature"
            value={parameters.temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={(value) => onParametersChange({ temperature: value })}
            disabled={disabled}
            description="Higher values make output more random, lower values more focused."
          />

          {/* Max Tokens */}
          <Slider
            label="Max Tokens"
            value={parameters.maxTokens}
            min={256}
            max={16384}
            step={256}
            onChange={(value) => onParametersChange({ maxTokens: value })}
            disabled={disabled}
            description="Maximum number of tokens in the response."
          />

          {/* Advanced Parameters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
          >
            {showAdvanced ? 'Hide' : 'Show'} advanced parameters
            {showAdvanced ? (
              <FiChevronUp className="h-3 w-3" />
            ) : (
              <FiChevronDown className="h-3 w-3" />
            )}
          </button>

          {/* Advanced Parameters */}
          {showAdvanced && (
            <div className="space-y-5 border-t border-gray-100 pt-4 dark:border-gray-800">
              {/* Top P */}
              <Slider
                label="Top P"
                value={parameters.topP}
                min={0}
                max={1}
                step={0.05}
                onChange={(value) => onParametersChange({ topP: value })}
                disabled={disabled}
                description="Nucleus sampling - consider tokens with top_p probability mass."
              />

              {/* Frequency Penalty */}
              <Slider
                label="Frequency Penalty"
                value={parameters.frequencyPenalty}
                min={-2}
                max={2}
                step={0.1}
                onChange={(value) => onParametersChange({ frequencyPenalty: value })}
                disabled={disabled}
                description="Penalize tokens based on their frequency in the text so far."
              />

              {/* Presence Penalty */}
              <Slider
                label="Presence Penalty"
                value={parameters.presencePenalty}
                min={-2}
                max={2}
                step={0.1}
                onChange={(value) => onParametersChange({ presencePenalty: value })}
                disabled={disabled}
                description="Penalize tokens based on whether they appear in the text so far."
              />
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={() =>
              onParametersChange({
                temperature: 0.7,
                maxTokens: 4096,
                topP: 1,
                frequencyPenalty: 0,
                presencePenalty: 0,
                systemPrompt: '',
              })
            }
            disabled={disabled}
            className="w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

export default ParameterPanel;
