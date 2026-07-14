import SwiftUI
import PhotosUI

/// Edit Profile sub-screen — port of `expo/app/profile-modal.tsx`: an avatar section (PhotosPicker →
/// copy to Documents; remove), then Name / DOB / Sex / Height / Activity Mode (with info) / Activity
/// Level (Auto only). Save is disabled until something changes; the back button guards unsaved
/// changes. Form logic lives in the pure `ProfileEditLogic`.
struct EditProfileView: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var snapshot: ProfileEditLogic.Snapshot
    @State private var initial: ProfileEditLogic.Snapshot
    @State private var avatarUri: String?

    @State private var showDobPicker = false
    @State private var photoItem: PhotosPickerItem?
    @State private var showAvatarActions = false
    @State private var info: InfoContent?
    @State private var invalidHeightAlert = false
    @State private var showDiscard = false

    init() {
        // Seeded in `.onAppear` from the store (SwiftUI needs a value here; the real seed reads the
        // environment which isn't available in `init`). Placeholder empty snapshot.
        let empty = ProfileEditLogic.Snapshot(
            name: "", dob: nil, sex: .male, heightFt: "", heightIn: "", heightCm: "",
            activityMode: .auto, activityLevel: .moderatelyActive
        )
        _snapshot = State(initialValue: empty)
        _initial = State(initialValue: empty)
        _avatarUri = State(initialValue: nil)
    }

    private var isImperial: Bool { store.preferences.unit == .lbs }
    private var hasChanges: Bool { ProfileEditLogic.hasChanges(snapshot, from: initial) }

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.sm) {
                avatarSection
                nameCard
                dobCard
                sexCard
                heightCard
                activityModeCard
                if snapshot.activityMode == .auto { activityLevelCard }
                saveCard
            }
            .padding(Spacing.md)
        }
        .pillBottomClearance()
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button { attemptBack() } label: {
                    Image(systemName: "chevron.left").font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(colors.text)
                }
            }
        }
        .onAppear(perform: seed)
        .sheet(isPresented: $showDobPicker) { dobPickerSheet }
        .infoSheet($info)
        .photosPicker(isPresented: $showPhotoPicker, selection: $photoItem, matching: .images)
        .onChange(of: photoItem) { _, item in Task { await loadPhoto(item) } }
        .confirmationDialog("Profile Picture", isPresented: $showAvatarActions, titleVisibility: .visible) {
            Button("Choose Photo") { showPhotoPicker = true }
            if avatarUri != nil { Button("Remove Photo", role: .destructive) { removeAvatar() } }
            Button("Cancel", role: .cancel) {}
        }
        .alert("Invalid Height", isPresented: $invalidHeightAlert) {
            Button("OK", role: .cancel) {}
        } message: { Text("Please enter a valid height.") }
        .confirmationDialog("Discard changes?", isPresented: $showDiscard, titleVisibility: .visible) {
            Button("Discard", role: .destructive) { dismiss() }
            Button("Keep Editing", role: .cancel) {}
        } message: { Text("You have unsaved changes.") }
    }

    // MARK: - Seed

    private func seed() {
        let seeded = ProfileEditLogic.initialSnapshot(
            profile: store.preferences.profile,
            activityMode: store.preferences.activityMode ?? .auto
        )
        snapshot = seeded
        initial = seeded
        avatarUri = store.preferences.avatarUri
    }

    // MARK: - Avatar

    @State private var showPhotoPicker = false

    private var avatarSection: some View {
        VStack(spacing: Spacing.sm) {
            ZStack {
                Circle().fill(colors.background).frame(width: 120, height: 120)
                if let image = AvatarImage.load(avatarUri) {
                    Image(uiImage: image).resizable().scaledToFill()
                        .frame(width: 120, height: 120).clipShape(Circle())
                } else if let initials = HomeStats.initials(from: snapshot.name.isEmpty ? nil : snapshot.name) {
                    Text(initials).font(.system(size: 48, weight: .bold)).foregroundStyle(colors.primary)
                } else {
                    Image(systemName: "person").font(.system(size: 60)).foregroundStyle(colors.textSecondary)
                }
            }
            .frame(width: 120, height: 120)
            .clipShape(Circle())

            Button { showAvatarActions = true } label: {
                Text("Edit")
                    .font(Typography.small).fontWeight(.semibold).foregroundStyle(colors.primary)
                    .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.xs)
                    .overlay(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous).strokeBorder(colors.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, Spacing.md)
    }

    private func loadPhoto(_ item: PhotosPickerItem?) async {
        guard let item, let data = try? await item.loadTransferable(type: Data.self) else { return }
        let url = URL.documentsDirectory.appendingPathComponent("avatar.jpg")
        do {
            try data.write(to: url, options: .atomic)
            avatarUri = url.path
            store.setAvatar(url.path)
        } catch {
            // Best-effort: ignore write failures (avatar just stays unset).
        }
        photoItem = nil
    }

    private func removeAvatar() {
        if let avatarUri {
            let url = avatarUri.hasPrefix("file://")
                ? (URL(string: avatarUri) ?? URL(fileURLWithPath: avatarUri))
                : URL(fileURLWithPath: avatarUri)
            try? FileManager.default.removeItem(at: url)
        }
        avatarUri = nil
        store.setAvatar(nil)
    }

    // MARK: - Field cards

    private var nameCard: some View {
        SettingsCard {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                FieldLabel("Name (optional)")
                fieldInput("Your name", text: $snapshot.name, keyboard: .default, autocap: .words)
            }
            .padding(Spacing.md)
        }
    }

    private var dobCard: some View {
        SettingsCard {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                FieldLabel("Date of Birth")
                Button { showDobPicker = true } label: {
                    HStack {
                        Text(snapshot.dob.map(Self.formatDob) ?? "Select date of birth")
                            .font(Typography.body)
                            .foregroundStyle(snapshot.dob == nil ? colors.textSecondary : colors.text)
                        Spacer()
                    }
                    .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.sm)
                    .background(colors.background)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            .padding(Spacing.md)
        }
    }

    private var sexCard: some View {
        SettingsCard {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                FieldLabel("Sex")
                SettingsToggle(options: [(Sex.male, "Male"), (Sex.female, "Female")], selection: $snapshot.sex)
            }
            .padding(Spacing.md)
        }
    }

    private var heightCard: some View {
        SettingsCard {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                FieldLabel("Height")
                if isImperial {
                    HStack(spacing: Spacing.sm) {
                        fieldInput("ft", text: $snapshot.heightFt, keyboard: .numberPad)
                        fieldInput("in", text: $snapshot.heightIn, keyboard: .numberPad)
                    }
                } else {
                    fieldInput("cm", text: $snapshot.heightCm, keyboard: .decimalPad)
                }
            }
            .padding(Spacing.md)
        }
    }

    private var activityModeCard: some View {
        SettingsCard {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                FieldLabel("Activity Tracking Mode")
                ForEach(ActivityMode.allCases, id: \.self) { mode in
                    HStack(spacing: Spacing.sm) {
                        modePill(mode)
                        Button {
                            let i = ProfileEditLogic.modeInfo(mode)
                            info = InfoContent(title: i.title, description: i.description)
                        } label: {
                            Image(systemName: "info.circle").font(.system(size: 16)).foregroundStyle(colors.textSecondary)
                                .padding(Spacing.xs)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(Spacing.md)
        }
    }

    private func modePill(_ mode: ActivityMode) -> some View {
        let active = snapshot.activityMode == mode
        return Button {
            snapshot.activityMode = mode
            store.setActivityMode(mode)   // RN dispatches the mode change live
        } label: {
            Text(ProfileEditLogic.modeLabel(mode))
                .font(Typography.small).fontWeight(.semibold)
                .foregroundStyle(active ? colors.primary : colors.textSecondary)
                .frame(maxWidth: .infinity).padding(.vertical, Spacing.sm).padding(.horizontal, Spacing.md)
                .background(active ? colors.primaryLight : colors.background)
                .overlay(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).strokeBorder(active ? colors.primary : .clear, lineWidth: 1.5))
                .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private var activityLevelCard: some View {
        SettingsCard {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                FieldLabel("Activity Level")
                VStack(spacing: Spacing.xs) {
                    ForEach(OnboardingDraft.activityLabels, id: \.value) { item in
                        OptionButton(label: item.label, active: snapshot.activityLevel == item.value) {
                            snapshot.activityLevel = item.value
                        }
                    }
                }
            }
            .padding(Spacing.md)
        }
    }

    private var saveCard: some View {
        SettingsCard {
            Button(action: save) {
                Text("Save")
                    .font(Typography.bodyMedium).foregroundStyle(colors.primary)
                    .frame(maxWidth: .infinity).padding(.vertical, Spacing.sm)
                    .background(colors.primaryLight)
                    .overlay(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).strokeBorder(colors.primary, lineWidth: 1.5))
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                    .opacity(hasChanges ? 1 : 0.5)
            }
            .buttonStyle(.plain)
            .disabled(!hasChanges)
            .padding(Spacing.md)
        }
    }

    private func fieldInput(_ placeholder: String, text: Binding<String>, keyboard: UIKeyboardType = .default, autocap: TextInputAutocapitalization = .never) -> some View {
        TextField(placeholder, text: text)
            .font(Typography.body).foregroundStyle(colors.text)
            .keyboardType(keyboard)
            .textInputAutocapitalization(autocap)
            .autocorrectionDisabled()
            .padding(.horizontal, Spacing.md).padding(.vertical, Spacing.sm)
            .background(colors.background)
            .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
    }

    // MARK: - Actions

    private func attemptBack() {
        if hasChanges { showDiscard = true } else { dismiss() }
    }

    private func save() {
        guard let profile = ProfileEditLogic.makeProfile(
            from: snapshot, isImperial: isImperial, previous: store.preferences.profile
        ) else {
            invalidHeightAlert = true
            return
        }
        store.setProfile(profile)
        dismiss()
    }

    // MARK: - DOB picker (reuses the onboarding wheel pattern)

    private var dobPickerSheet: some View {
        NavigationStack {
            DatePicker("Date of Birth", selection: dobBinding, in: ...Self.maxDob, displayedComponents: .date)
                .datePickerStyle(.wheel)
                .labelsHidden()
                .padding()
                .frame(maxHeight: .infinity, alignment: .center)
                .navigationTitle("Date of Birth")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { showDobPicker = false }
                    }
                }
        }
        .presentationDetents([.medium])
    }

    private var dobBinding: Binding<Date> {
        Binding(
            get: { snapshot.dob.flatMap(Self.date(from:)) ?? Self.defaultDob },
            set: { snapshot.dob = Self.key(from: $0) }
        )
    }

    private static let keyFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    private static let displayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US")
        f.timeZone = .current
        f.dateFormat = "MMM d, yyyy"
        return f
    }()
    private static func date(from key: String) -> Date? { keyFormatter.date(from: key) }
    private static func key(from date: Date) -> String { keyFormatter.string(from: date) }
    private static func formatDob(_ key: String) -> String {
        date(from: key).map { displayFormatter.string(from: $0) } ?? key
    }
    private static var maxDob: Date { Calendar.current.date(byAdding: .year, value: -10, to: Date()) ?? Date() }
    private static var defaultDob: Date { Calendar.current.date(byAdding: .year, value: -30, to: Date()) ?? Date() }
}
