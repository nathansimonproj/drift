import XCTest
@testable import Drift

final class KeychainStoreTests: XCTestCase {
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
}
