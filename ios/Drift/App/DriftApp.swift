import SwiftUI

@main
struct DriftApp: App {
    @State private var authStore: AuthStore = {
        // UI tests launch with this flag so each test run starts from a known
        // signed-out state, since Keychain items can outlive an app reinstall.
        if AppEnvironment.isUITesting {
            KeychainStore.shared.token = nil
        }
        return AuthStore()
    }()
    @State private var eventStore = EventStore()
    @State private var profileStore = ProfileStore()

    var body: some Scene {
        WindowGroup {
            AppRootView()
                .environment(authStore)
                .environment(eventStore)
                .environment(profileStore)
        }
    }
}
