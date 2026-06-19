import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertComposerModal } from '../components/AlertComposerModal';
import { AppHeader } from '../components/AppHeader';
import { AteneaOrb } from '../components/AteneaOrb';
import { QuickActionCard } from '../components/QuickActionCard';
import { colors, radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { subscribeUserGroups } from '../services/groups';
import { AlertCategory, CommunityGroup } from '../types/domain';

const suggestions = ['"What happened today?"', '"Call an ambulance"', '"Start recording"'];

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

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    return subscribeUserGroups(user.uid, setGroups, () => undefined);
  }, [user]);

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
          placeholder="Ask Atenea anything..."
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <View style={styles.micButton}>
          <Ionicons name="mic-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.sendButton}>
          <Ionicons name="paper-plane-outline" size={24} color={colors.background} />
        </View>
      </View>
      <AlertComposerModal
        groups={groups}
        initialCategory={alertCategory}
        onClose={() => setAlertComposerVisible(false)}
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
