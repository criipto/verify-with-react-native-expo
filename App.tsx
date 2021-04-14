import { StatusBar } from 'expo-status-bar';
import React, {useState} from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import jwt_decode from "jwt-decode";

const authority = "192.168.18.3:44362";

export default function App() {
  const [result, setResult] = useState<WebBrowser.WebBrowserAuthSessionResult | null>(null);

  Linking.addEventListener('url', function () {
    console.log(arguments);
  });

  let handleAuthenticatePress = async () => {
    const redirectUri = Linking.makeUrl('/');
    const acr = 'urn:grn:authn:se:bankid:same-device';
    const url = `https://${authority}/oauth2/authorize?scope=openid&nonce=blah&client_id=https://localhost:44301/&redirect_uri=${redirectUri}&response_type=id_token&response_mode=query&nonce=ecnon&state=etats&acr_values=${acr}`;

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
      <Button
        onPress={handleAuthenticatePress}
        title="Authenticate"
        color="#841584"
      />
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
});
