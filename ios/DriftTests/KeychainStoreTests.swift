import XCTest
@testable import Drift

final class KeychainStoreTests: XCTestCase {
    override func tearDown() {
        KeychainStore.shared.token = nil
        super.tearDown()
    }

    func testSaveReadDeleteRoundTrip() {
        let store = KeychainStore.shared
        store.token = nil
        XCTAssertNil(store.token)

        store.token = "test-token-123"
        XCTAssertEqual(store.token, "test-token-123")

        store.token = "replacement-token"
        XCTAssertEqual(store.token, "replacement-token")

        store.token = nil
        XCTAssertNil(store.token)
    }

    func testReadWithNothingStoredReturnsNil() {
        KeychainStore.shared.token = nil
        XCTAssertNil(KeychainStore.shared.token)
    }

    func testSettingNilAfterNoValueWasEverSetDoesNotCrash() {
        KeychainStore.shared.token = nil
        KeychainStore.shared.token = nil
        XCTAssertNil(KeychainStore.shared.token)
    }

    func testOverwritingAnExistingValueReplacesItRatherThanDuplicating() {
        let store = KeychainStore.shared
        store.token = "first"
        store.token = "second"
        store.token = "third"
        XCTAssertEqual(store.token, "third")
    }

    func testTokenPersistsAcrossSeparateAccessesWithinTheSameProcess() {
        KeychainStore.shared.token = "persisted-token"
        // A distinct reference to the same underlying singleton/service+account.
        let sameStore = KeychainStore.shared
        XCTAssertEqual(sameStore.token, "persisted-token")
    }

    func testEmptyStringIsStoredAndReadBackDistinctlyFromNil() {
        let store = KeychainStore.shared
        store.token = ""
        XCTAssertEqual(store.token, "")
        XCTAssertNotNil(store.token)
    }
}
