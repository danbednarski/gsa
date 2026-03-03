/* SPDX-FileCopyrightText: 2025 Greenbone AG
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {useCallback, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import useGmp from 'web/hooks/useGmp';
import {renewSessionTimeout} from 'web/store/usersettings/actions';

// Renew session every 4 minutes to prevent server-side expiry (~15 min default)
const KEEPALIVE_INTERVAL_MS = 4 * 60 * 1000;

// Cooldown between user-activity-triggered renewals
const ACTIVITY_COOLDOWN_MS = 10_000;

/**
 * Hook that keeps the GMP session alive. Uses three strategies:
 *
 * 1. Periodic background keepalive (every 4 min) — prevents expiry even
 *    when the user is passively reading.
 * 2. User-activity-triggered renewal (clicks, keypress, wheel, drag) with
 *    a 10-second cooldown to avoid spamming the server.
 * 3. Visibility-change renewal — immediately renews when the tab regains
 *    focus (e.g. after laptop sleep/wake).
 */
const useSessionTracker = () => {
  const dispatch = useDispatch();
  const gmp = useGmp();

  const renewSession = useCallback(() => {
    // @ts-expect-error
    dispatch(renewSessionTimeout(gmp)());
  }, [dispatch, gmp]);

  useEffect(() => {
    // Renew immediately on mount
    renewSession();

    // --- 1. Background keepalive ---
    const keepaliveId = setInterval(renewSession, KEEPALIVE_INTERVAL_MS);

    // --- 2. User-activity-triggered renewal with cooldown ---
    let isCooldown = false;
    let cooldownTimeoutId: ReturnType<typeof setTimeout>;

    const handleUserActivity = () => {
      if (isCooldown) return;
      renewSession();
      isCooldown = true;
      cooldownTimeoutId = setTimeout(() => {
        isCooldown = false;
      }, ACTIVITY_COOLDOWN_MS);
    };

    const activityEvents = ['click', 'keypress', 'wheel', 'drag'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // --- 3. Visibility-change renewal (tab focus / laptop wake) ---
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        renewSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(keepaliveId);
      clearTimeout(cooldownTimeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [renewSession]);

  return renewSession;
};

export default useSessionTracker;
