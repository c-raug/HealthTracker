# One-time Xcode project setup

Do this **once** on your Mac. It creates the `HealthTracker.xcodeproj` that builds the Swift
source in this folder. We use Xcode 16's **file-system-synchronized folder groups**, so any
`.swift` file added under `swift/HealthTracker/` is picked up automatically — the cloud agent can
keep adding source files and you never have to edit the project file.

## Steps

1. **Create the project**
   - Xcode ▸ File ▸ New ▸ Project… ▸ iOS ▸ **App** ▸ Next.
   - Product Name: **HealthTracker**
   - Organization Identifier: **com.healthtracker** → Bundle Identifier becomes
     `com.healthtracker.HealthTracker`. We'll override it below.
   - Interface: **SwiftUI**, Language: **Swift**, Storage: **None**, Testing: check
     **Include Tests**.
   - Save it **inside `swift/`** so the path is `swift/HealthTracker.xcodeproj`. If Xcode makes a
     nested `swift/HealthTracker/HealthTracker/` group, that's fine — see step 3.

2. **Set the deployment target & bundle id**
   - Project ▸ target **HealthTracker** ▸ **General** ▸ Minimum Deployments: **iOS 26.0**.
   - **Signing & Capabilities** ▸ set your Team (free personal team is fine).
   - Bundle Identifier: **`com.healthtracker.app.native`** (temporary; coexists with the Expo app).
   - **General ▸ Deployment Info**: iPhone only, Portrait only (uncheck landscape).

3. **Point the target at this folder's source**
   - Xcode's new-project template creates its own `HealthTracker/` source folder with
     `HealthTrackerApp.swift` and `ContentView.swift`. **Delete those two template files**
     (Move to Trash) and delete the template `Assets.xcassets` only if you want to use ours later.
   - In the Project navigator, right-click the target group ▸ **Add Files to "HealthTracker"…**
     and add the **`swift/HealthTracker/` folder** created by the agent as a
     **folder reference / synchronized group** (Xcode 16 shows "Create folder references"
     or auto-creates a synchronized group). All agent source now compiles.
   - Do the same for **`swift/HealthTrackerTests/`** under the test target (add its files).

   > Simpler alternative: when creating the project in step 1, choose the save location so the
   > template's source folder **is** `swift/HealthTracker/`, then let the agent's files land beside
   > the template ones and just delete the two template files. The key requirement is that
   > `swift/HealthTracker/**/*.swift` are members of the app target.

4. **Build & run**
   - Select your iPhone (or a Simulator) and press **⌘R**. You should see the **Design Gallery**.
   - Run tests with **⌘U** (tests arrive in Phase 2+).

## Notes
- If you prefer a spec-driven project, an `xcodegen` `project.yml` can be generated instead — tell
  the agent. The Xcode-created shell above is the recommended, most robust path.
- You only do this setup once. From here, each phase = the agent pushes source, you `git pull`,
  press ⌘R, and verify the checkpoint.
