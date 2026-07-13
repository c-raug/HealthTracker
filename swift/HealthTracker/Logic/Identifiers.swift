import Foundation

/// Port of `expo/utils/generateId.ts`.
///
/// The Expo app hand-rolls a v4-shaped random string; the locked Swift decision (see
/// `CLAUDE.md`) is to use `UUID().uuidString.lowercased()` — same shape (`8-4-4-4-12`, version
/// `4`), lowercased to match. IDs are opaque and never parsed, so this is a safe substitution.
enum Identifiers {
    static func generate() -> String {
        UUID().uuidString.lowercased()
    }
}
