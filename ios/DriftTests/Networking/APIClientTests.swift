import XCTest
@testable import Drift

final class APIClientTests: XCTestCase {
    private var client: APIClient!

    override func setUp() {
        super.setUp()
        MockURLProtocol.reset()
        client = APIClient(session: MockURLProtocol.makeSession(), keychain: KeychainStore.shared)
    }

    override func tearDown() {
        MockURLProtocol.reset()
        super.tearDown()
    }

    func testSuccessfulGETDecodesResponse() async throws {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }
        let response: OKResponse = try await client.request("/whatever")
        XCTAssertTrue(response.ok)
    }

    func testPOSTSendsEncodedBodyAndContentType() async throws {
        struct Body: Codable { let name: String }
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }

        let _: OKResponse = try await client.request("/thing", method: "POST", body: Body(name: "drift"))

        let sent = try XCTUnwrap(MockURLProtocol.recordedRequests.first)
        XCTAssertEqual(sent.httpMethod, "POST")
        XCTAssertEqual(sent.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let bodyData = try XCTUnwrap(sent.httpBodyStreamData() ?? sent.httpBody)
        let decoded = try JSONDecoder().decode(Body.self, from: bodyData)
        XCTAssertEqual(decoded.name, "drift")
    }

    func testAttachesBearerTokenWhenAuthenticated() async throws {
        KeychainStore.shared.token = "abc123"
        defer { KeychainStore.shared.token = nil }
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }

        let _: OKResponse = try await client.request("/protected")

        let sent = try XCTUnwrap(MockURLProtocol.recordedRequests.first)
        XCTAssertEqual(sent.value(forHTTPHeaderField: "Authorization"), "Bearer abc123")
    }

    func testOmitsAuthorizationWhenUnauthenticatedRequestRequested() async throws {
        KeychainStore.shared.token = "abc123"
        defer { KeychainStore.shared.token = nil }
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }

        let _: OKResponse = try await client.request("/public", authenticated: false)

        let sent = try XCTUnwrap(MockURLProtocol.recordedRequests.first)
        XCTAssertNil(sent.value(forHTTPHeaderField: "Authorization"))
    }

    func test401MapsToUnauthorizedError() async throws {
        MockURLProtocol.requestHandler = { _ in .init(statusCode: 401, json: ["error": "Unauthorized"]) }

        do {
            let _: OKResponse = try await client.request("/protected")
            XCTFail("expected an error")
        } catch let error as APIError {
            guard case .unauthorized = error else {
                return XCTFail("expected .unauthorized, got \(error)")
            }
        }
    }

    func testServerErrorCarriesTheBackendsMessage() async throws {
        MockURLProtocol.requestHandler = { _ in .init(statusCode: 409, json: ["error": "An account with that email already exists"]) }

        do {
            let _: OKResponse = try await client.request("/auth/register")
            XCTFail("expected an error")
        } catch let error as APIError {
            guard case .server(let status, let message) = error else {
                return XCTFail("expected .server, got \(error)")
            }
            XCTAssertEqual(status, 409)
            XCTAssertEqual(message, "An account with that email already exists")
        }
    }

    func testTransportFailureMapsToTransportError() async throws {
        MockURLProtocol.requestHandler = { _ in throw URLError(.notConnectedToInternet) }

        do {
            let _: OKResponse = try await client.request("/anything")
            XCTFail("expected an error")
        } catch let error as APIError {
            guard case .transport = error else {
                return XCTFail("expected .transport, got \(error)")
            }
        }
    }

    func testMalformedJSONMapsToDecodingError() async throws {
        MockURLProtocol.requestHandler = { _ in .init(statusCode: 200, rawBody: "not json") }

        do {
            let _: OKResponse = try await client.request("/anything")
            XCTFail("expected an error")
        } catch let error as APIError {
            guard case .decoding = error else {
                return XCTFail("expected .decoding, got \(error)")
            }
        }
    }
}

private extension URLRequest {
    /// httpBody is nil for requests built the way APIClient builds them
    /// (assigned directly), but this covers the httpBodyStream path too in
    /// case that ever changes.
    func httpBodyStreamData() -> Data? {
        guard let stream = httpBodyStream else { return nil }
        stream.open()
        defer { stream.close() }
        var data = Data()
        let bufferSize = 4096
        var buffer = [UInt8](repeating: 0, count: bufferSize)
        while stream.hasBytesAvailable {
            let read = stream.read(&buffer, maxLength: bufferSize)
            if read > 0 { data.append(buffer, count: read) }
        }
        return data
    }
}
