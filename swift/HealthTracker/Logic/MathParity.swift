import Foundation

/// JavaScript `Math.round` semantics: round half **up** (toward +∞), e.g. `round(2.5) = 3`,
/// `round(-0.5) = 0`. Swift's default `.rounded()` rounds ties away from zero, which differs
/// for negatives and exact halves — so every port of `Math.round(...)` uses this instead to
/// stay byte-for-byte faithful to the Expo utilities.
@inline(__always)
func jsRound(_ x: Double) -> Double {
    (x + 0.5).rounded(.down)
}

/// Integer-returning convenience for the many call sites that hand a rounded value straight
/// into an `Int` field (calories, XP, goals).
@inline(__always)
func jsRoundInt(_ x: Double) -> Int {
    Int(jsRound(x))
}
