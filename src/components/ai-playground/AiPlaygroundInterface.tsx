"use client";

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Maximize2 } from 'lucide-react';
import { AVAILABLE_MODELS, API_INTERFACES, ApiInterface } from '@/lib/constants/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal, ModalBody, ModalHeader, ModalTitle } from '@/components/ui/modal';
import MultiModelSelector from './MultiModelSelector';
import ResponseDisplay from './ResponseDisplay';
import ModelConfigCard from './ModelConfigCard';

interface ModelConfig {
  temperature: number;
  maxTokens: number;
  reasoningEffort: 'minimal' | 'low' | 'medium' | 'high';
  enableThinking: boolean;
  thinkingBudget: number;
  // O1/OpenAI Advanced
  responseFormat: 'text' | 'json_object' | 'json_schema';
  reasoningSummary: 'auto' | 'concise' | 'detailed';
  verbosity: 'low' | 'medium' | 'high';
  store: boolean;
  include: string[];
  webSearch: boolean;
  codeExecution: boolean;
  urlContext: boolean;
}

const DEFAULT_CONFIG: ModelConfig = {
  temperature: 0.7,
  maxTokens: 1000,
  reasoningEffort: 'medium',
  enableThinking: false,
  thinkingBudget: 1024,
  responseFormat: 'text',
  reasoningSummary: 'auto',
  verbosity: 'medium',
  store: false,
  include: [],
  webSearch: false,
  codeExecution: false,
  urlContext: false
};

