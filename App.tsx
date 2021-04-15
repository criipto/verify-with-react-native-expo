import { StatusBar } from 'expo-status-bar';
import React, {useState} from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import jwt_decode from "jwt-decode";

const authority = "192.168.18.3:44362"; // CHANGE ME
const clientId = "https://localhost:44301/"; // CHANGE ME
const redirectUri = Linking.makeUrl('/');

export default function App() {
  const [result, setResult] = useState<WebBrowser.WebBrowserAuthSessionResult | null>(null);

  let handleAuthenticate = async (acr) => {
    const url = `https://${authority}/oauth2/authorize?scope=openid&nonce=blah&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&response_mode=query&nonce=ecnon&state=etats&acr_values=${acr}`;

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

  return (
    <View style={styles.container}>
      <Text>Redirect URL: {redirectUri}</Text>
      <View style={styles.buttonContainer}>
        <Button
          onPress={() => handleAuthenticate('urn:grn:authn:se:bankid:same-device')}
          title="Authenticate with SE Bank ID"
          color="#841584"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button

          onPress={() => handleAuthenticate('urn:grn:authn:dk:nemid:poces')}
          title="Authenticate with DK NemID"
          color="#841584"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          onPress={() => handleAuthenticate('urn:grn:authn:dk:mitid:low')}
          title="Authenticate with DK MitID"
          color="#841584"
        />
      </View>
      <Text>Result: {result && JSON.stringify(result)}</Text>
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
    margin: 10
  }
});
