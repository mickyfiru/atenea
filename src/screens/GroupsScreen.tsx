import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupRow } from '../components/GroupRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import { colors, radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { createGroup, joinGroupByCode, subscribeUserGroups } from '../services/groups';
import { CommunityGroup } from '../types/domain';

type GroupModalMode = 'create' | 'join' | undefined;

export function GroupsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<GroupModalMode>();
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const unsubscribe = subscribeUserGroups(
      user.uid,
      (nextGroups) => {
        setGroups(nextGroups);
        setError('');
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const emergencyGroups = useMemo(
    () => groups.filter((group) => group.type === 'emergency'),
    [groups],
  );
  const communityGroups = useMemo(
    () => groups.filter((group) => group.type === 'community'),
    [groups],
  );

  const closeModal = () => {
    if (saving) {
      return;
    }

    setInputValue('');
    setModalMode(undefined);
    setError('');
  };

  const submitModal = async () => {
    if (!user || !modalMode || saving) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const groupId =
        modalMode === 'create'
          ? await createGroup(user.uid, inputValue)
          : await joinGroupByCode(user.uid, inputValue);

      setInputValue('');
      setModalMode(undefined);
      navigation.navigate('Chat', { groupId });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos completar la accion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Groups</Text>
            <Text style={styles.subtitle}>River District community channels</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setModalMode('join')}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Ionicons name="enter-outline" size={22} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => setModalMode('create')}
              style={({ pressed }) => [styles.iconButton, styles.primaryIconButton, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={24} color={colors.background} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.helperText}>Cargando grupos...</Text>
          </View>
        ) : null}

        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

        <SectionCard title="Emergency groups" tone="danger">
          {emergencyGroups.length ? (
            emergencyGroups.map((group, index) => (
              <View key={group.id}>
                <GroupRow
                  group={group}
                  onPress={() => navigation.navigate('Chat', { groupId: group.id })}
                  showCall
                />
                {index < emergencyGroups.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Tus grupos predeterminados apareceran aqui.</Text>
          )}
        </SectionCard>

        <SectionCard title="My groups">
          {communityGroups.length ? (
            communityGroups.map((group, index) => (
              <View key={group.id}>
                <GroupRow group={group} onPress={() => navigation.navigate('Chat', { groupId: group.id })} />
                {index < communityGroups.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Crea un grupo o unete con un codigo de invitacion.</Text>
          )}
        </SectionCard>
      </ScrollView>

      <Modal animationType="fade" transparent visible={Boolean(modalMode)} onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'Crear grupo' : 'Unirse a grupo'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {modalMode === 'create'
                ? 'El grupo quedara asociado a tu cuenta y podras compartir el codigo del grupo.'
                : 'Ingresa el codigo de invitacion del grupo.'}
            </Text>
            <TextInput
              editable={!saving}
              onChangeText={setInputValue}
              placeholder={modalMode === 'create' ? 'Nombre del grupo' : 'Codigo del grupo'}
              placeholderTextColor={colors.muted}
              style={styles.modalInput}
              value={inputValue}
            />
            {error && modalMode ? <Text style={styles.modalError}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <PrimaryButton
                disabled={saving}
                label={saving ? 'Guardando...' : modalMode === 'create' ? 'Crear' : 'Unirme'}
                onPress={submitModal}
                style={styles.modalButton}
              />
              <PrimaryButton
                disabled={saving}
                label="Cancelar"
                onPress={closeModal}
                style={styles.modalButton}
                variant="light"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: 124,
    paddingHorizontal: 22,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 6,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  primaryIconButton: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.72,
  },
  loading: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  helperText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  separator: {
    backgroundColor: colors.line,
    height: 1,
    marginLeft: 94,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    padding: 22,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 20, 43, 0.38)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    gap: 14,
    padding: 22,
    width: '100%',
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  modalInput: {
    backgroundColor: colors.soft,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  modalError: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  modalActions: {
    gap: 10,
  },
  modalButton: {
    minHeight: 50,
  },
});
