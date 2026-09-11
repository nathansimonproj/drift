import XCTest
@testable import Drift

@MainActor
final class AuthStoreTests: XCTestCase {
    private var realClient: APIClient!

    override func setUp() {
        super.setUp()
        MockURLProtocol.reset()
        realClient = APIClient.shared
        APIClient.shared = APIClient(session: MockURLProtocol.makeSession(), keychain: KeychainStore.shared)
        KeychainStore.shared.token = nil
    }

    override func tearDown() {
        APIClient.shared = realClient
        KeychainStore.shared.token = nil
        MockURLProtocol.reset()
        super.tearDown()
    }

    func testStartsSignedOutWithNoStoredToken() {
        let store = AuthStore()
        XCTAssertEqual(store.state, .signedOut)
    }

    func testStartsSignedInWithAStoredToken() {
        KeychainStore.shared.token = "existing-token"
        let store = AuthStore()
        XCTAssertEqual(store.state, .signedIn)
    }

    func testSuccessfulLoginStoresTokenAndSignsIn() async {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true, "token": "new-token"]) }
        let store = AuthStore()

        await store.login(email: "a@example.com", password: "password123")

        XCTAssertEqual(store.state, .signedIn)
        XCTAssertNil(store.errorMessage)
        XCTAssertEqual(KeychainStore.shared.token, "new-token")
    }

    func testFailedLoginSurfacesErrorAndStaysSignedOut() async {
        MockURLProtocol.requestHandler = { _ in .init(statusCode: 401, json: ["error": "Invalid email or password"]) }
        let store = AuthStore()

        await store.login(email: "a@example.com", password: "wrong")

        XCTAssertEqual(store.state, .signedOut)
        XCTAssertEqual(store.errorMessage, "Invalid email or password")
        XCTAssertNil(KeychainStore.shared.token)
    }

    func testRegisterMirrorsLoginBehavior() async {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true, "token": "fresh-token"]) }
        let store = AuthStore()

        await store.register(email: "new@example.com", password: "password123")

        XCTAssertEqual(store.state, .signedIn)
        XCTAssertEqual(KeychainStore.shared.token, "fresh-token")
    }

    func testLogoutClearsTokenAndSignsOutEvenIfServerCallFails() async {
        KeychainStore.shared.token = "existing-token"
        MockURLProtocol.requestHandler = { _ in throw URLError(.notConnectedToInternet) }
        let store = AuthStore()
        XCTAssertEqual(store.state, .signedIn)

        await store.logout()

        XCTAssertEqual(store.state, .signedOut)
        XCTAssertNil(KeychainStore.shared.token, "local state must clear even when the network call fails")
    }

    func testDeleteAccountSignsOutOnSuccess() async {
        KeychainStore.shared.token = "existing-token"
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }
        let store = AuthStore()

        await store.deleteAccount()

        XCTAssertEqual(store.state, .signedOut)
        XCTAssertNil(KeychainStore.shared.token)
    }

    func testDeleteAccountKeepsSessionAndSurfacesErrorOnFailure() async {
        KeychainStore.shared.token = "existing-token"
        MockURLProtocol.requestHandler = { _ in .init(statusCode: 500, json: ["error": "Server error"]) }
        let store = AuthStore()

        await store.deleteAccount()

        XCTAssertEqual(store.state, .signedIn, "a failed deletion must not sign the user out")
        XCTAssertEqual(store.errorMessage, "Server error")
        XCTAssertEqual(KeychainStore.shared.token, "existing-token")
    }
}
