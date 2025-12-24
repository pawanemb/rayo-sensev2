
import { SiOpenai, SiAnthropic, SiGoogle } from "react-icons/si";
import { BsRobot, BsCpu, BsLightningCharge, BsCodeSquare } from "react-icons/bs";
import { TbNetwork } from "react-icons/tb";

// API Provider/Interface configurations
export type ApiInterface = 
  | 'openai-api'      // O-Series models (o1, o3, o4-mini)
  | 'openai-standard' // GPT models (gpt-4o, gpt-4-turbo, gpt-3.5-turbo)
  | 'anthropic'       // Claude models
  | 'openrouter'      // 300+ models via OpenRouter
  | 'claude-opus-4'   // Claude Opus 4 specific
  | 'gpt-5'           // GPT-5 Responses API
  | 'gemini-api';     // Google Gemini Native API

export interface InterfaceConfig {
  id: ApiInterface;
  name: string;
  baseUrl: string;
  storageKey: string;
  keyPlaceholder: string;
  docsUrl: string;
  color: string;
  icon: React.ReactNode;
}

export interface ModelInfo {
  id: string;
  name: string;
  interface: ApiInterface;
  icon: React.ReactNode;
  category: 'reasoning' | 'flagship' | 'fast' | 'coding';
  outputTokenLimit?: number;
  supportsThinking?: boolean;
  supportsReasoningEffort?: boolean;
  supportsVerbosity?: boolean;
  pricing?: {
    input: number; // per 1M tokens in USD
    output: number; // per 1M tokens in USD
  };
}

export const API_INTERFACES: Record<ApiInterface, InterfaceConfig> = {
  'openai-api': {
    id: 'openai-api',
    name: 'OpenAI API (O-Series)',
    baseUrl: '/api/ai-playground/openai',
    storageKey: 'rayo_openai_api_key',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    color: '#0ea5e9',
    icon: <SiOpenai />
  },
  'openai-standard': {
    id: 'openai-standard',
    name: 'OpenAI Standard (GPT)',
    baseUrl: '/api/ai-playground/openai',
    storageKey: 'rayo_openai_api_key',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    color: '#10b981',
    icon: <SiOpenai />
  },
  'anthropic': {
    id: 'anthropic',
    name: 'Anthropic API',
    baseUrl: '/api/ai-playground/anthropic',
    storageKey: 'rayo_anthropic_api_key',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    color: '#f43f5e',
    icon: <SiAnthropic />
  },
  'openrouter': {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: '/api/ai-playground/openrouter',
    storageKey: 'rayo_openrouter_api_key',
    keyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
    color: '#8b5cf6',
    icon: <TbNetwork />
  },
  'claude-opus-4': {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    baseUrl: '/api/ai-playground/anthropic',
    storageKey: 'rayo_anthropic_api_key',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    color: '#a855f7',
    icon: <BsLightningCharge />
  },
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5 Responses',
    baseUrl: '/api/ai-playground/openai',
    storageKey: 'rayo_openai_api_key',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    color: '#ec4899',
    icon: <BsRobot />
  },
  'gemini-api': {
    id: 'gemini-api',
    name: 'Google Gemini API',
    baseUrl: '/api/ai-playground/gemini',
    storageKey: 'rayo_gemini_api_key',
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    color: '#4285F4',
    icon: <SiGoogle />
  }
};

