import XCTest
@testable import Drift

@MainActor
final class ProfileStoreTests: XCTestCase {
    private var realClient: APIClient!
    private static let defaultsKey = "drift.profile"

    override func setUp() {
        super.setUp()
        MockURLProtocol.reset()
        realClient = APIClient.shared
        APIClient.shared = APIClient(session: MockURLProtocol.makeSession(), keychain: KeychainStore.shared)
        UserDefaults.standard.removeObject(forKey: Self.defaultsKey)
    }

    override func tearDown() {
        APIClient.shared = realClient
        UserDefaults.standard.removeObject(forKey: Self.defaultsKey)
        MockURLProtocol.reset()
        super.tearDown()
    }

    func testDefaultsToBedtime2200WithNoCache() {
        let store = ProfileStore()
        XCTAssertEqual(store.targetBedtime, "22:00")
    }

    func testLoadPopulatesFromServer() async {
        MockURLProtocol.requestHandler = { _ in
            .init(json: ["name": "Nathan", "target_bedtime": "23:30", "sex": NSNull(), "height": NSNull(), "height_unit": NSNull(), "weight": NSNull(), "weight_unit": NSNull()])
        }
        let store = ProfileStore()

        await store.load()

        XCTAssertEqual(store.profile.name, "Nathan")
        XCTAssertEqual(store.targetBedtime, "23:30")
    }

    func testLoadKeepsLocalBaselineOnFailure() async {
        MockURLProtocol.requestHandler = { _ in throw URLError(.notConnectedToInternet) }
        let store = ProfileStore()

        await store.load()

        XCTAssertEqual(store.targetBedtime, "22:00", "should fall back to the local baseline, not crash or clear state")
    }

    func testLoadWithNoProfileRowKeepsLocalBaseline() async {
        MockURLProtocol.requestHandler = { _ in .init(json: [String: Any]()) }
        let store = ProfileStore()

        await store.load()

        XCTAssertEqual(store.targetBedtime, "22:00")
    }

    func testSaveUpdatesLocalStateOptimistically() async {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }
        let store = ProfileStore()
        var updated = Profile()
        updated.name = "Nathan"
        updated.targetBedtime = "23:00"

        await store.save(updated)

        XCTAssertEqual(store.profile.name, "Nathan")
        XCTAssertEqual(store.targetBedtime, "23:00")
        XCTAssertNil(store.errorMessage)
    }

    func testSaveSurfacesErrorButKeepsLocalChange() async {
        MockURLProtocol.requestHandler = { _ in .init(statusCode: 500, json: ["error": "Server error"]) }
        let store = ProfileStore()
        var updated = Profile()
        updated.name = "Nathan"

        await store.save(updated)

        // Matches js/profile-page.js: local state (and cache) updates even
        // if the server call fails, so the UI doesn't silently discard it.
        XCTAssertEqual(store.profile.name, "Nathan")
        XCTAssertEqual(store.errorMessage, "Could not save your profile.")
    }

    func testSavePersistsToUserDefaultsCache() async {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }
        let store = ProfileStore()
        var updated = Profile()
        updated.targetBedtime = "21:15"
        await store.save(updated)

        let reloaded = ProfileStore()
        XCTAssertEqual(reloaded.targetBedtime, "21:15", "a fresh ProfileStore should read the cached value instantly")
    }
}
