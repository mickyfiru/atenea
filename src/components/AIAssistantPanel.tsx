import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius } from '../constants/theme';
import {
  AIAssistantIntent,
  ParsedAlertCommand,
  sendMessage,
} from '../services/ai/index';
import { speak } from '../services/voice/tts';
import { getAlertCategoryTone } from '../utils/alerts';
import { PrimaryButton } from './PrimaryButton';

type AIAssistantPanelProps = {
  onCreateAlertDraft?: (command: ParsedAlertCommand) => void;
  onIntent?: (intent: AIAssistantIntent, command?: ParsedAlertCommand) => void;
};

export function AIAssistantPanel({ onCreateAlertDraft, onIntent }: AIAssistantPanelProps) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [commandPreview, setCommandPreview] = useState<ParsedAlertCommand>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const prompt = input.trim();

    if (!prompt || loading) {
      return;
    }

    setLoading(true);
    setError('');
    setCommandPreview(undefined);

    try {
      const nextResponse = await sendMessage(prompt);
      const nextCommand = nextResponse.parsedCommand;

      setResponse(nextResponse.text);
      setCommandPreview(nextCommand);
      setInput('');
      await speak(getSpokenResponse(nextCommand));

      if (nextCommand?.intent === 'open_groups' || nextCommand?.intent === 'show_map') {
        onIntent?.(nextCommand.intent, nextCommand);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Atenea no pudo responder.');
    } finally {
      setLoading(false);
    }
  }

  const canCreateAlert = commandPreview?.intent === 'create_alert' && commandPreview.category;
  const isEmergency = commandPreview?.intent === 'call_emergency';
  const isNavigation = commandPreview?.intent === 'open_groups' || commandPreview?.intent === 'show_map';
  const isUnknown = commandPreview?.intent === 'unknown';
  const tone = commandPreview?.category ? getAlertCategoryTone(commandPreview.category) : undefined;
  const emergency = getEmergencyDisplay(commandPreview);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          <Text style={styles.title}>Atenea IA</Text>
        </View>
        <Text style={styles.badge}>Mock</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          editable={!loading}
          onChangeText={setInput}
          onSubmitEditing={submit}
          placeholder="Ej: Hay un accidente en avenida principal"
          placeholderTextColor={colors.muted}
          returnKeyType="send"
          style={styles.input}
          value={input}
        />
        <Pressable
          disabled={loading || !input.trim()}
          onPress={submit}
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
        >
          <Ionicons name="send-outline" size={19} color={colors.background} />
        </Pressable>
      </View>

      {response ? <Text style={styles.response}>{response}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {canCreateAlert && commandPreview ? (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: tone?.backgroundColor }]}>
              <Ionicons name={tone?.icon ?? 'alert-circle-outline'} size={18} color={tone?.color ?? colors.primary} />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>{commandPreview.title}</Text>
              <Text style={styles.previewMeta}>
                {commandPreview.category} · {Math.round(commandPreview.confidence * 100)}%
              </Text>
            </View>
          </View>
          <Text style={styles.previewDescription}>{commandPreview.description}</Text>
          <PrimaryButton
            label="Crear alerta"
            onPress={() => onCreateAlertDraft?.(commandPreview)}
            style={styles.previewButton}
          />
        </View>
      ) : null}

      {isEmergency && commandPreview ? (
        <View style={styles.intentCard}>
          <View style={styles.intentHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: emergency.backgroundColor }]}>
              <Ionicons name={emergency.icon} size={18} color={emergency.color} />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>{emergency.title}</Text>
              <Text style={styles.previewMeta}>Llamadas reales no activadas</Text>
            </View>
          </View>
          <Text style={styles.previewDescription}>
            Puedo abrir el grupo de emergencia para coordinar la alerta.
          </Text>
          <PrimaryButton
            label="Abrir grupo"
            onPress={() => onIntent?.(commandPreview.intent, commandPreview)}
            style={styles.previewButton}
            variant="light"
          />
        </View>
      ) : null}

      {isNavigation && commandPreview ? (
        <View style={styles.intentCard}>
          <View style={styles.intentHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons
                name={commandPreview.intent === 'show_map' ? 'map-outline' : 'people-outline'}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>
                {commandPreview.intent === 'show_map' ? 'Mapa de alertas' : 'Grupos comunitarios'}
              </Text>
              <Text style={styles.previewMeta}>Accion ejecutada</Text>
            </View>
          </View>
        </View>
      ) : null}

      {isUnknown ? (
        <View style={styles.unknownCard}>
          <Ionicons name="help-circle-outline" size={20} color={colors.muted} />
          <Text style={styles.unknownText}>
            No entendi el comando. Puedes decir: hay un accidente, llama a bomberos o abre grupos.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function getSpokenResponse(command?: ParsedAlertCommand) {
  switch (command?.intent) {
    case 'create_alert':
      return `Detect\u00e9 una posible alerta de ${command.category?.toLowerCase() ?? 'comunidad'}.`;
    case 'call_emergency':
      return 'Prepar\u00e9 el contacto de emergencia.';
    case 'open_groups':
      return 'Abriendo grupos.';
    case 'show_map':
      return 'Abriendo mapa.';
    case 'unknown':
    default:
      return 'No entend\u00ed el comando.';
  }
}

function getEmergencyDisplay(command?: ParsedAlertCommand) {
  switch (command?.emergencyGroupId) {
    case 'default-firefighters':
      return {
        title: 'Bomberos',
        icon: 'flame-outline' as const,
        color: colors.danger,
        backgroundColor: colors.dangerSoft,
      };
    case 'default-police':
      return {
        title: 'Carabineros',
        icon: 'shield-checkmark-outline' as const,
        color: colors.primary,
        backgroundColor: colors.primarySoft,
      };
    case 'default-ambulance':
      return {
        title: 'Ambulancia',
        icon: 'pulse-outline' as const,
        color: colors.success,
        backgroundColor: colors.successSoft,
      };
    default:
      return {
        title: 'Emergencia',
        icon: 'call-outline' as const,
        color: colors.danger,
        backgroundColor: colors.dangerSoft,
      };
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.soft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    marginTop: 18,
    padding: 14,
    width: '100%',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: '#DCE5F2',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  response: {
    color: '#263D5C',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  previewCard: {
    backgroundColor: colors.background,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  intentCard: {
    backgroundColor: colors.background,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  previewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  intentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  previewCopy: {
    flex: 1,
  },
  previewTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  previewMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  previewDescription: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  previewButton: {
    minHeight: 44,
  },
  unknownCard: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  unknownText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
