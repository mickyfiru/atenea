import { AlertCategory } from '../../types/domain';
import { AIAssistantProvider, EmergencyGroupId, ParsedAlertCommand } from './types';

const OLLAMA_TIMEOUT_MS = 8000;
const ollamaBaseUrl = process.env.EXPO_PUBLIC_OLLAMA_BASE_URL;
const ollamaModel = process.env.EXPO_PUBLIC_OLLAMA_MODEL ?? 'llama3.1';

const validIntents = [
  'create_alert',
  'open_groups',
  'show_map',
  'call_emergency',
  'show_summary',
  'unknown',
] as const;
const validCategories: AlertCategory[] = ['Seguridad', 'Tr\u00e1nsito', 'Comunidad', 'Servicios'];
const validEmergencyGroupIds: EmergencyGroupId[] = [
  'default-firefighters',
  'default-police',
  'default-ambulance',
];

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error('Ollama respondio sin JSON valido.');
  }

  return match[0];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout?: () => void) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      onTimeout?.();
      reject(new Error('Ollama tardo mas de 8 segundos.'));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

async function sendOllamaPrompt(prompt: string) {
  if (!ollamaBaseUrl) {
    throw new Error('EXPO_PUBLIC_OLLAMA_BASE_URL no esta configurado.');
  }

  const controller = new AbortController();
  const response = await withTimeout(
    fetch(ollamaBaseUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ollamaModel,
        stream: false,
        format: 'json',
        messages: [
          {
            role: 'system',
            content: [
              'Eres Atenea, un clasificador de comandos comunitarios.',
              'Responde SOLO JSON valido, sin markdown y sin texto adicional.',
              'El JSON debe tener exactamente esta forma:',
              '{"intent":"create_alert|open_groups|show_map|call_emergency|show_summary|unknown","category":"Seguridad|Tránsito|Comunidad|Servicios","title":"string","description":"string","emergencyGroupId":"default-firefighters|default-police|default-ambulance","confidence":0.0}',
              'Si un campo no aplica, usa string vacio excepto confidence.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    }),
    OLLAMA_TIMEOUT_MS,
    () => controller.abort(),
  );

  if (!response.ok) {
    throw new Error(`Ollama respondio con HTTP ${response.status}.`);
  }

  const data = await response.json() as { message?: { content?: string } };
  const content = data.message?.content;

  if (!content) {
    throw new Error('Ollama respondio sin contenido.');
  }

  return content;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateParsedCommand(value: unknown): ParsedAlertCommand {
  const data = value as Partial<ParsedAlertCommand>;
  const intent = normalizeString(data.intent);

  if (!validIntents.includes(intent as ParsedAlertCommand['intent'])) {
    throw new Error('Ollama devolvio un intent invalido.');
  }

  const category = normalizeString(data.category);
  const emergencyGroupId = normalizeString(data.emergencyGroupId);
  const confidence = typeof data.confidence === 'number' && Number.isFinite(data.confidence)
    ? Math.max(0, Math.min(1, data.confidence))
    : 0.4;

  return {
    intent: intent as ParsedAlertCommand['intent'],
    category: validCategories.includes(category as AlertCategory)
      ? (category as AlertCategory)
      : undefined,
    title: normalizeString(data.title) || undefined,
    description: normalizeString(data.description) || undefined,
    emergencyGroupId: validEmergencyGroupIds.includes(emergencyGroupId as EmergencyGroupId)
      ? (emergencyGroupId as EmergencyGroupId)
      : undefined,
    confidence,
  };
}

function buildOllamaResponse(command: ParsedAlertCommand) {
  switch (command.intent) {
    case 'create_alert':
      return `Ollama detecto una posible alerta de ${command.category?.toLowerCase() ?? 'comunidad'}.`;
    case 'call_emergency':
      return 'Ollama preparo un contacto de emergencia.';
    case 'open_groups':
      return 'Ollama solicito abrir grupos.';
    case 'show_map':
      return 'Ollama solicito abrir el mapa.';
    case 'show_summary':
      return 'Ollama solicito resumir tu sector.';
    case 'unknown':
    default:
      return 'Ollama no pudo clasificar ese comando.';
  }
}

async function parseWithOllama(text: string) {
  const response = await sendOllamaPrompt([
    'Clasifica esta instruccion de Atenea:',
    text,
  ].join('\n'));

  return validateParsedCommand(JSON.parse(extractJson(response)));
}

export const ollamaProvider: AIAssistantProvider = {
  provider: 'ollama',
  async sendMessage(prompt) {
    const parsedCommand = await parseWithOllama(prompt);

    return {
      text: buildOllamaResponse(parsedCommand),
      parsedCommand,
    };
  },
  parseAlertCommand: parseWithOllama,
};
