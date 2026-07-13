import SwiftUI
import UniformTypeIdentifiers

/// Welcome screen — port of `expo/app/welcome.tsx`. First screen on a fresh install (shown by
/// `RootView` whenever `preferences.onboardingComplete != true`).
///
/// - **Start New Profile** pushes the 5-step `OnboardingView`.
/// - **Load Saved Data** opens the file importer, decodes an existing HealthTracker backup via
///   `store.importBackup(_:)`, and marks onboarding complete (mirrors the RN welcome, which always
///   shows this option since `backupExists()` is always true and stamps `onboardingComplete: true`).
/// - The **Design Gallery (dev)** link keeps the Phase-1 token layer reachable.
struct WelcomeView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    @State private var showingImporter = false
    @State private var importError: String?

    var body: some View {
        ZStack {
            colors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo + tagline
                VStack(spacing: Spacing.md) {
                    ZStack {
                        Circle()
                            .fill(colors.primaryLight)
                            .frame(width: 96, height: 96)
                        Image(systemName: "figure.run")
                            .font(.system(size: 44, weight: .semibold))
                            .foregroundStyle(colors.primary)
                    }
                    Text("HealthTracker")
                        .font(Typography.h1)
                        .foregroundStyle(colors.text)
                    Text("Track your weight, nutrition, and activity")
                        .font(Typography.body)
                        .foregroundStyle(colors.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.bottom, 48)

                Spacer()

                // Actions
                VStack(spacing: Spacing.sm) {
                    NavigationLink {
                        OnboardingView()
                    } label: {
                        Text("Start New Profile")
                            .font(Typography.bodyMedium)
                            .foregroundStyle(colors.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(colors.primary)
                            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                            .shadow(color: colors.primary.opacity(0.25), radius: 4, x: 0, y: 2)
                    }
                    .buttonStyle(.plain)

                    Button {
                        showingImporter = true
                    } label: {
                        Text("Load Saved Data")
                            .font(Typography.bodyMedium)
                            .foregroundStyle(colors.text)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(colors.card)
                            .clipShape(RoundedRectangle(cornerRadius: Radius.md, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: Radius.md, style: .continuous)
                                    .strokeBorder(colors.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        DesignGalleryView()
                            .background(colors.background.ignoresSafeArea())
                            .navigationTitle("Design Gallery")
                            .navigationBarTitleDisplayMode(.inline)
                    } label: {
                        Text("Design Gallery (dev)")
                            .font(Typography.small)
                            .foregroundStyle(colors.primary)
                    }
                    .padding(.top, Spacing.xs)
                }
            }
            .padding(.horizontal, Spacing.xl)
            .padding(.bottom, Spacing.xl)
        }
        .fileImporter(
            isPresented: $showingImporter,
            allowedContentTypes: [.json],
            allowsMultipleSelection: false
        ) { result in
            handleImport(result)
        }
        .alert("Couldn't Load Backup", isPresented: Binding(
            get: { importError != nil },
            set: { if !$0 { importError = nil } }
        )) {
            Button("OK", role: .cancel) { importError = nil }
        } message: {
            Text(importError ?? "")
        }
    }

    private func handleImport(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            let needsScope = url.startAccessingSecurityScopedResource()
            defer { if needsScope { url.stopAccessingSecurityScopedResource() } }
            do {
                let data = try Data(contentsOf: url)
                try store.importBackup(data)
                store.setOnboardingComplete()
            } catch {
                importError = error.localizedDescription
            }
        case .failure(let error):
            importError = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { WelcomeView() }
        .environment(AppTheme())
        .environment(AppStore())
        .environment(\.appColors, AppColors.resolve(scheme: .light, accentHex: nil))
}
