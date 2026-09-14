import SwiftUI

struct AppRootView: View {
    @Environment(AuthStore.self) private var authStore

    var body: some View {
        Group {
            switch authStore.state {
            case .signedOut:
                AuthView()
            case .signedIn:
                MainTabView()
            }
        }
        // The web app ships one fixed dark theme regardless of system
        // preference (css/app.css has no prefers-color-scheme handling), so
        // match that here instead of following the device's light/dark mode.
        .preferredColorScheme(.dark)
        .tint(DriftTheme.accent)
    }
}

#Preview {
    AppRootView().environment(AuthStore())
}
