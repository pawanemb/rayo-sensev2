
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IoSettingsOutline } from 'react-icons/io5';
import { AVAILABLE_MODELS } from '@/lib/constants/models';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  reasoningSummary?: 'auto' | 'concise' | 'detailed';
  responseFormat?: 'text' | 'json_object' | 'json_schema';
  webSearch?: boolean;
  store?: boolean;
  enableThinking?: boolean;
  thinkingBudget?: number;
  verbosity?: 'low' | 'medium' | 'high';
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface ModelConfigCardProps {
  modelId: string;
  config: ModelConfig;
  updateConfig: (updates: Partial<ModelConfig>) => void;
}

export default function ModelConfigCard({
  modelId,
  config,
  updateConfig
}: ModelConfigCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);

  const isOSeries = modelId.startsWith('o1') || modelId.startsWith('o3') || modelId.startsWith('o4');
  const isAnthropic = model?.interface === 'anthropic';
  const isGemini = model?.interface === 'gemini-api';
  const isOpenAI = model?.interface === 'openai-api' || model?.interface === 'openai-standard' || model?.interface === 'gpt-5';
  
  const isThinkingSupported = model?.supportsThinking ?? (
    (isAnthropic && (modelId.includes('claude-3-7') || modelId.includes('claude-3-5-sonnet'))) ||
    (isGemini && modelId.includes('thinking'))
  );
                              
  const hasTemperature = !isOSeries && !modelId.startsWith('o4') && !modelId.startsWith('gpt-5');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-2">
                 <span className="text-xl">{model?.icon}</span>
                 <CardTitle className="text-sm font-medium group-hover:text-brand-600 transition-colors">
                   {model?.name}
                 </CardTitle>
               </div>
            </div>
            <div className="text-gray-400 group-hover:text-brand-500 transition-colors">
              <IoSettingsOutline className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden">
          <CardContent className="space-y-4 pt-0 border-t border-gray-100 dark:border-gray-800 mt-2">
            {hasTemperature && (
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Temperature</label>
                  <span className="text-xs text-gray-500">{config.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  disabled={isThinkingSupported && config.enableThinking}
                  onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            )}

            {!isOSeries && (
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Max Tokens</label>
                  <span className="text-xs text-gray-500">{config.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={model?.outputTokenLimit || 4096}
                  step="1"
                  value={config.maxTokens}
                  onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            )}

            {/* Advanced Controls for OpenAI (O-Series + Standard) */}
            {(isOSeries || isOpenAI) && (
              <div className="space-y-4">
                {/* Reasoning Effort (O-Series & GPT-5) */}
                {(isOSeries || model?.supportsReasoningEffort) && (
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Reasoning Effort</label>
                  <div className="flex gap-1">
                    {(() => {
                        let efforts = ['low', 'medium', 'high'];
                        if (modelId.includes('gpt-5-mini')) efforts = ['minimal', 'low', 'medium', 'high'];
                        if (modelId.includes('o4-mini-deep-research')) efforts = ['medium'];
                        
                        return efforts.map((effort: string) => (
                      <button
                        key={effort}
                        type="button"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => updateConfig({ reasoningEffort: effort as any })}
                        className={`flex-1 text-[10px] uppercase py-1 rounded border transition-colors ${
                          config.reasoningEffort === effort
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {effort}
                      </button>
                    ));
                    })()}
                  </div>
                </div>
                )}

                {/* Reasoning Summary (O-Series Only) */}
                {isOSeries && (
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Reasoning Summary</label>
                  <div className="flex gap-1">
                    {(() => {
                        let summaries = ['auto', 'concise', 'detailed'];
                        if (modelId.startsWith('o1') || modelId.startsWith('o3') || modelId.startsWith('o4')) {
                          summaries = ['detailed'];
                        }
                        
                        return summaries.map((summary: string) => (
                      <button
                        key={summary}
                        type="button"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => updateConfig({ reasoningSummary: summary as any })}
                        className={`flex-1 text-[10px] uppercase py-1 rounded border transition-colors ${
                          config.reasoningSummary === summary
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {summary}
                      </button>
                    ));
                    })()}
                  </div>
                </div>
                )}

                {/* Response Format */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Response Format</label>
                    <select
                        value={config.responseFormat || 'text'}
                        onChange={(e) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const newFormat = e.target.value as any;
                            const updates: Partial<ModelConfig> = { responseFormat: newFormat };
                            // Disable web search if JSON mode is selected
                            if (newFormat === 'json_object' || newFormat === 'json_schema') {
                                updates.webSearch = false;
                            }
                            updateConfig(updates);
                        }}
                        className="w-full p-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-1 focus:ring-brand-500 outline-none"
                    >
                        <option value="text">Text</option>
                        <option value="json_object">JSON Object</option>
                        <option value="json_schema">JSON Schema</option>
                    </select>
                    </div>
                    
                    {model?.supportsVerbosity && (
                        <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Verbosity</label>
                        <select
                            value={config.verbosity || 'medium'}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={(e) => updateConfig({ verbosity: e.target.value as any })}
                            className="w-full p-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-1 focus:ring-brand-500 outline-none"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        </div>
                    )}
                </div>

                {/* Store & Include */}
                <div className="space-y-2">
                    <label className={`flex items-center gap-2 cursor-pointer ${
                        (config.responseFormat === 'json_object' || config.responseFormat === 'json_schema') 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={config.webSearch || false} 
                        disabled={config.responseFormat === 'json_object' || config.responseFormat === 'json_schema'}
                        onChange={(e) => updateConfig({ webSearch: e.target.checked })}
                        className="w-3.5 h-3.5 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50" 
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                          Web Search
                          {(config.responseFormat === 'json_object' || config.responseFormat === 'json_schema') && 
                            " (N/A with JSON)"}
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.store || false} 
                        onChange={(e) => updateConfig({ store: e.target.checked })}
                        className="w-3.5 h-3.5 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700" 
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Store Response</span>
                    </label>
                </div>
              </div>
            )}

            {isThinkingSupported && (
              <div className="space-y-2 p-2 bg-brand-50 dark:bg-brand-900/20 rounded border border-brand-100 dark:border-brand-900/50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                    <span className="text-sm">🧠</span> Thinking
                  </label>
                  <input 
                    type="checkbox" 
                    checked={config.enableThinking} 
                    onChange={(e) => updateConfig({ enableThinking: e.target.checked })}
                    className="w-3.5 h-3.5 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700" 
                  />
                </div>
                {config.enableThinking && (
                  <div>
                    <label className="block text-[10px] font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Budget (Tokens)
                    </label>
                    <input
                      type="number"
                      value={config.thinkingBudget}
                      onChange={(e) => updateConfig({ thinkingBudget: parseInt(e.target.value) })}
                      className="w-full p-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
