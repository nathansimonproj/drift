import Foundation
import Observation

// Mirrors js/state.js's settings-cache pattern: an instant local baseline
// (UserDefaults standing in for localStorage), refreshed from /profile in
// the background, and saved optimistically (update local + UI immediately,
// fire the network call, matching js/profile-page.js's saveProfile()).
@Observable
final class ProfileStore {
    private static let defaultsKey = "drift.profile"

    private(set) var profile: Profile
    var isSaving = false
    var errorMessage: String?

    init() {
        profile = Self.readCache() ?? Profile()
    }

    /// Convenience used by the forecast, which only ever needs the bedtime.
    var targetBedtime: String { profile.targetBedtime }

    @MainActor
    func load() async {
        do {
            guard let fetched = try await ProfileAPI.fetch() else { return }
            profile = fetched
            Self.writeCache(fetched)
        } catch {
            // Keep the local baseline on failure — same resilience as the
            // web app's "always show something even if the network call
            // fails" load order.
        }
    }

    @MainActor
    func save(_ updated: Profile) async {
        profile = updated
        Self.writeCache(updated)
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            try await ProfileAPI.save(updated)
        } catch {
            errorMessage = "Could not save your profile."
        }
    }

    private static func readCache() -> Profile? {
        guard let data = UserDefaults.standard.data(forKey: defaultsKey) else { return nil }
        return try? JSONDecoder().decode(Profile.self, from: data)
    }

    private static func writeCache(_ profile: Profile) {
        guard let data = try? JSONEncoder().encode(profile) else { return }
        UserDefaults.standard.set(data, forKey: defaultsKey)
    }
}
