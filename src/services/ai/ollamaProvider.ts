import { mockProvider } from './mockProvider';
import { AIAssistantProvider, ParsedAlertCommand } from './types';

const ollamaBaseUrl = process.env.EXPO_PUBLIC_OLLAMA_BASE_URL ?? 'http://192.168.1.193:11434/api/chat';
const ollamaModel = process.env.EXPO_PUBLIC_OLLAMA_MODEL ?? 'llama3.1';

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0] ?? text;
}

async function sendOllamaPrompt(prompt: string) {
  const response = await fetch(ollamaBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ollamaModel,
      stream: false,
      messages: [
        {
          role: 'system',
          content: 'Eres Atenea, asistente comunitaria. Responde en espanol chileno, breve y accionable.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Ollama no pudo responder en este momento.');
  }

  const data = await response.json() as { message?: { content?: string } };
  return data.message?.content ?? '';
}

export const ollamaProvider: AIAssistantProvider = {
  provider: 'ollama',
  async sendMessage(prompt, context) {
    const contextText = context ? `\nContexto: ${JSON.stringify(context)}` : '';
    const text = await sendOllamaPrompt(`${prompt}${contextText}`);

    return {
      text,
      parsedCommand: await mockProvider.parseAlertCommand(prompt),
    };
  },
  async parseAlertCommand(text) {
    try {
      const response = await sendOllamaPrompt([
        'Convierte esta instruccion a JSON estricto con esta forma:',
        '{"intent":"create_alert|open_groups|show_map|call_emergency|unknown","category":"Seguridad|Tránsito|Comunidad|Servicios","title":"string","description":"string","emergencyGroupId":"default-police|default-firefighters|default-ambulance","confidence":0.0}',
        `Instruccion: ${text}`,
      ].join('\n'));

      return JSON.parse(extractJson(response)) as ParsedAlertCommand;
    } catch (error) {
      console.warn('[ai] ollama parse fallback mock', error);
      return mockProvider.parseAlertCommand(text);
    }
  },
};
