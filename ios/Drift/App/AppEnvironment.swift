import Foundation

enum AppEnvironment {
    // XCUITest's synthesized typing into a .newPassword field collides with
    // iOS's "Strong Password" AutoFill suggestion bar in the Simulator: only
    // the first character lands in the bound value. Real users typing by
    // hand aren't affected, so this is scoped to test runs only.
    static var isUITesting: Bool {
        ProcessInfo.processInfo.arguments.contains("-clearKeychainForTesting")
    }
}
