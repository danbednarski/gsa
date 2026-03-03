/* SPDX-FileCopyrightText: 2024 Greenbone AG
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React from 'react';
import {ThemeProvider} from '@greenbone/ui-lib';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Provider as StoreProvider} from 'react-redux';
import Gmp from 'gmp/gmp';
import {_, initLocale} from 'gmp/locale/lang';
import {LOG_LEVEL_DEBUG} from 'gmp/log';
import Settings from 'gmp/settings';
import {isDefined} from 'gmp/utils/identity';
import {
  AUTO_LOGIN_USERNAME,
  AUTO_LOGIN_PASSWORD,
} from 'web/auto-login-credentials';
import ErrorBoundary from 'web/components/error/ErrorBoundary';
import GlobalStyles from 'web/components/layout/GlobalStyles';
import GmpContext from 'web/components/provider/GmpProvider';
import LanguageProvider from 'web/components/provider/LanguageProvider';
import Routes from 'web/Routes';
import configureStore from 'web/store';
import {clearStore} from 'web/store/actions';
import {
  setUsername,
  setTimezone,
  setIsLoggedIn,
  setSessionTimeout,
} from 'web/store/usersettings/actions';

void initLocale();
const queryClient = new QueryClient();

const settings = new Settings(global.localStorage, global.config);
const gmp = new Gmp(settings);

const store = configureStore({
  debug: isDefined(settings.enableStoreDebugLog)
    ? settings.enableStoreDebugLog
    : settings.logLevel === LOG_LEVEL_DEBUG,
});

// @ts-expect-error
window.gmp = gmp;

const initStore = async () => {
  // Auto-login as admin if not already logged in
  if (!gmp.isLoggedIn()) {
    try {
      const data = await gmp.login(AUTO_LOGIN_USERNAME, AUTO_LOGIN_PASSWORD);
      const {locale, timezone, sessionTimeout} = data;

      gmp.setTimezone(timezone);
      gmp.setLocale(locale);
      store.dispatch(setSessionTimeout(sessionTimeout));
      store.dispatch(setUsername(AUTO_LOGIN_USERNAME));
      store.dispatch(setTimezone(timezone));
      store.dispatch(setIsLoggedIn(true));
    } catch (error) {
      console.error('Auto-login failed:', error);
      // Still set logged in state to avoid redirect loops
      store.dispatch(setIsLoggedIn(false));
    }
  } else {
    // User already logged in, just sync the store
    const {timezone, username} = gmp.settings;

    if (isDefined(timezone)) {
      store.dispatch(setTimezone(timezone));
    }
    if (isDefined(username)) {
      store.dispatch(setUsername(username));
    }
    store.dispatch(setIsLoggedIn(true));
  }
};

class App extends React.Component<{}, {isInitializing: boolean}> {
  private unsubscribeFromLogout!: () => void;

  constructor(props: {}) {
    super(props);

    this.state = {
      isInitializing: true,
    };

    this.handleLogout = this.handleLogout.bind(this);
  }

  async componentDidMount() {
    this.unsubscribeFromLogout = gmp.subscribeToLogout(this.handleLogout);

    await initStore();
    this.setState({isInitializing: false});
  }

  componentWillUnmount() {
    if (isDefined(this.unsubscribeFromLogout)) {
      this.unsubscribeFromLogout();
    }
  }

  handleLogout() {
    // cleanup store
    clearStore(store.dispatch);
  }

  render() {
    const {isInitializing} = this.state;

    return (
      <ThemeProvider defaultColorScheme="light">
        <GlobalStyles />
        <ErrorBoundary message={_('An error occurred on this page')}>
          <GmpContext.Provider value={gmp}>
            <QueryClientProvider client={queryClient}>
              <StoreProvider store={store}>
                <LanguageProvider>
                  {isInitializing ? null : <Routes />}
                </LanguageProvider>
              </StoreProvider>
            </QueryClientProvider>
          </GmpContext.Provider>
        </ErrorBoundary>
      </ThemeProvider>
    );
  }
}

export default App;
