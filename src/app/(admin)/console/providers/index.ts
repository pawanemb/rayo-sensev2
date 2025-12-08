/**
 * AI Console - Provider Registry
 * Central registry for all AI providers
 */

import { AIProvider, ProviderClient, ProviderID } from './types';
import { OPENAI_PROVIDER, OpenAIClient } from './openai';
import { ANTHROPIC_PROVIDER, AnthropicClient } from './anthropic';

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

/**
 * All available providers configuration
 */
export const PROVIDERS: Record<ProviderID, AIProvider> = {
  openai: OPENAI_PROVIDER,
  anthropic: ANTHROPIC_PROVIDER,
  // Add more providers here as needed:
  // google: GOOGLE_PROVIDER,
  // mistral: MISTRAL_PROVIDER,
  // groq: GROQ_PROVIDER,
} as Record<ProviderID, AIProvider>;

/**
 * Provider client instances (lazy initialization)
 */
const providerClients: Partial<Record<ProviderID, ProviderClient>> = {};

/**
 * Get a provider client instance
 */
export function getProviderClient(providerId: ProviderID): ProviderClient {
  if (!providerClients[providerId]) {
    switch (providerId) {
      case 'openai':
        providerClients[providerId] = new OpenAIClient();
        break;
      case 'anthropic':
        providerClients[providerId] = new AnthropicClient();
        break;
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }
  }
  return providerClients[providerId]!;
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): AIProvider[] {
  return Object.values(PROVIDERS).filter((p) => p.isEnabled);
}

/**
 * Get provider by ID
 */
export function getProvider(providerId: ProviderID): AIProvider | undefined {
  return PROVIDERS[providerId];
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(providerId: ProviderID): string {
  const provider = PROVIDERS[providerId];
  if (!provider) return '';
  
  const defaultModel = provider.models.find((m) => m.isDefault);
  return defaultModel?.id || provider.models[0]?.id || '';
}

/**
 * Check if a provider is configured (has API key)
 */
export function isProviderConfigured(providerId: ProviderID): boolean {
  try {
    const client = getProviderClient(providerId);
    return client.isConfigured();
  } catch {
    return false;
  }
}

/**
 * Get all configured providers
 */
export function getConfiguredProviders(): AIProvider[] {
  return getAvailableProviders().filter((p) => 
    isProviderConfigured(p.id as ProviderID)
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from './types';
export { OPENAI_PROVIDER, OPENAI_MODELS } from './openai';
export { ANTHROPIC_PROVIDER, ANTHROPIC_MODELS } from './anthropic';
