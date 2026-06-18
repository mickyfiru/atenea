import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius } from '../constants/theme';
import { ALERT_CATEGORIES, createAlert } from '../services/alerts';
import { AlertCategory, CommunityGroup } from '../types/domain';
import { getAlertCategoryTone } from '../utils/alerts';
import { PrimaryButton } from './PrimaryButton';

type AlertComposerModalProps = {
  groups: CommunityGroup[];
  initialCategory?: AlertCategory;
  onClose: () => void;
  userId?: string;
  visible: boolean;
};

export function AlertComposerModal({
  groups,
  initialCategory = 'Seguridad',
  onClose,
  userId,
  visible,
}: AlertComposerModalProps) {
  const [category, setCategory] = useState<AlertCategory>(initialCategory);
  const [groupId, setGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setCategory(initialCategory);
    }
  }, [initialCategory, visible]);

  const selectedGroupId = groupId || groups[0]?.id || '';

  const close = () => {
    if (saving) {
      return;
    }

    setError('');
    onClose();
  };

  const submit = async () => {
    if (!userId || saving) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await createAlert({
        userId,
        groupId: selectedGroupId,
        category,
        title,
        description,
      });
      setTitle('');
      setDescription('');
      setGroupId('');
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos crear la alerta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Crear alerta</Text>
          <Text style={styles.subtitle}>Selecciona categoria y grupo asociado.</Text>

          <View style={styles.categoryRow}>
            {ALERT_CATEGORIES.map((nextCategory) => {
              const tone = getAlertCategoryTone(nextCategory);
              const active = nextCategory === category;

              return (
                <Pressable
                  key={nextCategory}
                  onPress={() => setCategory(nextCategory)}
                  style={[
                    styles.categoryButton,
                    { backgroundColor: active ? tone.color : tone.backgroundColor },
                  ]}
                >
                  <Ionicons
                    name={tone.icon}
                    size={18}
                    color={active ? colors.background : tone.color}
                  />
                  <Text style={[styles.categoryText, { color: active ? colors.background : tone.color }]}>
                    {nextCategory}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroller}>
            {groups.map((group) => {
              const active = selectedGroupId === group.id;

              return (
                <Pressable
                  key={group.id}
                  onPress={() => setGroupId(group.id)}
                  style={[styles.groupChip, active && styles.groupChipActive]}
                >
                  <Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>
                    {group.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            editable={!saving}
            onChangeText={setTitle}
            placeholder="Titulo de la alerta"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={title}
          />
          <TextInput
            editable={!saving}
            multiline
            onChangeText={setDescription}
            placeholder="Descripcion"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textArea]}
            value={description}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <PrimaryButton
              disabled={saving || !userId || !groups.length}
              label={saving ? 'Guardando...' : 'Guardar alerta'}
              onPress={submit}
              style={styles.actionButton}
            />
            <PrimaryButton
              disabled={saving}
              label="Cancelar"
              onPress={close}
              style={styles.actionButton}
              variant="light"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 20, 43, 0.38)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    gap: 12,
    maxHeight: '88%',
    padding: 20,
    width: '100%',
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '900',
  },
  groupScroller: {
    flexGrow: 0,
  },
  groupChip: {
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  groupChipActive: {
    backgroundColor: colors.primary,
  },
  groupChipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  groupChipTextActive: {
    color: colors.background,
  },
  input: {
    backgroundColor: colors.soft,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    minHeight: 54,
    paddingHorizontal: 14,
  },
  textArea: {
    minHeight: 92,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    minHeight: 50,
  },
});
