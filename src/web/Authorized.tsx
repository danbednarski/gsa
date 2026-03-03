/* SPDX-FileCopyrightText: 2024 Greenbone AG
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {useEffect, useCallback, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import logger from 'gmp/log';
import useGmp from 'web/hooks/useGmp';
import {
  setIsLoggedIn,
  setSessionTimeout,
  setTimezone,
  setUsername,
} from 'web/store/usersettings/actions';
import {isLoggedIn as selectIsLoggedIn} from 'web/store/usersettings/selectors';
import {AUTO_LOGIN_USERNAME, AUTO_LOGIN_PASSWORD} from 'web/autoLoginCredentials';

const log = logger.getLogger('web.authorized');

interface AuthorizedProps {
  children: React.ReactNode;
}

const Authorized = ({children}: AuthorizedProps) => {
  const gmp = useGmp();
  const dispatch = useDispatch();
  const isReauthenticating = useRef(false);

  const isLoggedIn = useSelector(selectIsLoggedIn);

  const logout = useCallback(() => {
    gmp.logout();
    dispatch(setIsLoggedIn(false));
  }, [dispatch, gmp]);

  const responseError = useCallback(
    async (xhr: XMLHttpRequest) => {
      if (xhr.status !== 401) return;

      // Prevent concurrent re-auth attempts
      if (isReauthenticating.current) return;
      isReauthenticating.current = true;

      try {
        log.debug('Session expired (401), attempting silent re-authentication');
        const data = await gmp.login(AUTO_LOGIN_USERNAME, AUTO_LOGIN_PASSWORD);
        const {timezone, sessionTimeout} = data;

        gmp.setTimezone(timezone);
        dispatch(setSessionTimeout(sessionTimeout));
        dispatch(setUsername(AUTO_LOGIN_USERNAME));
        dispatch(setTimezone(timezone));
        // Keep isLoggedIn true — user stays on current page
        log.debug('Silent re-authentication succeeded');
      } catch (error) {
        log.error('Silent re-authentication failed, logging out', error);
        logout();
      } finally {
        isReauthenticating.current = false;
      }
    },
    [dispatch, gmp, logout],
  );

  useEffect(() => {
    const unsubscribe = gmp.addHttpErrorHandler(responseError);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [gmp, responseError]);

  return isLoggedIn ? children : null;
};

export default Authorized;
