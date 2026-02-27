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

---

## Changelog — Codespace fixes

The following changes were made to get the Codespace workflow working correctly.

### Upgrade to Expo SDK 54 (for Expo Go 54 compatibility)

**Problem:** Expo Go only supports the SDK version it was built for. The project was on SDK 52 but the installed Expo Go app was version 54, causing a version mismatch error on launch.

**Fix:** Upgraded all Expo and React Native packages to their SDK 54 equivalents:

| Package | Before | After |
|---------|--------|-------|
| `expo` | ~52.0.0 | ~54.0.0 |
| `expo-router` | ~4.0.0 | ~6.0.0 |
| `react` | 18.3.1 | 19.1.0 |
| `react-native` | 0.76.3 | 0.81.5 |
| `expo-status-bar` | ~2.0.0 | ~3.0.9 |
| `@expo/vector-icons` | ^14.0.0 | ^15.0.0 |
| `react-native-safe-area-context` | 4.12.0 | ~5.7.0 |
| `react-native-screens` | ~4.4.0 | ~4.24.0 |
| `@react-native-async-storage/async-storage` | 2.1.0 | 3.0.1 |
| `react-native-svg` | 15.8.0 | ~15.15.3 |

New peer dependencies added for expo-router 6:
- `react-native-reanimated` ~3.16.7
- `react-native-gesture-handler` ~2.30.0

---

### Disable `typedRoutes` to fix tunnel crash

**Problem:** `expo-router` 4.0.22 does not expose `expo-router/internal/routing`, which the Expo 52 CLI requires when `typedRoutes` is enabled. This caused the tunnel to crash immediately on start inside the Codespace.

**Fix:** Set `typedRoutes: false` in `app.json` under `expo.experiments`. This stops Expo from running type generation at startup, allowing the tunnel to initialise cleanly.

---

### Use `npx expo` to resolve `expo: not found`

**Problem:** Running `npm run tunnel` (or any Expo script) in a fresh Codespace failed with `expo: not found` because the `expo` binary wasn't on the shell `PATH` after install.

**Fix:** Changed all `package.json` scripts to use `npx expo` instead of `expo` directly. `npx` resolves the locally installed binary without needing `node_modules/.bin` on `PATH`.

---

### Add `expo-asset` and forward Expo ports in Codespace

**Problem:** Expo 52 requires `expo-asset` as a dependency but it wasn't listed explicitly. Additionally, only port 8081 was forwarded in the Codespace, preventing the full Expo tunnel (which also uses ports 19000 and 19001) from working correctly.

**Fix:**
- Added `expo-asset ~10.0.0` as an explicit dependency in `package.json`.
- Added `npx expo install --fix` as a post-install step in `.devcontainer/devcontainer.json` to automatically correct any peer dependency version mismatches when the Codespace starts.
- Forwarded ports **19000** and **19001** alongside **8081** in `.devcontainer/devcontainer.json` so the full Expo tunnel can reach your phone.
