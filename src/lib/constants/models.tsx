
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
  { id: 'o1', name: 'O1', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true },
  { id: 'o3-pro', name: 'O3 Pro', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true },
  { id: 'o3-mini', name: 'O3 Mini', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true },
  { id: 'o4-mini-deep-research', name: 'O4 Mini Deep Research', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true },
  { id: 'o4-mini', name: 'O4 Mini', interface: 'openai-api', icon: <BsCpu />, category: 'reasoning', outputTokenLimit: 65536, supportsReasoningEffort: true },
  
  // GPT-5
  { id: 'gpt-5-pro', name: 'GPT-5 Pro', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 16384, supportsReasoningEffort: true },
  { id: 'gpt-5-codex', name: 'GPT-5 Codex', interface: 'gpt-5', icon: <BsCodeSquare />, category: 'coding', outputTokenLimit: 16384, supportsReasoningEffort: true },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', interface: 'gpt-5', icon: <BsRobot />, category: 'fast', outputTokenLimit: 16384, supportsReasoningEffort: true, supportsVerbosity: true },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', interface: 'gpt-5', icon: <BsRobot />, category: 'fast', outputTokenLimit: 4096, supportsReasoningEffort: true, supportsVerbosity: true },
  { id: 'gpt-5.1', name: 'GPT-5.1', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 16384, supportsReasoningEffort: true, supportsVerbosity: true },
  { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex', interface: 'gpt-5', icon: <BsCodeSquare />, category: 'coding', outputTokenLimit: 16384, supportsReasoningEffort: true },
  
  // GPT-5.2 (Future)
  { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 16384 },
  // { id: 'gpt-5.2-thinking', name: 'GPT-5.2 Thinking', interface: 'gpt-5', icon: <BsRobot />, category: 'reasoning', outputTokenLimit: 32000, supportsThinking: true },
  // { id: 'gpt-5.2-instant', name: 'GPT-5.2 Instant', interface: 'gpt-5', icon: <BsRobot />, category: 'fast', outputTokenLimit: 4096 },
  { id: 'gpt-5.2', name: 'GPT-5.2', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 8192, supportsReasoningEffort: true, supportsVerbosity: true },
  
  { id: 'gpt-5', name: 'GPT-5', interface: 'gpt-5', icon: <BsRobot />, category: 'flagship', outputTokenLimit: 8192, supportsReasoningEffort: true, supportsVerbosity: true },

  // GPT-4 & 3.5
  { id: 'gpt-4.1', name: 'GPT-4.1', interface: 'openai-standard', icon: <SiOpenai />, category: 'flagship', outputTokenLimit: 4096 },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', interface: 'openai-standard', icon: <SiOpenai />, category: 'fast', outputTokenLimit: 16384 },
  { id: 'gpt-4o', name: 'GPT-4o', interface: 'openai-standard', icon: <SiOpenai />, category: 'flagship', outputTokenLimit: 4096 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', interface: 'openai-standard', icon: <SiOpenai />, category: 'fast', outputTokenLimit: 16384 },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', interface: 'openai-standard', icon: <SiOpenai />, category: 'flagship', outputTokenLimit: 4096 },
  { id: 'gpt-4', name: 'GPT-4', interface: 'openai-standard', icon: <SiOpenai />, category: 'flagship', outputTokenLimit: 4096 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', interface: 'openai-standard', icon: <SiOpenai />, category: 'fast', outputTokenLimit: 4096 },

  // --- Anthropic Models ---
  // Claude 4 (Opus/Sonnet Future)
  // { id: 'claude-opus-4.5', name: 'Claude Opus 4.5', interface: 'anthropic', icon: <SiAnthropic />, category: 'flagship', outputTokenLimit: 8192, supportsThinking: true },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', interface: 'claude-opus-4', icon: <BsLightningCharge />, category: 'flagship', outputTokenLimit: 4096, supportsThinking: true },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', interface: 'claude-opus-4', icon: <BsLightningCharge />, category: 'flagship', outputTokenLimit: 8192, supportsThinking: true },

  // Claude 3.7
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', interface: 'anthropic', icon: <SiAnthropic />, category: 'flagship', outputTokenLimit: 8192, supportsThinking: true },
  
  // Claude 3.5
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Latest)', interface: 'anthropic', icon: <SiAnthropic />, category: 'fast', outputTokenLimit: 8192 },

  // Claude 3
  { id: 'claude-3-opus-latest', name: 'Claude 3 Opus (Latest)', interface: 'anthropic', icon: <SiAnthropic />, category: 'flagship', outputTokenLimit: 4096 },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', interface: 'anthropic', icon: <SiAnthropic />, category: 'fast', outputTokenLimit: 4096 },

  // --- Google Gemini (Native) ---
  // Gemini 3
  // { id: 'models/gemini-3-pro', name: 'Gemini 3 Pro', interface: 'gemini-api', icon: <SiGoogle />, category: 'flagship', outputTokenLimit: 8192 },
  // { id: 'models/gemini-3-deepthink', name: 'Gemini 3 Deep Think', interface: 'gemini-api', icon: <RiSparklingFill />, category: 'reasoning', outputTokenLimit: 32000, supportsThinking: true },
  // { id: 'models/gemini-3', name: 'Gemini 3', interface: 'gemini-api', icon: <SiGoogle />, category: 'flagship', outputTokenLimit: 8192 },

  // Gemini 2.5
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', interface: 'gemini-api', icon: <SiGoogle />, category: 'flagship', outputTokenLimit: 8192 },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192 },

  // Gemini 2.0
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192 },
  { id: 'gemini-exp-1206', name: 'Gemini Exp 1206', interface: 'gemini-api', icon: <SiGoogle />, category: 'reasoning', outputTokenLimit: 8192 },

  // Gemini 1.5
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro (Latest)', interface: 'gemini-api', icon: <SiGoogle />, category: 'flagship', outputTokenLimit: 8192 },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash (Latest)', interface: 'gemini-api', icon: <SiGoogle />, category: 'fast', outputTokenLimit: 8192 },

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