export default function AiPlaygroundInterface() {
  // State
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedModels, setSelectedModels] = useState<string[]>(['o1']);
  
  // Per-model configuration
  const [modelConfigs, setModelConfigs] = useState<Record<string, ModelConfig>>({});
  
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [expandedField, setExpandedField] = useState<'system' | 'user' | null>(null);
  
  // Response State (keyed by model ID)
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<Record<string, { 
    time: number, 
    usage?: { input_tokens: number, output_tokens: number },
    cost?: number
  }>>({});
  
  // Derived State helpers
  const getModelInfo = (id: string) => AVAILABLE_MODELS.find(m => m.id === id);

  // Initialize config for new models
  useEffect(() => {
    setModelConfigs(prev => {
      const next = { ...prev };
      let changed = false;
      selectedModels.forEach(id => {
        if (!next[id]) {
          // Initialize with intelligent defaults based on model capabilities
          const m = getModelInfo(id);
          const isThinkingSupported = m?.supportsThinking ?? (
            (m?.interface === 'anthropic' && (id.includes('claude-3-7') || id.includes('claude-3-5-sonnet'))) ||
            (m?.interface === 'gemini-api' && id.includes('thinking'))
          );
          const isOSeries = id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4');
          
          const specificConfig = { ...DEFAULT_CONFIG };

          // Auto-enable web search for deep research models (required)
          if (id.includes('deep-research')) {
            specificConfig.webSearch = true;
          }
          
          // Set max tokens based on model capacity
          if (m?.outputTokenLimit) {
            specificConfig.maxTokens = m.outputTokenLimit;
          }

          if (isThinkingSupported) {
            specificConfig.enableThinking = true;
            specificConfig.thinkingBudget = 4096; 
            // Ensure maxTokens is enough for thinking
            if (specificConfig.maxTokens < 8192) specificConfig.maxTokens = 16384;
            specificConfig.temperature = 1.0; 
          } else if (isOSeries) {
            specificConfig.reasoningEffort = 'medium';
             // Ensure reasonable limit for O-series if not set high
            if (specificConfig.maxTokens < 4096) specificConfig.maxTokens = 10000;
          }
          
          next[id] = specificConfig;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [selectedModels]);

  const updateModelConfig = (modelId: string, updates: Partial<ModelConfig>) => {
    setModelConfigs(prev => ({
      ...prev,
      [modelId]: { ...prev[modelId], ...updates }
    }));
  };

  // Load API Keys
  useEffect(() => {
    const loadedKeys: Record<string, string> = {};
    const uniqueKeys = new Set(Object.values(API_INTERFACES).map(c => c.storageKey));
    uniqueKeys.forEach(storageKey => {
      const savedKey = Cookies.get(storageKey);
      if (savedKey) {
        loadedKeys[storageKey] = savedKey;
      }
    });
    setApiKeys(loadedKeys);
  }, []);

  // Save API Key
  const handleApiKeyChange = (storageKey: string, value: string) => {
    const trimmedValue = value.trim();
    setApiKeys(prev => ({ ...prev, [storageKey]: trimmedValue }));
    if (trimmedValue) {
      Cookies.set(storageKey, trimmedValue, { expires: 180 });
    } else {
      Cookies.remove(storageKey);
    }
  };

  const runModelGeneration = async (modelId: string) => {
    const modelInfo = getModelInfo(modelId);
    if (!modelInfo) return;

    const config = modelConfigs[modelId] || DEFAULT_CONFIG;
    const interfaceConfig = API_INTERFACES[modelInfo.interface as ApiInterface];
    const apiKey = apiKeys[interfaceConfig?.storageKey];

    if (!apiKey) {
      setErrors(prev => ({ ...prev, [modelId]: `Missing API Key for ${modelInfo.name}` }));
      return;
    }
    
    if (modelInfo.interface === 'gemini-api' && !apiKey.startsWith('AIza')) {
      console.warn('Warning: Google API Key usually starts with AIza');
    }

    setLoading(prev => ({ ...prev, [modelId]: true }));
    setErrors(prev => ({ ...prev, [modelId]: '' }));
    setResponses(prev => ({ ...prev, [modelId]: '' }));
    setMetrics(prev => ({ ...prev, [modelId]: { time: 0, usage: undefined, cost: undefined } }));
    
    const startTime = Date.now();

    try {
      const messages = [];
      if (systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: userPrompt });

      // Determine Endpoint
      let endpoint = '/api/ai-playground/openai';
      if (modelInfo.interface === 'anthropic' || modelInfo.interface === 'claude-opus-4') endpoint = '/api/ai-playground/anthropic';
      if (modelInfo.interface === 'openrouter') endpoint = '/api/ai-playground/openrouter';
      if (modelInfo.interface === 'gemini-api') endpoint = '/api/ai-playground/gemini';

      // Check Capabilities
      const isOSeries = modelId.startsWith('o1') || modelId.startsWith('o3') || modelId.startsWith('o4');
      const isThisModelAnthropic = modelInfo.interface === 'anthropic' || modelInfo.interface === 'claude-opus-4';
      const isThisModelGemini = modelInfo.interface === 'gemini-api';
      const isThisModelThinking = modelInfo.supportsThinking ?? (
        (isThisModelAnthropic && (modelId.includes('claude-3-7') || modelId.includes('claude-3-5-sonnet'))) ||
        (isThisModelGemini && modelId.includes('thinking'))
      );
      // New: Check for generic OpenAI interface to enable advanced params
      const isOpenAI = modelInfo.interface === 'openai-api' || modelInfo.interface === 'openai-standard' || modelInfo.interface === 'gpt-5';

      const body: Record<string, unknown> = {
        model: modelId,
        messages,
        stream: true,
        maxTokens: config.maxTokens
      };

      // O-Series Reasoning Effort
      if (isOSeries) {
        body.reasoningEffort = config.reasoningEffort;
      } else {
        body.temperature = config.temperature;
      }

      // Advanced Params for all OpenAI models (using v1/responses)
      if (isOpenAI) {
        if (config.responseFormat) body.responseFormat = config.responseFormat;
        
        // Verbosity
        if (modelInfo.supportsVerbosity) {
            body.verbosity = config.verbosity;
        }

        // Reasoning summary
        if (isOSeries && config.reasoningSummary) body.reasoningSummary = config.reasoningSummary;
        
        if (config.store !== undefined) body.store = config.store;
        if (config.include) body.include = config.include;
        
        // Web Search / Tools
        if (config.webSearch) {
           body.tools = [{ type: modelId.includes('deep-research') ? "web_search_preview" : "web_search" }];
        }
      }

      if (isThisModelThinking && config.enableThinking) {
        if (config.maxTokens <= config.thinkingBudget) {
           throw new Error(`Max Tokens (${config.maxTokens}) must be greater than Thinking Budget (${config.thinkingBudget})`);
        }
        body.thinking = {
          type: 'enabled',
          budget_tokens: config.thinkingBudget
        };
        body.temperature = 1.0; 
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          ...body,
          webSearch: config.webSearch, // Pass webSearch to backend for Gemini
          codeExecution: config.codeExecution, // Pass codeExecution to backend
          urlContext: config.urlContext // Pass urlContext to backend
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = ''; // Buffer for incomplete SSE lines

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines only (lines ending with \n)
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              let content = '';

              if (parsed.type === 'response.completed' && parsed.response?.usage) {
                 // OpenAI v1/responses usage
                 const usage = parsed.response.usage;
                 const inputTokens = usage.input_tokens || 0;
                 // For O-series models, output_tokens includes reasoning tokens
                 // We need to use the total output_tokens for cost calculation
                 const outputTokens = usage.output_tokens || 0;

                 let cost = 0;
                 if (modelInfo.pricing) {
                    cost = (inputTokens * modelInfo.pricing.input + outputTokens * modelInfo.pricing.output) / 1000000;
                 }
                 console.log('[AI Playground] Usage received:', { inputTokens, outputTokens, cost, pricing: modelInfo.pricing });
                 setMetrics(prev => ({
                   ...prev,
                   [modelId]: {
                     ...prev[modelId],
                     usage: { input_tokens: inputTokens, output_tokens: outputTokens },
                     cost
                   }
                 }));
              } else if (parsed.type === 'message_start') {
                 // Anthropic usage (input tokens at start)
                 const usage = parsed.message?.usage;
                 if (usage) {
                   const inputTokens = usage.input_tokens || 0;
                   setMetrics(prev => ({
                     ...prev,
                     [modelId]: {
                       ...prev[modelId],
                       usage: { input_tokens: inputTokens, output_tokens: usage.output_tokens || 0 }
                     }
                   }));
                 }
              } else if (parsed.type === 'message_delta') {
                 // Anthropic cumulative usage (output tokens updated at end)
                 const usage = parsed.usage;
                 if (usage) {
                    const outputTokens = usage.output_tokens || 0;
                    setMetrics(prev => {
                      const inputTokens = prev[modelId]?.usage?.input_tokens || 0;
                      let cost = 0;
                      if (modelInfo.pricing) {
                         cost = (inputTokens * modelInfo.pricing.input + outputTokens * modelInfo.pricing.output) / 1000000;
                      }
                      return {
                        ...prev,
                        [modelId]: {
                          ...prev[modelId],
                          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
                          cost
                        }
                      };
                    });
                 }
              } else if (parsed.type === 'response.output_text.delta') {
                 // O1 / Responses API format
                 content = parsed.delta || '';
              } else if (isThisModelAnthropic) {
                 if (parsed.type === 'content_block_delta') {
                   // Only handle text deltas, silently skip thinking deltas
                   if (parsed.delta?.type === 'text_delta') {
                      content = parsed.delta?.text || '';
                   } 
                   // thinking_delta is ignored
                 }
              } else if (isThisModelGemini) {
                 const parts = parsed.candidates?.[0]?.content?.parts || [];
                 for (const part of parts) {
                    if (part.text) {
                       content += part.text;
                    } else if (part.executableCode) {
                       const { language, code } = part.executableCode;
                       content += `\n\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\n\n`;
                    } else if (part.codeExecutionResult) {
                       const { outcome, output } = part.codeExecutionResult;
                       content += `\n\n**Code Execution Result (${outcome})**:\n\`\`\`\n${output}\n\`\`\`\n\n`;
                    } else if (part.inlineData) {
                       // Handle image generation (multimodal)
                       const { mimeType, data } = part.inlineData;
                       content += `\n\n![Generated Image](data:${mimeType};base64,${data})\n\n`;
                    }
                 }
                 // Gemini usage
                 const usage = parsed.usageMetadata;
                 if (usage) {
                    const inputTokens = usage.promptTokenCount || 0;
                    const outputTokens = usage.candidatesTokenCount || 0;
                    let cost = 0;
                    if (modelInfo.pricing) {
                       cost = (inputTokens * modelInfo.pricing.input + outputTokens * modelInfo.pricing.output) / 1000000;
                    }
                    setMetrics(prev => ({
                      ...prev,
                      [modelId]: {
                        ...prev[modelId],
                        usage: { input_tokens: inputTokens, output_tokens: outputTokens },
                        cost
                      }
                    }));
                 }
              } else {
                 // OpenAI / OpenRouter (chat completions format)
                 content = parsed.choices?.[0]?.delta?.content || '';

                 // OpenAI usage (often in last chunk or if stream_options: { include_usage: true })
                 if (parsed.usage) {
                    const usage = parsed.usage;
                    const inputTokens = usage.prompt_tokens || 0;
                    const outputTokens = usage.completion_tokens || 0;
                    let cost = 0;
                    if (modelInfo.pricing) {
                       cost = (inputTokens * modelInfo.pricing.input + outputTokens * modelInfo.pricing.output) / 1000000;
                    }
                    setMetrics(prev => ({
                      ...prev,
                      [modelId]: {
                        ...prev[modelId],
                        usage: { input_tokens: inputTokens, output_tokens: outputTokens },
                        cost
                      }
                    }));
                 }
              }

              if (content) {
                fullContent += content;
                setResponses(prev => ({ ...prev, [modelId]: fullContent }));
              }
            } catch (parseError) {
              // Log parse errors for debugging - especially important for response.completed events
              if (data.includes('response.completed') || data.includes('usage')) {
                console.warn('[AI Playground] Failed to parse usage data:', data.substring(0, 500), parseError);
              } else {
                console.debug('[AI Playground] Parse error for line:', data.substring(0, 100));
              }
            }
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().slice(6).trim();
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'response.completed' && parsed.response?.usage) {
              const usage = parsed.response.usage;
              const inputTokens = usage.input_tokens || 0;
              const outputTokens = usage.output_tokens || 0;
              let cost = 0;
              if (modelInfo.pricing) {
                cost = (inputTokens * modelInfo.pricing.input + outputTokens * modelInfo.pricing.output) / 1000000;
              }
              console.log('[AI Playground] Usage from buffer:', { inputTokens, outputTokens, cost });
              setMetrics(prev => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  usage: { input_tokens: inputTokens, output_tokens: outputTokens },
                  cost
                }
              }));
            }
          } catch {
            // Ignore buffer parse errors
          }
        }
      }

      const totalTime = (Date.now() - startTime) / 1000;
      setMetrics(prev => {
        const current = prev[modelId];
        // Calculate cost if we have usage and pricing info
        let cost: number | undefined = current?.cost;
        if (current?.usage && modelInfo.pricing) {
          // Always recalculate to ensure accuracy
          const recalculatedCost = (current.usage.input_tokens * modelInfo.pricing.input + current.usage.output_tokens * modelInfo.pricing.output) / 1000000;
          cost = recalculatedCost;
        }
        console.log('[AI Playground] Final metrics:', { modelId, time: totalTime, usage: current?.usage, cost });
        return {
          ...prev,
          [modelId]: {
            ...current,
            time: totalTime,
            cost
          }
        };
      });

    } catch (err: unknown) {
      console.error(`Error generating for ${modelId}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setErrors(prev => ({ ...prev, [modelId]: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, [modelId]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModels.length === 0) return;
    if (!userPrompt.trim()) {
      alert('Please enter a prompt');
      return;
    }
    selectedModels.forEach(modelId => runModelGeneration(modelId));
  };

  const neededKeys = new Set(
    selectedModels.map(id => {
      const m = getModelInfo(id);
      return API_INTERFACES[m?.interface as ApiInterface]?.storageKey;
    }).filter(Boolean)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Left Column: Configuration (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
        
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Models</label>
              <MultiModelSelector 
                selectedModels={selectedModels}
                onSelectModels={setSelectedModels}
                apiKeys={apiKeys}
              />
            </div>

            {Array.from(neededKeys).map(storageKey => {
              const config = Object.values(API_INTERFACES).find(c => c.storageKey === storageKey);
              if (!config) return null;
              return (
                <div key={storageKey}>
                  <label className="block text-xs font-medium mb-1 text-gray-500 uppercase">
                    {config.name.split(' ')[0]} API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeys[storageKey] || ''}
                    onChange={(e) => handleApiKeyChange(storageKey, e.target.value)}
                    className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    placeholder={config.keyPlaceholder}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Per-Model Settings */}
        {selectedModels.map(modelId => {
          const config = modelConfigs[modelId] || DEFAULT_CONFIG;
          return (
            <ModelConfigCard
              key={modelId}
              modelId={modelId}
              config={config}
              updateConfig={(updates) => updateModelConfig(modelId, updates)}
            />
          );
        })}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Card>
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    System Prompt
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpandedField('system')}
                    className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Expand system prompt editor"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-y min-h-[60px]"
                  placeholder="System prompt..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    User Prompt
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpandedField('user')}
                    className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Expand user prompt editor"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none min-h-[100px]"
                  placeholder="Enter your prompt here..."
                  required
                />
              </div>
            </CardContent>
          </Card>

          <button
            type="submit"
            disabled={Object.values(loading).some(Boolean) || selectedModels.length === 0}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all transform active:scale-[0.99] ${
              Object.values(loading).some(Boolean) || selectedModels.length === 0
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20'
            }`}
          >
            {Object.values(loading).some(Boolean) ? 'Generating...' : `Generate with ${selectedModels.length} Models`}
          </button>
        </form>
      </div>

      {/* Right Column: Responses */}
      <div className="lg:col-span-8 h-full overflow-y-auto custom-scrollbar space-y-3">
        {selectedModels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-4xl mb-4">🤖</span>
            <p>Select models to start comparing</p>
          </div>
        ) : (
          selectedModels.map(modelId => {
            const model = getModelInfo(modelId);
            return (
              <div key={modelId}>
                <div className="mb-1 flex items-center gap-2 px-1">
                  <span className="text-lg">{model?.icon}</span>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {model?.name}
                  </h3>
                  <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {model?.id}
                  </span>
                </div>
                <ResponseDisplay
                  response={responses[modelId] || ''}
                  loading={loading[modelId]}
                  error={errors[modelId]}
                  responseTime={metrics[modelId]?.time}
                  usage={metrics[modelId]?.usage}
                  cost={metrics[modelId]?.cost}
                  wordCount={responses[modelId]?.trim().split(/\s+/).filter(w => w.length > 0).length || 0}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Prompt Expansion Modal */}
      <Modal 
        isOpen={!!expandedField} 
        onClose={() => setExpandedField(null)}
        size="xl"
        className="max-w-4xl"
      >
        <ModalHeader>
          <ModalTitle>Edit {expandedField === 'system' ? 'System' : 'User'} Prompt</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <textarea
            value={expandedField === 'system' ? systemPrompt : userPrompt}
            onChange={(e) => expandedField === 'system' ? setSystemPrompt(e.target.value) : setUserPrompt(e.target.value)}
            className="w-full h-[60vh] p-4 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-base focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none font-mono"
            placeholder={`Enter your ${expandedField} prompt here...`}
            autoFocus
          />
          <div className="flex justify-end pt-2">
             <button
                type="button"
                onClick={() => setExpandedField(null)}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
             >
                Done
             </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
