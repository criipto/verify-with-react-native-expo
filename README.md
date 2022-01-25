# Verify with React-Native (via Expo)

Install the Expo app on your phone:
- Android: https://play.google.com/store/apps/details?id=host.exp.exponent&hl=en&gl=US
- iOS: https://apps.apple.com/us/app/expo-go/id982107779

- Update dependencies with `npm install`
- Start project with `npm start`
- Make sure `authority` in `App.tsx` are correct.
- Scan the QR code from your Expo App.
- Make sure the Criipto Application has a callback that matches the callback URL displayed in the mobile app (something like `exp://192.168.18.3:19000/--/`)
- Press Authenticate

## WSL

You may need to:

- Start XWin
- Setup XAuth `DISPLAY=:0.0 xhost $(wsl hostname -I)`