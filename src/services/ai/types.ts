import { AlertCategory } from '../../types/domain';

export type AIAssistantProviderName = 'deepseek' | 'ollama' | 'mock';

export type AIAssistantIntent =
  | 'create_alert'
  | 'open_groups'
  | 'show_map'
  | 'call_emergency'
  | 'unknown';

export type EmergencyGroupId =
  | 'default-police'
  | 'default-firefighters'
  | 'default-ambulance';

export type ParsedAlertCommand = {
  intent: AIAssistantIntent;
  category?: AlertCategory;
  title?: string;
  description?: string;
  emergencyGroupId?: EmergencyGroupId;
  confidence: number;
};

export type AIMessageContext = {
  sector?: string;
  userId?: string;
  recentAlerts?: unknown[];
  recentMessages?: unknown[];
};

export type AIMessageResponse = {
  text: string;
  parsedCommand?: ParsedAlertCommand;
};

export type AIAssistantProvider = {
  provider: AIAssistantProviderName;
  sendMessage: (prompt: string, context?: AIMessageContext) => Promise<AIMessageResponse>;
  parseAlertCommand: (text: string) => Promise<ParsedAlertCommand>;
};
