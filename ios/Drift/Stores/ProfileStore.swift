import Foundation
import Observation

// Full profile editing lands in M3 (ProfileView). For now this only owns
// what the forecast needs — mirrors js/state.js's settings-cache pattern:
// an instant local baseline, refreshed from the server in the background.
@Observable
final class ProfileStore {
    private static let bedtimeDefaultsKey = "drift.targetBedtime"

    private(set) var targetBedtime: String

    init() {
        targetBedtime = UserDefaults.standard.string(forKey: Self.bedtimeDefaultsKey) ?? "22:00"
    }

    @MainActor
    func load() async {
        guard let bedtime = try? await ProfileAPI.fetch() else { return }
        targetBedtime = bedtime
        UserDefaults.standard.set(bedtime, forKey: Self.bedtimeDefaultsKey)
    }
}
