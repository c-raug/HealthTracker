# Mobile Development Preview

View the HealthTracker app live on your phone while developing — entirely from your phone, no Mac required.

## How it works

**GitHub Codespaces** runs the Expo development server in the cloud. **Expo's tunnel** (`--tunnel`) creates a public URL via ngrok so your phone can reach that server from anywhere. **Expo Go** (a free app) connects to that URL and renders the app natively.

---

## Prerequisites (one-time setup)

1. **GitHub account** with this repository pushed to it
2. **Expo Go** installed on your phone:
   - iOS: [App Store → Expo Go](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play → Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Starting a dev session (from your phone)

1. Open your phone browser and go to `github.com/[your-username]/HealthTracker`
2. Tap **Code** → **Codespaces** tab → **Create codespace on main**
   - If you have an existing Codespace, tap it to reopen it instead
3. The Codespace opens as a browser-based VS Code — wait ~30 seconds for it to finish setting up
4. Open the **Terminal** panel:
   - Tap the hamburger menu (☰) → **Terminal** → **New Terminal**, or
   - Swipe up from the bottom of the screen
5. In the terminal, run:
   ```bash
   npm run tunnel
   ```
6. Wait ~20–30 seconds. You'll see a QR code and a URL starting with `exp://`
7. Open **Expo Go** on your phone → tap **Scan QR Code** → point your camera at the QR code in the terminal
8. HealthTracker loads natively on your phone!

---

## Live development workflow

Once connected, development is seamless:

- **Claude makes a code change** → the app hot reloads on your phone automatically within a few seconds
- **Force a full reload**: press `r` in the Codespace terminal
- **Open JS debugger**: press `j` in the Codespace terminal
- **Show QR code again**: press `c` in the Codespace terminal

---

## Ending a session

1. Press `Ctrl+C` in the terminal to stop Expo
2. To pause billing, stop the Codespace:
   - Go to `github.com` → your profile photo → **Codespaces**
   - Click `...` next to your Codespace → **Stop codespace**

> **Free tier:** GitHub Free accounts get **60 core-hours/month** (roughly 60 hours on a standard 2-core Codespace). You will receive an email warning before you approach the limit.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| QR code won't scan | Press `c` in the terminal to redisplay it |
| App not updating after a change | Press `r` in terminal, or shake your phone → tap **Reload** |
| Tunnel is slow to start | Wait up to 60 seconds — ngrok can take a moment to initialise |
| `@expo/ngrok` not found error | Run `npm install` in the terminal first, then retry `npm run tunnel` |
| Codespace went to sleep | Go to github.com → Codespaces → reopen it, then run `npm run tunnel` again |
| "Something went wrong" in Expo Go | Stop Expo (`Ctrl+C`), run `npm run tunnel` again, rescan the QR code |
