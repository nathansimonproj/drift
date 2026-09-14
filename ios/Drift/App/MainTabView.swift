import SwiftUI

// Signed-in root: replaces the old single-scroll HomeView with a standard
// two-tab layout (Forecast = at-a-glance, Log = data entry). Owns only the
// one-time initial load — each tab is otherwise independent (own
// NavigationStack, own profile-sheet state).
struct MainTabView: View {
    @Environment(EventStore.self) private var eventStore
    @Environment(ProfileStore.self) private var profileStore

    var body: some View {
        TabView {
            ForecastView()
                .tabItem { Label("Forecast", systemImage: "moon.stars.fill") }
            LogView()
                .tabItem { Label("Log", systemImage: "list.bullet.clipboard") }
        }
        .toolbarBackground(DriftTheme.surface, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .task {
            await eventStore.load()
            await profileStore.load()
        }
    }
}

#Preview {
    MainTabView()
        .environment(AuthStore())
        .environment(EventStore())
        .environment(ProfileStore())
}
