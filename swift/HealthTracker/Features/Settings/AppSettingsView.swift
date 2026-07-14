import SwiftUI
import UIKit

/// App Settings sub-screen — port of `expo/app/app-settings-modal.tsx`: Weight Unit toggle, an
/// "Expand sections by default" toggle, Data Backup (share the full-state JSON), and Debug Info.
///
/// Phase 14: Debug Info now shows the last captured crash log (via `CrashReporter`) with **Copy** and
/// **Clear**, matching `expo/app/app-settings-modal.tsx`. See `CrashReporter` for the capture-scope
/// note (uncaught `NSException`s; local-only, like the RN utility before Sentry).
struct AppSettingsView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    @State private var shareItem: ShareItem?
    @State private var errorMessage: String?
    @State private var crashLog: String? = CrashReporter.formatted()
    @State private var showClearConfirm = false

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
                if let log = crashLog {
                    ScrollView {
                        Text(log)
                            .font(.system(.caption2, design: .monospaced))
                            .foregroundStyle(colors.danger)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .textSelection(.enabled)
                    }
                    .frame(maxHeight: 120)
                    .padding(Spacing.sm)
                    .background(colors.dangerLight)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))

                    HStack(spacing: Spacing.sm) {
                        Button("Copy") {
                            UIPasteboard.general.string = log
                        }
                        .font(Typography.small.weight(.semibold)).foregroundStyle(colors.primary)
                        Spacer()
                        Button("Clear") { showClearConfirm = true }
                            .font(Typography.small.weight(.semibold)).foregroundStyle(colors.danger)
                    }
                } else {
                    Text("No crash log on record.")
                        .font(Typography.small)
                        .foregroundStyle(colors.textSecondary)
                }
            }
            .padding(Spacing.md)
        }
        .confirmationDialog("Clear Log", isPresented: $showClearConfirm, titleVisibility: .visible) {
            Button("Clear", role: .destructive) { CrashReporter.clear(); crashLog = nil }
            Button("Cancel", role: .cancel) {}
        } message: { Text("Delete the stored crash log?") }
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
