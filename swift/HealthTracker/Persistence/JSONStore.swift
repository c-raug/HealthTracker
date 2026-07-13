import Foundation

/// Per-slice JSON file persistence — the Swift equivalent of `expo/storage/storage.ts`
/// (which keys 7 blobs into AsyncStorage). Each slice is written to its own `.json` file in the
/// app's Application Support directory; the auto-backup envelope lives in Documents.
///
/// Reads/writes are synchronous and best-effort: a missing or unreadable file yields `nil`, and
/// callers fall back to an empty slice (matching the RN `raw ? JSON.parse(raw) : []` pattern).
struct JSONStore: Sendable {
    /// The 7 persisted slices. Raw values are the exact AsyncStorage keys used by the Expo app,
    /// so the on-disk filenames stay recognizable across the migration.
    enum Slice: String, CaseIterable {
        case entries = "weight_entries"
        case preferences = "user_preferences"
        case nutritionLog = "nutrition_log"
        case customFoods = "custom_foods"
        case savedMeals = "saved_meals"
        case activityLog = "activity_log"
        case waterLog = "water_log"
    }

    static let backupFilename = "healthtracker-backup.json"

    let baseURL: URL
    let documentsURL: URL

    /// Default store: `Application Support/HealthTracker/` for slices, `Documents/` for the backup.
    init() {
        let fm = FileManager.default
        let appSupport = (try? fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true))
            ?? fm.temporaryDirectory
        let dir = appSupport.appendingPathComponent("HealthTracker", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        self.baseURL = dir
        self.documentsURL = (try? fm.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true))
            ?? dir
    }

    /// Injectable init for tests (both directories point at a scratch folder).
    init(baseURL: URL, documentsURL: URL) {
        self.baseURL = baseURL
        self.documentsURL = documentsURL
    }

    // MARK: - Codec config

    /// Compact encoder for slice files — matches `JSON.stringify(value)` (no whitespace).
    static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = []
        return e
    }()

    /// Pretty encoder for the human-portable backup export — matches `JSON.stringify(payload, null, 2)`.
    static let prettyEncoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = [.prettyPrinted]
        return e
    }()

    static let decoder = JSONDecoder()

    // MARK: - Slice IO

    func url(for slice: Slice) -> URL {
        baseURL.appendingPathComponent("\(slice.rawValue).json")
    }

    func load<T: Decodable>(_ type: T.Type, from slice: Slice) -> T? {
        guard let data = try? Data(contentsOf: url(for: slice)) else { return nil }
        return try? Self.decoder.decode(T.self, from: data)
    }

    /// Synchronous atomic write of already-encoded data. Encoding is done by the caller so it can
    /// happen on the main actor while the disk write is dispatched to a background queue.
    func write(_ data: Data, to slice: Slice) {
        try? data.write(to: url(for: slice), options: .atomic)
    }

    // MARK: - Backup file IO

    var backupURL: URL { documentsURL.appendingPathComponent(Self.backupFilename) }

    func writeBackupFile(_ data: Data) {
        try? data.write(to: backupURL, options: .atomic)
    }

    func readBackupFile() -> Data? {
        try? Data(contentsOf: backupURL)
    }
}
