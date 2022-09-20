import 'text-encoding';
import 'react-native-get-random-values';
import { StatusBar } from 'expo-status-bar';
import React, {useCallback, useEffect, useState} from 'react';
import { Platform, StyleSheet, Text, View, Pressable } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import jwt_decode from "jwt-decode";
import useAppState from './hooks/useAppState';
import CriiptoAuth, { PKCE } from '@criipto/auth-js';
import {decode, encode} from 'base-64';
import * as Crypto from 'expo-crypto';

if (!global.btoa) {
    global.btoa = encode;
}

if (!global.atob) {
    global.atob = decode;
}

const authority = "samples.criipto.io";
const protocol = "https";
const clientID = 'urn:criipto:samples:criipto-verify-expo';

const criiptoAuth = new CriiptoAuth({
  domain: authority,
  clientID: clientID,
  store: {} as any
});

interface Links {
  cancelUrl: string
  completeUrl: string
  launchLinks: {
    customFileHandlerUrl: string
    universalLink: string
  }
}

function base64URLEncode(input : Uint8Array | string) {
  input = typeof input === "string" ? input : String.fromCharCode(...input);
  return encode(input)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}


async function generatePKCE() : Promise<PKCE> {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const code_verifier = base64URLEncode(bytes);
  const code_challenge_method = 'S256';
  
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    code_verifier,
    {encoding: Crypto.CryptoEncoding.BASE64}
  );

  const code_challenge = digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return {code_verifier, code_challenge, code_challenge_method};
}

function proxyUrl(url : string) {
  return url.replace('https://localhost:44362', `${protocol}://${authority}`);
}

export default function App() {
  const redirectUri = Linking.createURL('/');
  const [result, setResult] = useState<WebBrowser.WebBrowserAuthSessionResult | null>(null);
  const [links, setLinks] = useState<Links | null>(null);
  const [pkce, setPKCE] = useState<PKCE | null>(null);
  const [pending, setPending] = useState(false);

  useAppState(async () => {
    console.log('onForeground', !!links);
    if (links) {
      handleBankID();
    }
  }, [links]);

  const handleBankID = async () => {
    setPending(true);

    const result : {location: string} = await fetch(proxyUrl(links!.completeUrl)).then(response => {
      return response.json();
    });

    const {queryParams} = Linking.parse(result.location); 
    if (queryParams) {
      await criiptoAuth.processResponse(queryParams, {
        code_verifier: pkce!.code_verifier,
        redirect_uri: redirectUri
      }).then(response => {
        setPending(false);
        if (response?.id_token) {
          setResult(jwt_decode(response.id_token));
          return;
        }
        setResult(response as any);
      }).catch(error => {
        setPending(false);
        setResult(error);
      });
    }
  }

  const reset = () => {
    setResult(null);
    setLinks(null);
    setPKCE(null);
    setPending(false);
  }

  useEffect(() => {
    criiptoAuth.fetchOpenIDConfiguration();

    Linking.getInitialURL().then(console.log);
  }, []);

  const handleUrl = useCallback(async (url) => {
    if (links) {
      handleBankID();
      return;
    }

    const {queryParams} = Linking.parse(url); 
    if (queryParams && queryParams.code || queryParams.error) {
      await criiptoAuth.processResponse(queryParams, {
        code_verifier: pkce!.code_verifier,
        redirect_uri: redirectUri
      }).then(response => {
        setPending(false);
        if (response?.id_token) {
          setResult(jwt_decode(response.id_token));
          return;
        }
        setResult(response as any);
      }).catch(error => {
        setPending(false);
        setResult(error);
      });
    }
  }, [pkce, redirectUri, criiptoAuth, links])

  useEffect(() => {
    const handler : Linking.URLListener = async (event) => {
      console.log('Linking.url.event', event.url);

      handleUrl(event.url);
    };
    Linking.addEventListener('url', handler);

    return () => Linking.removeEventListener('url', handler);
  }, [handleUrl]);

  const handleAuthenticateAppPress = async (acr: string) => {
    reset();
    setPending(true);

    const pkce = await generatePKCE();
    setPKCE(pkce);

    const url = await criiptoAuth.buildAuthorizeUrl(criiptoAuth.buildAuthorizeParams({
      redirectUri,
      responseMode: acr === 'urn:grn:authn:se:bankid:same-device' ? 'json' : 'query',
      responseType: 'code',
      pkce,
      acrValues: acr,
      loginHint: `appswitch:${Platform.OS}`
    }));

    console.log(url);

    if (acr === 'urn:grn:authn:se:bankid:same-device') {
      const result = await fetch(url).then(response => response.json()).catch(err => console.error(err)) as Links;
      setLinks(result);
      Linking.openURL(result.launchLinks.universalLink);
    } 
    else if (acr.startsWith('urn:grn:authn:dk:mitid')) {
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri, {
        createTask: true,
        showInRecents: true
      });

      console.log(result);
    }
    else {
      try {
        const result = await WebBrowser.openAuthSessionAsync(
          url,
          redirectUri
        );
          
        console.log(result);
      } catch (err) {
        console.log(err);
      }
    }
  }

  return (
    <View style={styles.container}>
      {pending ? (
        <Text>Pending ...</Text>
      ) : result ? (
        <React.Fragment>
          <Text>{result && JSON.stringify(result, null, 2)}</Text>
          <Pressable style={styles.button} onPress={() => reset()}>
            <Text style={styles.text}>Log out</Text>
          </Pressable>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Pressable style={styles.button} onPress={() => handleAuthenticateAppPress('urn:grn:authn:se:bankid:same-device')}>
            <Text style={styles.text}>Login with SEBankID</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => handleAuthenticateAppPress('urn:grn:authn:dk:mitid:low')}>
            <Text style={styles.text}>Login with DKMitID</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => handleAuthenticateAppPress('urn:grn:authn:no:bankid')}>
            <Text style={styles.text}>Login with NOBankID</Text>
          </Pressable>
        </React.Fragment>
      )}
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: '#183e4f',
    marginTop: 6,
    marginBottom: 6
  },
  text: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});
