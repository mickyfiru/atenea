import { deepSeekProvider } from './deepseekProvider';
import { mockProvider } from './mockProvider';
import { ollamaProvider } from './ollamaProvider';
import {
  AIAssistantProvider,
  AIAssistantProviderName,
  AIMessageContext,
} from './types';

export * from './types';

const providers: Record<AIAssistantProviderName, AIAssistantProvider> = {
  deepseek: deepSeekProvider,
  ollama: ollamaProvider,
  mock: mockProvider,
};

function resolveProviderName(value?: string): AIAssistantProviderName {
  if (value === 'deepseek' || value === 'ollama' || value === 'mock') {
    return value;
  }

  return 'mock';
}

export function getAIAssistantProvider() {
  return providers[resolveProviderName(process.env.EXPO_PUBLIC_ATENEA_AI_COMMAND_PROVIDER)];
}

export function sendMessage(prompt: string, context?: AIMessageContext) {
  return getAIAssistantProvider().sendMessage(prompt, context);
}

export function parseAlertCommand(text: string) {
  return getAIAssistantProvider().parseAlertCommand(text);
}
