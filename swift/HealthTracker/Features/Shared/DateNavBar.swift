import SwiftUI

/// Shared date-navigation bar used by every data tab (Home / Weight / Nutrition / Activities).
/// Port of the `dateNav` row in `expo/app/(tabs)/*.tsx`:
/// ‹ back · center date (opens a graphical date picker, capped at today) · forward › ·
/// skip-to-today (only shown when not on today). Bound to the app-wide `store.selectedDate`
/// (`SET_SELECTED_DATE`), which is not persisted.
struct DateNavBar: View {
    @Environment(\.appColors) private var colors
    @Environment(AppStore.self) private var store

    @State private var showPicker = false

    private var today: String { Dates.getToday() }
    private var selected: String { store.selectedDate }
    private var isForwardDisabled: Bool { selected >= today }
    private var isToday: Bool { selected == today }

    var body: some View {
        HStack(spacing: 0) {
            Button { store.setSelectedDate(Dates.addDays(selected, -1)) } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 22))
                    .foregroundStyle(colors.primary)
                    .padding(Spacing.sm)
            }
            .buttonStyle(.plain)

            Button { showPicker = true } label: {
                HStack(spacing: Spacing.xs) {
                    Text(Dates.formatDisplayDate(selected))
                        .font(Typography.body.weight(.medium))
                        .foregroundStyle(colors.text)
                    Image(systemName: "calendar")
                        .font(.system(size: 16))
                        .foregroundStyle(colors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.sm)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            Button {
                let next = Dates.addDays(selected, 1)
                if next <= today { store.setSelectedDate(next) }
            } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 22))
                    .foregroundStyle(isForwardDisabled ? colors.border : colors.primary)
                    .padding(Spacing.sm)
            }
            .buttonStyle(.plain)
            .disabled(isForwardDisabled)

            if !isToday {
                Button { store.setSelectedDate(today) } label: {
                    Image(systemName: "forward.end")
                        .font(.system(size: 20))
                        .foregroundStyle(colors.primary)
                        .padding(Spacing.sm)
                }
                .buttonStyle(.plain)
            }
        }
        .background(
            LinearGradient(
                colors: (colors.isDark ? ["#3A3A3C", "#2C2C2E"] : ["#FFFFFF", "#F4F4F8"]).map { Color(hex: $0) },
                startPoint: .top, endPoint: .bottom
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
                .strokeBorder(colors.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 2)
        .sheet(isPresented: $showPicker) {
            DatePickerSheet(selected: selected, maxDate: today) { picked in
                store.setSelectedDate(picked)
            }
        }
    }
}

/// Graphical date picker in a bottom sheet, capped at today. Bridges the app's `"YYYY-MM-DD"`
/// keys to a `Date` for `DatePicker` and back.
private struct DatePickerSheet: View {
    @Environment(\.appColors) private var colors
    @Environment(\.dismiss) private var dismiss

    let selected: String
    let maxDate: String
    var onPick: (String) -> Void

    @State private var date: Date

    init(selected: String, maxDate: String, onPick: @escaping (String) -> Void) {
        self.selected = selected
        self.maxDate = maxDate
        self.onPick = onPick
        _date = State(initialValue: Self.date(from: selected) ?? Date())
    }

    var body: some View {
        NavigationStack {
            DatePicker(
                "Select date",
                selection: $date,
                in: ...(Self.date(from: maxDate) ?? Date()),
                displayedComponents: .date
            )
            .datePickerStyle(.graphical)
            .padding()
            .navigationTitle("Select Date")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        onPick(Self.key(from: date))
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private static let keyFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static func date(from key: String) -> Date? {
        keyFormatter.date(from: key)
    }

    private static func key(from date: Date) -> String {
        keyFormatter.string(from: date)
    }
}
