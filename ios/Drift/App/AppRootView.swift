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
        // Rounded system font design — SF Symbols automatically render in
        // their rounded glyph variant under this too, so this one modifier
        // covers both the "friendlier font" and "softer iconography" asks
        // without touching every individual Text/Image call site.
        .fontDesign(.rounded)
    }
}

#Preview {
    AppRootView().environment(AuthStore())
}
