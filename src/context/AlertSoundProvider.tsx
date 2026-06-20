import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from './AuthContext';
import { subscribeAlertsForGroups } from '../services/alerts';
import { subscribeUserGroups } from '../services/groups';
import { registerExpoPushToken, sendLocalAlertNotification } from '../services/notifications';
import { markAlertSoundHandled, wasAlertSoundHandled } from '../services/sounds';
import { CommunityAlert } from '../types/domain';

export function AlertSoundProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const groupIdsKey = useMemo(() => groupIds.join('|'), [groupIds]);
  const hydratedRef = useRef(false);
  const seenAlertIdsRef = useRef(new Set<string>());

  useEffect(() => {
    hydratedRef.current = false;
    seenAlertIdsRef.current.clear();
    setGroupIds([]);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void registerExpoPushToken(user.uid);
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    return subscribeUserGroups(
      user.uid,
      (groups) => {
        const nextGroupIds = groups.map((group) => group.id).sort();

        setGroupIds((currentGroupIds) => {
          const currentKey = currentGroupIds.join('|');
          const nextKey = nextGroupIds.join('|');

          return currentKey === nextKey ? currentGroupIds : nextGroupIds;
        });
      },
      (error) => console.warn('No se pudieron escuchar grupos para sonidos.', error),
    );
  }, [user]);

  useEffect(() => {
    const ids = groupIdsKey ? groupIdsKey.split('|') : [];
    hydratedRef.current = false;
    seenAlertIdsRef.current.clear();

    if (!user || !ids.length) {
      return undefined;
    }

    return subscribeAlertsForGroups(
      ids,
      (alerts) => handleIncomingAlerts(alerts),
      (error) => console.warn('No se pudieron escuchar alertas para sonidos.', error),
    );
  }, [groupIdsKey, user]);

  function handleIncomingAlerts(alerts: CommunityAlert[]) {
    if (!hydratedRef.current) {
      alerts.forEach((alert) => seenAlertIdsRef.current.add(alert.id));
      hydratedRef.current = true;
      return;
    }

    const newAlerts = alerts.filter((alert) => !seenAlertIdsRef.current.has(alert.id));
    newAlerts.forEach((alert) => seenAlertIdsRef.current.add(alert.id));

    newAlerts.slice(0, 3).forEach((alert) => {
      if (wasAlertSoundHandled(alert.id)) {
        return;
      }

      markAlertSoundHandled(alert.id);
      void sendLocalAlertNotification(alert);
    });
  }

  return <>{children}</>;
}
