import SwiftUI

/// Send-feedback form — port of `expo/components/settings/FeedbackSection.tsx`. Posts the message to
/// the same Google Form endpoint via a URL-encoded `POST`, then shows a transient thank-you line.
/// Submit is disabled while empty or in flight.
struct FeedbackSectionView: View {
    @Environment(\.appColors) private var colors
    @FocusState private var focused: Bool

    @State private var message = ""
    @State private var submitting = false
    @State private var submitted = false
    @State private var errorMessage: String?

    private static let formURL = URL(string:
        "https://docs.google.com/forms/d/e/1FAIpQLSd9Ul_u4gcdkK5UI68Kak-3nO7DS8xIrFsIzFmszSvYlfljgw/formResponse")!
    private static let formEntry = "entry.1302979453"

    private var trimmed: String { message.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var canSubmit: Bool { !trimmed.isEmpty && !submitting }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SettingLabel("Send Feedback")
            SettingDescription("Have a suggestion or found a bug? We'd love to hear from you.")

            TextField("Write your feedback here…", text: $message, axis: .vertical)
                .font(Typography.body)
                .foregroundStyle(colors.text)
                .focused($focused)
                .lineLimit(4...8)
                .padding(Spacing.md)
                .background(colors.background)
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.sm, style: .continuous)
                        .strokeBorder(colors.border, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                .onChange(of: message) { _, _ in submitted = false }

            Button {
                Task { await submit() }
            } label: {
                Text(submitting ? "Sending…" : "Submit")
                    .font(Typography.bodyMedium)
                    .foregroundStyle(colors.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.sm)
                    .background(colors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
                    .opacity(canSubmit ? 1 : 0.5)
            }
            .buttonStyle(.plain)
            .disabled(!canSubmit)

            if submitted {
                Text("Thanks for your feedback!")
                    .font(Typography.small)
                    .italic()
                    .foregroundStyle(colors.primary)
                    .frame(maxWidth: .infinity)
            }
        }
        .alert("Error", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
            Button("OK", role: .cancel) { errorMessage = nil }
        } message: { Text(errorMessage ?? "") }
    }

    private func submit() async {
        guard canSubmit else { return }
        submitting = true
        defer { submitting = false }
        focused = false

        var request = URLRequest(url: Self.formURL)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        let encoded = trimmed.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? trimmed
        request.httpBody = "\(Self.formEntry)=\(encoded)".data(using: .utf8)

        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
                throw URLError(.badServerResponse)
            }
            message = ""
            submitted = true
            try? await Task.sleep(for: .seconds(4))
            submitted = false
        } catch {
            errorMessage = "Could not send feedback. Please try again later."
        }
    }
}
