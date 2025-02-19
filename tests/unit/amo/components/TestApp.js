/* global window */
import * as React from 'react';
import { waitFor } from '@testing-library/react';

import App, { mapDispatchToProps, mapStateToProps } from 'amo/components/App';
import { getErrorComponent } from 'amo/components/ErrorPage';
import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import ServerErrorPage from 'amo/pages/ErrorPages/ServerErrorPage';
import {
  SET_CLIENT_APP,
  SET_USER_AGENT,
  setClientApp as setClientAppAction,
  setUserAgent as setUserAgentAction,
} from 'amo/reducers/api';
import {
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  INSTALL_STATE,
} from 'amo/constants';
import {
  dispatchClientMetadata,
  getElement,
  onLocationChanged,
  render as defaultRender,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;

    // window.scrollTo isn't provided by jsdom, so we need to mock it.
    window.scrollTo = jest.fn();
  });

  const render = (props = {}) => {
    return defaultRender(<App {...props} />, { store });
  };

  it('sets up a callback for setting add-on status', () => {
    const dispatch = jest.fn();
    const { handleGlobalEvent } = mapDispatchToProps(dispatch);
    const payload = { guid: '@my-addon', status: 'some-status' };

    handleGlobalEvent(payload);

    expect(dispatch).toHaveBeenCalledWith({ type: INSTALL_STATE, payload });
  });

  it('sets up a callback for setting the userAgentInfo', () => {
    const dispatch = jest.fn();
    const { setUserAgent } = mapDispatchToProps(dispatch);
    const userAgent = 'tofubrowser';

    setUserAgent(userAgent);

    expect(dispatch).toHaveBeenCalledWith(setUserAgentAction(userAgent));
  });

  it('sets up a callback for setting the clientApp', () => {
    const dispatch = jest.fn();
    const { setClientApp } = mapDispatchToProps(dispatch);
    const clientApp = CLIENT_APP_FIREFOX;

    setClientApp(clientApp);

    expect(dispatch).toHaveBeenCalledWith(setClientAppAction(clientApp));
  });

  it('sets the userAgent as props', () => {
    store.dispatch(setUserAgentAction('tofubrowser'));
    const { userAgent } = mapStateToProps(store.getState());
    expect(userAgent).toEqual('tofubrowser');
  });

  it('uses navigator.userAgent if userAgent prop is empty', () => {
    dispatchClientMetadata({ store, userAgent: '' });
    const _navigator = { userAgent: 'Firefox 10000000.0' };

    const dispatch = jest.spyOn(store, 'dispatch');

    render({ _navigator });

    expect(dispatch).toHaveBeenCalledWith(
      setUserAgentAction(_navigator.userAgent),
    );
  });

  it('resets the clientApp if it does not match the URL', () => {
    const currentClientApp = CLIENT_APP_FIREFOX;
    const clientAppInURL = CLIENT_APP_ANDROID;
    dispatchClientMetadata({ clientApp: currentClientApp, store });

    const dispatch = jest.spyOn(store, 'dispatch');

    render();

    store.dispatch(
      onLocationChanged({
        pathname: `/en-US/${clientAppInURL}/`,
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(setClientAppAction(clientAppInURL));
  });

  it('does not reset the clientApp if matches the URL', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    dispatchClientMetadata({ clientApp, store });

    const dispatch = jest.spyOn(store, 'dispatch');

    render();

    store.dispatch(
      onLocationChanged({
        pathname: `/en-US/${clientApp}/`,
      }),
    );

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: SET_CLIENT_APP }),
    );
  });

  it('does not reset the clientApp if the one on the URL is invalid', () => {
    dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX, store });

    const dispatch = jest.spyOn(store, 'dispatch');

    render();

    store.dispatch(
      onLocationChanged({
        pathname: '/en-US/invalid-app/',
      }),
    );

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: SET_CLIENT_APP }),
    );
  });

  it('ignores a falsey navigator', () => {
    dispatchClientMetadata({ store, userAgent: '' });
    const _navigator = null;

    const dispatch = jest.spyOn(store, 'dispatch');

    render({ _navigator });

    // This simulates a server side scenario where we do not have a user
    // agent and do not have a global navigator.
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: SET_USER_AGENT }),
    );
  });

  it('configures a default HTML title for Firefox', async () => {
    const lang = 'fr';
    dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      lang,
      store,
    });
    render();

    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(getElement('title')).toHaveTextContent(
      `Add-ons for Firefox (${lang})`,
    );
  });

  it('configures a default HTML title for Android', async () => {
    const lang = 'fr';
    dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
      lang,
      store,
    });
    render();

    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(getElement('title')).toHaveTextContent(
      `Add-ons for Firefox Android (${lang})`,
    );
  });

  describe('Tests for ErrorPage', () => {
    describe('getErrorComponent', () => {
      it('returns a NotAuthorizedPage component for 401 errors', () => {
        expect(getErrorComponent(401)).toEqual(NotAuthorizedPage);
      });

      it('returns a NotFoundPage component for 404 errors', () => {
        expect(getErrorComponent(404)).toEqual(NotFoundPage);
      });

      it('returns a ServerErrorPage component for 500 errors', () => {
        expect(getErrorComponent(500)).toEqual(ServerErrorPage);
      });

      it('returns a ServerErrorPage component by default', () => {
        expect(getErrorComponent(501)).toEqual(ServerErrorPage);
      });
    });
  });
});
