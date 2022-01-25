import { StatusBar } from 'expo-status-bar';
import React, {useState} from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import {Picker} from '@react-native-picker/picker';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import jwt_decode from "jwt-decode";
import useAppState from './hooks/useAppState';

const authority = "mick-mitid-test.criipto.io";
const protocol = "https";
const clientID = 'urn:application:example';
const device : 'android' | 'ios' = 'android';
const acr = 'urn:grn:authn:se:bankid:same-device';

interface Links {
  cancelUrl: string
  completeUrl: string
  launchLinks: {
    customFileHandlerUrl: string
    universalLink: string
  }
}

function proxyUrl(url : string) {
  return url.replace('https://localhost:44362', `${protocol}://${authority}`);
}

export default function App() {
  const [result, setResult] = useState<WebBrowser.WebBrowserAuthSessionResult | null>(null);
  const [links, setLinks] = useState<Links | null>(null);
  const appState = useAppState(async () => {
    if (acr === 'urn:grn:authn:se:bankid:same-device') {
      const result = await fetch(proxyUrl(links!.completeUrl)).then(response => {
        return response.headers.get('location');
      });

      const {queryParams} = Linking.parse(result!); 
      if (queryParams) {
        const {id_token} = queryParams;
        if (id_token) {
          setResult(jwt_decode(id_token));
          console.log(jwt_decode(id_token));
        }
      }
    }
  });

  const handleAuthenticateBrowserPress = async () => {
    const redirectUri = Linking.createURL('/');
    const url = `${protocol}://${authority}/oauth2/authorize?scope=openid&nonce=blah&client_id=${clientID}&redirect_uri=${redirectUri}&response_type=id_token&response_mode=query&nonce=ecnon&state=etats&acr_values=${acr}`;

    const result = await WebBrowser.openAuthSessionAsync(
      url,
      redirectUri,
      {
        showInRecents: true
      }
    );
    
    if (result.type === "success") {
      const {queryParams} = Linking.parse(result.url); 
      if (queryParams) {
        const {id_token} = queryParams;
        if (id_token) {
          setResult(jwt_decode(id_token));
        }
      }
    } else {
      setResult(result);
    }
  }

  const handleAuthenticateAppPress = async () => {
    const redirectUri = Linking.createURL('/');
    console.log(redirectUri);
    const url = `${protocol}://${authority}/oauth2/authorize?scope=openid&nonce=blah&client_id=${clientID}&redirect_uri=${redirectUri}&response_type=id_token&response_mode=query&nonce=ecnon&state=etats&acr_values=${acr}&login_hint=appswitch:${device}`;
    console.log(url);

    if (acr === 'urn:grn:authn:se:bankid:same-device') {
      const result = await fetch(url).then(response => response.json()).catch(err => console.error(err)) as Links;
      setLinks(result);
      Linking.openURL(result.launchLinks.customFileHandlerUrl);
    } else {
      const result = await WebBrowser.openAuthSessionAsync(
        url,
        redirectUri,
        {
          showInRecents: true
        }
      );

      console.log(result);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Redirect URI: {Linking.createURL('/')}</Text>
      <View style={styles.buttonContainer}>
        <Button
          onPress={handleAuthenticateBrowserPress}
          title="Authenticate via browser"
          color="#841584"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          onPress={handleAuthenticateAppPress}
          title="Authenticate via appswitch"
          color="#841584"
        />
      </View>
      <Text>{result && JSON.stringify(result)}</Text>
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
  buttonContainer: {
    marginBottom: 30
  }
});
