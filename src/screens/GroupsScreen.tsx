import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupRow } from '../components/GroupRow';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../constants/theme';
import { communityGroups, emergencyGroups } from '../data/mockData';

export function GroupsScreen() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
          <Text style={styles.subtitle}>River District community channels</Text>
        </View>

        <SectionCard title="Emergency groups" tone="danger">
          {emergencyGroups.map((group, index) => (
            <View key={group.id}>
              <GroupRow group={group} showCall />
              {index < emergencyGroups.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </SectionCard>

        <SectionCard title="My groups">
          {communityGroups.map((group, index) => (
            <View key={group.id}>
              <GroupRow group={group} />
              {index < communityGroups.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </SectionCard>
      </ScrollView>
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
    marginBottom: 24,
    marginTop: 12,
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
  separator: {
    backgroundColor: colors.line,
    height: 1,
    marginLeft: 94,
  },
});
