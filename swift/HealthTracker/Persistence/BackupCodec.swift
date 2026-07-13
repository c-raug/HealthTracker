import Foundation

/// Encodes/decodes the `BackupData` envelope — the Swift counterpart of the export/import halves of
/// `expo/storage/backupStorage.ts`. Pure and testable: no file or share-sheet concerns live here.
enum BackupCodec {
    enum BackupError: Error, LocalizedError {
        case invalidBackup

        var errorDescription: String? {
            "The selected file is not a valid HealthTracker backup."
        }
    }

    /// Snapshot of the persisted slices, sans `exportedAt` (stamped at encode time).
    struct Snapshot {
        var entries: [WeightEntry]
        var preferences: UserPreferences
        var nutritionLog: [DayNutrition]
        var customFoods: [CustomFood]
        var savedMeals: [SavedMeal]
        var activityLog: [DayActivity]
        var waterLog: [DayWater]
    }

    private static let timestampFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    /// Build the full envelope, stamping `exportedAt` with the current instant (like `new Date().toISOString()`).
    static func makeBackup(from snapshot: Snapshot, exportedAt: Date = Date()) -> BackupData {
        BackupData(
            entries: snapshot.entries,
            preferences: snapshot.preferences,
            nutritionLog: snapshot.nutritionLog,
            customFoods: snapshot.customFoods,
            savedMeals: snapshot.savedMeals,
            activityLog: snapshot.activityLog,
            waterLog: snapshot.waterLog,
            exportedAt: timestampFormatter.string(from: exportedAt)
        )
    }

    /// Pretty-printed JSON for the share-sheet export (`saveBackup`).
    static func encodePretty(_ snapshot: Snapshot) throws -> Data {
        try JSONStore.prettyEncoder.encode(makeBackup(from: snapshot))
    }

    /// Compact JSON for the silent auto-backup file (`writeAutoBackup`).
    static func encodeCompact(_ snapshot: Snapshot) throws -> Data {
        try JSONStore.encoder.encode(makeBackup(from: snapshot))
    }

    /// Decode + validate an imported backup. Throws `.invalidBackup` when a required key is missing
    /// or the JSON is malformed, reproducing `validateBackupData` in the Expo app.
    static func decode(_ data: Data) throws -> BackupData {
        do {
            return try JSONStore.decoder.decode(BackupData.self, from: data)
        } catch {
            throw BackupError.invalidBackup
        }
    }
}