// Available models organized by interface
export const AVAILABLE_MODELS: ModelInfo[] = [
  // --- OpenAI Models ---
  // Reasoning (O-Series)
  { id: 'o1', name: 'O1', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true, pricing: { input: 15, output: 60 } },
  { id: 'o1-pro', name: 'O1 Pro', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true, pricing: { input: 150, output: 600 } },
  { id: 'o3', name: 'O3', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true, pricing: { input: 2, output: 8 } },
  { id: 'o3-pro', name: 'O3 Pro', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true, pricing: { input: 20, output: 80 } },
  { id: 'o3-mini', name: 'O3 Mini', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true, pricing: { input: 1.1, output: 4.4 } },
  { id: 'o3-deep-research', name: 'O3 Deep Research', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true, pricing: { input: 10, output: 40 } },
  { id: 'o4-mini-deep-research', name: 'O4 Mini Deep Research', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true, pricing: { input: 2, output: 8 } },
  { id: 'o4-mini', name: 'O4 Mini', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true, pricing: { input: 1.10, output: 4.40 } },
  
  // GPT-5
  { id: 'gpt-5-pro', name: 'GPT-5 Pro', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 16384, supportsReasoningEffort: true, pricing: { input: 15, output: 120 } },
  { id: 'gpt-5-codex', name: 'GPT-5 Codex', interface: 'gpt-5', icon: <BsCodeSquare />, category: 'coding', outputTokenLimit: 16384, supportsReasoningEffort: true, pricing: { input: 1.25, output: 10 } },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', interface: 'gpt-5', icon: <BsRobot />, category: 'fast', outputTokenLimit: 16384, supportsReasoningEffort: true, supportsVerbosity: true, pricing: { input: 0.25, output: 2 } },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', interface: 'gpt-5', icon: <BsRobot />, category: 'fast', outputTokenLimit: 4096, supportsReasoningEffort: true, supportsVerbosity: true, pricing: { input: 0.05, output: 0.4 } },
  { id: 'gpt-5.1', name: 'GPT-5.1', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 16384, supportsReasoningEffort: true, supportsVerbosity: true, pricing: { input: 1.25, output: 10 } },
  { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex', interface: 'gpt-5', icon: <BsCodeSquare />, category: 'coding', outputTokenLimit: 16384, supportsReasoningEffort: true, pricing: { input: 1.25, output: 10 } },
  
  // GPT-5.2
  { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 16384, pricing: { input: 21, output: 168 } },
  { id: 'gpt-5.2', name: 'GPT-5.2', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 8192, supportsReasoningEffort: true, supportsVerbosity: true, pricing: { input: 1.75, output: 14 } },
  
  { id: 'gpt-5', name: 'GPT-5', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 8192, supportsReasoningEffort: true, supportsVerbosity: true, pricing: { input: 1.25, output: 10 } },

  // GPT-4 & 3.5
  { id: 'gpt-4.1', name: 'GPT-4.1', interface: 'openai-standard', icon: <SiOpenai />, category: 'flagship', outputTokenLimit: 4096, pricing: { input: 2, output: 8 } },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', interface: 'openai-standard', icon: <SiOpenai />, category: 'fast', outputTokenLimit: 16384, pricing: { input: 0.40, output: 1.60 } },
  { id: 'gpt-4.1-mini-2025-04-14', name: 'GPT-4.1 Mini (04-14)', interface: 'openai-standard', icon: <SiOpenai />, category: 'fast', outputTokenLimit: 16384, pricing: { input: 0.40, output: 1.60 } },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', interface: 'openai-standard', icon: <SiOpenai />, category: 'fast', outputTokenLimit: 4096, pricing: { input: 0.10, output: 0.40 } },
  { id: 'gpt-4o', name: 'GPT-4o', interface: 'openai-standard', icon: <SiOpenai />, category: 'flagship', outputTokenLimit: 4096, pricing: { input: 2.50, output: 10 } },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', interface: 'openai-standard', icon: <SiOpenai />, category: 'fast', outputTokenLimit: 16384, pricing: { input: 0.15, output: 0.60 } },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', interface: 'openai-standard', icon: <SiOpenai />, category: 'flagship', outputTokenLimit: 4096, pricing: { input: 10, output: 30 } },
  { id: 'gpt-4', name: 'GPT-4', interface: 'openai-standard', icon: <SiOpenai />, category: 'flagship', outputTokenLimit: 4096, pricing: { input: 30, output: 60 } },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', interface: 'openai-standard', icon: <SiOpenai />, category: 'fast', outputTokenLimit: 4096, pricing: { input: 0.5, output: 1.5 } },
  { id: 'gpt-3.5-turbo-0125', name: 'GPT-3.5 Turbo (0125)', interface: 'openai-standard', icon: <SiOpenai />, category: 'fast', outputTokenLimit: 4096, pricing: { input: 0.5, output: 1.5 } },

  // --- Anthropic Models ---
  // Claude 4 (Opus/Sonnet Future)
  // { id: 'claude-opus-4.5', name: 'Claude Opus 4.5', interface: 'anthropic', icon: <SiAnthropic />, category: 'flagship', outputTokenLimit: 8192, supportsThinking: true },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', interface: 'claude-opus-4', icon: <BsLightningCharge />, category: 'flagship', outputTokenLimit: 32000, supportsThinking: true, pricing: { input: 15, output: 75 } },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', interface: 'claude-opus-4', icon: <BsLightningCharge />, category: 'flagship', outputTokenLimit: 32000, supportsThinking: true, pricing: { input: 3, output: 15 } },

  // Claude 4.5
  { id: 'claude-opus-4-5-20251101', name: 'Claude 4.5 Opus', interface: 'anthropic', icon: <SiAnthropic />, category: 'flagship', outputTokenLimit: 64000, supportsThinking: true, pricing: { input: 5, output: 25 } },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude 4.5 Sonnet', interface: 'anthropic', icon: <SiAnthropic />, category: 'flagship', outputTokenLimit: 64000, supportsThinking: true, pricing: { input: 3, output: 15 } },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude 4.5 Haiku', interface: 'anthropic', icon: <SiAnthropic />, category: 'fast', outputTokenLimit: 64000, supportsThinking: true, pricing: { input: 1, output: 5 } },

  // Claude 3.7
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', interface: 'anthropic', icon: <SiAnthropic />, category: 'flagship', outputTokenLimit: 64000, supportsThinking: true, pricing: { input: 3, output: 15 } },
  
  // Claude 3.5
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', interface: 'anthropic', icon: <SiAnthropic />, category: 'fast', outputTokenLimit: 8192, supportsThinking: false, pricing: { input: 0.8, output: 4 } },

  // Claude 3
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', interface: 'anthropic', icon: <SiAnthropic />, category: 'flagship', outputTokenLimit: 4096, supportsThinking: false, pricing: { input: 15, output: 75 } },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', interface: 'anthropic', icon: <SiAnthropic />, category: 'fast', outputTokenLimit: 4096, supportsThinking: false, pricing: { input: 0.25, output: 1.25 } },

  // --- Google Gemini (Native) ---
  // Gemini 3
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)', interface: 'gemini-api', icon: <SiGoogle />, category: 'flagship', outputTokenLimit: 64000, supportsThinking: true, pricing: { input: 2, output: 12 } },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 64000, supportsThinking: true, pricing: { input: 0.50, output: 3 } },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (Preview)', interface: 'gemini-api', icon: <SiGoogle />, category: 'flagship', outputTokenLimit: 64000, pricing: { input: 2, output: 12 } },

  // Gemini 2.5
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', interface: 'gemini-api', icon: <SiGoogle />, category: 'flagship', outputTokenLimit: 8192, pricing: { input: 1.25, output: 10 }, supportsThinking: true },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192, pricing: { input: 0.30, output: 30 } },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192, pricing: { input: 0.30, output: 2.50 } },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192, pricing: { input: 0.10, output: 0.40 } },
  { id: 'gemini-2.5-computer-use-preview', name: 'Gemini 2.5 Computer Use', interface: 'gemini-api', icon: <SiGoogle />, category: 'reasoning', outputTokenLimit: 8192, pricing: { input: 1.25, output: 10 } },

  // Gemini 2.0
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192, pricing: { input: 0.10, output: 0.40 } },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192, pricing: { input: 0.075, output: 0.30 } },

  // Gemini 1.5
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro (Latest)', interface: 'gemini-api', icon: <SiGoogle />, category: 'flagship', outputTokenLimit: 8192, pricing: { input: 1.25, output: 10 } },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash (Latest)', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192, pricing: { input: 0.30, output: 2.50 } },

  // --- OpenRouter Models ---
  // OpenAI
  // { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', interface: 'openrouter', icon: <SiOpenai />, category: 'flagship', outputTokenLimit: 4096 },
  
  // Anthropic
  // { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)', interface: 'openrouter', icon: <SiAnthropic />, category: 'flagship', outputTokenLimit: 8192, supportsThinking: true },
  
  // Google
  // { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro (via OpenRouter)', interface: 'openrouter', icon: <SiGoogle />, category: 'flagship', outputTokenLimit: 8192 },
  // { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash (via OpenRouter)', interface: 'openrouter', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192 },
  // { id: 'google/gemini-flash-1.5-8b', name: 'Gemini 1.5 Flash 8B (via OpenRouter)', interface: 'openrouter', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192 },
  
  // Others
  // { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', interface: 'openrouter', icon: <SiMeta />, category: 'coding', outputTokenLimit: 4096 },
  // { id: 'mistralai/mistral-large', name: 'Mistral Large', interface: 'openrouter', icon: <TbNetwork />, category: 'reasoning', outputTokenLimit: 32000 },
  // { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', interface: 'openrouter', icon: <BsCodeSquare />, category: 'reasoning', outputTokenLimit: 8192 },
  // { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', interface: 'openrouter', icon: <BsCodeSquare />, category: 'coding', outputTokenLimit: 8192 },
];
