# ATENEA

## IA inicial

ATENEA incluye una base modular de IA en `src/services/ai/`.

- `mock`: proveedor activo por defecto. Permite probar comandos como `Hay un accidente en avenida principal` sin usar red ni llaves.
- `deepseek`: preparado para llamar a un backend propio mediante `EXPO_PUBLIC_DEEPSEEK_BACKEND_URL`.
- `ollama`: preparado para una instancia local compatible con `EXPO_PUBLIC_OLLAMA_BASE_URL`, por ejemplo `http://192.168.1.193:11434/api/chat`.

Para cambiar el proveedor de comandos:

```bash
EXPO_PUBLIC_ATENEA_AI_COMMAND_PROVIDER=mock
```

No pongas API keys reales de DeepSeek en el frontend. La integración segura debe pasar por un backend que proteja la llave, aplique cuotas y filtre datos sensibles.

## Voz

Text-to-Speech usa `expo-speech` desde `src/services/voice/tts.ts` con preferencia por `es-CL`. Speech-to-Text aun no está activo; `src/services/voice/listening.ts` deja la interfaz mock `startListening()` y `stopListening()` para conectar voz real más adelante.

## Prueba rápida

1. Abre Atenea.
2. En el panel `Atenea IA`, escribe: `Hay un accidente en avenida principal`.
3. Revisa la previsualización generada.
4. Usa `Crear alerta` para abrir el modal existente con los datos iniciales.
