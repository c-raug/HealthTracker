import Foundation

/// Local crash-log capture — the Swift counterpart to `expo/utils/crashReporting.ts` +
/// `ErrorBoundary.componentDidCatch`. On launch we install an uncaught-exception handler that
/// persists the last crash (message + call stack + timestamp) to a JSON file in Application Support;
/// the App Settings → **Debug Info** card reads / copies / clears it on the next launch.
///
/// Parity note: RN's `ErrorBoundary` also renders a "Something went wrong" *fallback UI* after a JS
/// exception. SwiftUI has no in-process recovery from a view-body **trap** (the process is already
/// down), so there is no fallback screen — the durable, user-visible half (a shareable Debug-Info
/// crash log) is what we port. Like the RN utility, remote reporting (Sentry) is left as an optional
/// future add; this captures locally only. `NSSetUncaughtExceptionHandler` catches `NSException`s
/// (e.g. Foundation/UIKit exceptions); pure-Swift `fatalError`/precondition traps are signals a
/// fuller signal-handler reporter would add later.
enum CrashReporter {

    /// A recorded crash. Field names mirror the RN log object for a familiar Debug-Info payload.
    struct CrashLog: Codable {
        var message: String
        var stack: String
        var timestamp: String
    }

    private static var fileURL: URL {
        let fm = FileManager.default
        let appSupport = (try? fm.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true))
            ?? fm.temporaryDirectory
        let dir = appSupport.appendingPathComponent("HealthTracker", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("crash_log.json")
    }

    /// Install the uncaught-exception handler. Call once at app launch (idempotent per process).
    static func install() {
        NSSetUncaughtExceptionHandler { exception in
            let log = CrashLog(
                message: exception.reason ?? exception.name.rawValue,
                stack: exception.callStackSymbols.joined(separator: "\n"),
                timestamp: ISO8601DateFormatter().string(from: Date())
            )
            record(log)
        }
    }

    /// Persist a crash log (best-effort; never throws). Also used for manual capture points.
    static func record(_ log: CrashLog) {
        guard let data = try? JSONEncoder().encode(log) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }

    /// The last recorded crash, if any.
    static func lastLog() -> CrashLog? {
        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        return try? JSONDecoder().decode(CrashLog.self, from: data)
    }

    /// A human-readable rendering for the Debug-Info card + clipboard (RN copied the raw JSON string;
    /// here we show a compact, labelled form).
    static func formatted() -> String? {
        guard let log = lastLog() else { return nil }
        var lines = ["\(log.timestamp)", log.message]
        if !log.stack.isEmpty { lines.append("") ; lines.append(log.stack) }
        return lines.joined(separator: "\n")
    }

    /// Delete the stored crash log (Debug-Info "Clear").
    static func clear() {
        try? FileManager.default.removeItem(at: fileURL)
    }
}
