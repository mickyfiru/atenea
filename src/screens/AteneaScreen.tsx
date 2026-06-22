import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertComposerModal } from '../components/AlertComposerModal';
import { AIAssistantPanel } from '../components/AIAssistantPanel';
import { AppHeader } from '../components/AppHeader';
import { AteneaOrb } from '../components/AteneaOrb';
import { QuickActionCard } from '../components/QuickActionCard';
import { colors, radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { AIAssistantIntent, ParsedAlertCommand } from '../services/ai/index';
import { parseCommand } from '../services/commands';
import { subscribeUserGroups } from '../services/groups';
import { AlertCategory, CommunityGroup } from '../types/domain';

const suggestions = ['"What happened today?"', '"Call an ambulance"', '"Start recording"'];
const helpResponse = `Puedo ayudarte con:

• Crear alertas
• Ver grupos
• Ver alertas
• Resumir tu sector
• Ver mapa
• Configurar sonidos
• Configurar ubicacion

Prueba escribiendo:

"crear alerta"
"ver grupos"
"resumir mi sector"`;
const unknownResponse = `Lo siento, todavia no entiendo esa instruccion.

Prueba escribiendo:

• crear alerta
• ver grupos
• ver alertas
• resumir mi sector
• ver mapa
• mi ubicacion`;

const quickActions = [
  {
    title: 'Emergency',
    subtitle: 'Report',
    icon: 'warning-outline' as const,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    category: 'Seguridad' as AlertCategory,
  },
  {
    title: 'Incident',
    subtitle: 'Report',
    icon: 'alert-circle-outline' as const,
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    category: 'Comunidad' as AlertCategory,
  },
  {
    title: 'Call 911',
    subtitle: 'Direct',
    icon: 'call-outline' as const,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  {
    title: 'Summarize',
    subtitle: 'My area',
    icon: 'document-text-outline' as const,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
  },
];

export function AteneaScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [alertCategory, setAlertCategory] = useState<AlertCategory>('Seguridad');
  const [alertComposerVisible, setAlertComposerVisible] = useState(false);
  const [alertDraft, setAlertDraft] = useState<ParsedAlertCommand>();
  const [commandText, setCommandText] = useState('');
  const [ateneaResponse, setAteneaResponse] = useState('');

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    return subscribeUserGroups(user.uid, setGroups, () => undefined);
  }, [user]);

  function handleSubmitCommand() {
    const parsedCommand = parseCommand(commandText);

    if (!commandText.trim()) {
      setAteneaResponse(unknownResponse);
      return;
    }

    setCommandText('');

    switch (parsedCommand.intent) {
      case 'CREATE_ALERT':
        setAlertCategory('Seguridad');
        setAlertComposerVisible(true);
        setAteneaResponse('');
        return;
      case 'OPEN_GROUPS':
        navigation.navigate('MainTabs', { screen: 'Groups' });
        setAteneaResponse('');
        return;
      case 'OPEN_ALERTS':
        navigation.navigate('Alerts');
        setAteneaResponse('');
        return;
      case 'OPEN_SUMMARY':
        navigation.navigate('Summary');
        setAteneaResponse('');
        return;
      case 'OPEN_MAP':
        navigation.navigate('Map');
        setAteneaResponse('');
        return;
      case 'OPEN_LOCATION':
        navigation.navigate('LocationSettings');
        setAteneaResponse('');
        return;
      case 'OPEN_SOUND_SETTINGS':
        navigation.navigate('SoundSettings');
        setAteneaResponse('');
        return;
      case 'OPEN_PROFILE':
        navigation.navigate('MainTabs', { screen: 'Profile' });
        setAteneaResponse('');
        return;
      case 'HELP':
        setAteneaResponse(helpResponse);
        return;
      case 'UNKNOWN':
        setAteneaResponse(unknownResponse);
        return;
    }
  }

  function handleAssistantIntent(intent: AIAssistantIntent) {
    switch (intent) {
      case 'open_groups':
        navigation.navigate('MainTabs', { screen: 'Groups' });
        return;
      case 'show_map':
        navigation.navigate('Map');
        return;
      case 'call_emergency':
        setAteneaResponse('Las llamadas reales todavia no estan activas.');
        return;
      case 'create_alert':
      case 'unknown':
        return;
    }
  }

  function handleCreateAlertDraft(command: ParsedAlertCommand) {
    setAlertDraft(command);
    setAlertCategory(command.category ?? 'Seguridad');
    setAteneaResponse('');
    setAlertComposerVisible(true);
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <AppHeader title="ATENEA" subtitle="Tue, Jun 17 - River District" aiBadge showBell />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AteneaOrb />

        <View style={styles.heroCopy}>
          <Text style={styles.question}>How can I help you?</Text>
          <Text style={styles.prompt}>Speak or type a command</Text>
        </View>

        <View style={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <View key={suggestion} style={styles.suggestionPill}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>

        {ateneaResponse ? (
          <View style={styles.responseCard}>
            <Text style={styles.responseText}>{ateneaResponse}</Text>
          </View>
        ) : null}

        <AIAssistantPanel
          onCreateAlertDraft={handleCreateAlertDraft}
          onIntent={handleAssistantIntent}
        />

        <View style={styles.quickBlock}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.title}
                title={action.title}
                subtitle={action.subtitle}
                icon={action.icon}
                color={action.color}
                backgroundColor={action.backgroundColor}
                onPress={() => {
                  if (action.category) {
                    setAlertDraft(undefined);
                    setAlertCategory(action.category);
                    setAlertComposerVisible(true);
                    return;
                  }

                  if (action.title === 'Summarize') {
                    navigation.navigate('Summary');
                  }
                }}
              />
            ))}
          </View>
        </View>

      </ScrollView>
      <View style={styles.inputBar}>
        <TextInput
          onChangeText={setCommandText}
          onSubmitEditing={handleSubmitCommand}
          placeholder="Ask Atenea anything..."
          placeholderTextColor={colors.muted}
          returnKeyType="send"
          style={styles.input}
          value={commandText}
        />
        <Pressable style={styles.micButton}>
          <Ionicons name="mic-outline" size={24} color={colors.primary} />
        </Pressable>
        <Pressable onPress={handleSubmitCommand} style={styles.sendButton}>
          <Ionicons name="paper-plane-outline" size={24} color={colors.background} />
        </Pressable>
      </View>
      <AlertComposerModal
        groups={groups}
        initialCategory={alertCategory}
        initialDescription={alertDraft?.description}
        initialGroupId={alertDraft?.emergencyGroupId}
        initialTitle={alertDraft?.title}
        onClose={() => {
          setAlertComposerVisible(false);
          setAlertDraft(undefined);
        }}
        userId={user?.uid}
        visible={alertComposerVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 222,
    paddingHorizontal: 24,
  },
  heroCopy: {
    alignItems: 'center',
    marginTop: -8,
  },
  question: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '900',
  },
  prompt: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: '500',
    marginTop: 8,
  },
  suggestions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  suggestionPill: {
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  suggestionText: {
    color: '#263D5C',
    fontSize: 14,
    fontWeight: '700',
  },
  responseCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    width: '100%',
  },
  responseText: {
    color: '#263D5C',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  quickBlock: {
    marginTop: 18,
    width: '100%',
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputBar: {
    alignItems: 'center',
    borderColor: '#DCE5F2',
    borderRadius: 22,
    borderWidth: 1.5,
    backgroundColor: colors.background,
    bottom: 82,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 16,
    position: 'absolute',
    left: 24,
    right: 24,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  micButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
});
