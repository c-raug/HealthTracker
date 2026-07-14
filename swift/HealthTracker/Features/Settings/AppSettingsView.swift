import SwiftUI

/// App Settings sub-screen — port of `expo/app/app-settings-modal.tsx`: Weight Unit toggle, an
/// "Expand sections by default" toggle, Data Backup (share the full-state JSON), and Debug Info.
///
/// Deferred vs RN: the RN Debug Info shows the last captured JS crash log (`crashReporting.ts` +
/// AsyncStorage). That crash-capture path has no Swift port yet, so this shows "No crash log on
/// record." until a native crash reporter lands.
struct AppSettingsView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    @State private var shareItem: ShareItem?
    @State private var errorMessage: String?

    private var unitBinding: Binding<WeightUnit> {
        Binding(get: { store.preferences.unit }, set: { store.setUnit($0) })
    }
    private var expandBinding: Binding<Bool> {
        Binding(get: { store.preferences.sectionsExpanded ?? false }, set: { store.setSectionsExpanded($0) })
    }

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.sm) {
                weightUnitCard
                expandSectionsCard
                dataBackupCard
                debugInfoCard
            }
            .padding(Spacing.md)
        }
        .pillBottomClearance()
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("App Settings")
        .navigationBarTitleDisplayMode(.large)
        .sheet(item: $shareItem) { item in ShareSheet(items: [item.url]) }
        .alert("Error", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
            Button("OK", role: .cancel) { errorMessage = nil }
        } message: { Text(errorMessage ?? "") }
    }

    // MARK: - Cards

    private var weightUnitCard: some View {
        SettingsCard {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                SettingLabel("Weight Unit")
                SettingDescription("Applies to new entries and the history chart. Existing entries keep their original unit.")
                SettingsToggle(
                    options: [(.lbs, "lbs"), (.kg, "kg")],
                    selection: unitBinding
                )
            }
            .padding(Spacing.md)
        }
    }

    private var expandSectionsCard: some View {
        SettingsCard {
            HStack(alignment: .top, spacing: Spacing.md) {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    SettingLabel("Expand sections by default")
                    SettingDescription("When on, meal categories start expanded on the Nutrition tab.")
                }
                SettingsToggle(
                    options: [(false, "Off"), (true, "On")],
                    selection: expandBinding
                )
                .frame(width: 110)
            }
            .padding(Spacing.md)
        }
    }

    private var dataBackupCard: some View {
        SettingsCard {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                SettingLabel("Data Backup")
                SettingDescription("Save all app data to a file that persists across reinstalls.")
                SettingsActionButton(title: "Save Data") { exportBackup() }
            }
            .padding(Spacing.md)
        }
    }

    private var debugInfoCard: some View {
        SettingsCard {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                SettingLabel("Debug Info")
                SettingDescription("Last recorded crash log. Share this when reporting a bug.")
                Text("No crash log on record.")
                    .font(Typography.small)
                    .foregroundStyle(colors.textSecondary)
            }
            .padding(Spacing.md)
        }
    }

    // MARK: - Actions

    private func exportBackup() {
        do {
            let data = try store.exportBackupData()
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("healthtracker-backup.json")
            try data.write(to: url, options: .atomic)
            shareItem = ShareItem(url: url)
        } catch {
            errorMessage = "Failed to save data."
        }
    }
}
