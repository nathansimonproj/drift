import Foundation

// Intercepts URLSession requests so networking code (APIClient and anything
// built on it) can be unit tested without touching a real server. Register
// a handler per test, run the code under test, then assert on what was
// requested and/or what the stubbed response drove.
final class MockURLProtocol: URLProtocol {
    struct Stub {
        let statusCode: Int
        let body: Data
        let headers: [String: String]

        init(statusCode: Int = 200, json: Any, headers: [String: String] = [:]) {
            self.statusCode = statusCode
            self.body = (try? JSONSerialization.data(withJSONObject: json)) ?? Data()
            self.headers = headers
        }

        init(statusCode: Int, rawBody: String = "") {
            self.statusCode = statusCode
            self.body = Data(rawBody.utf8)
            self.headers = [:]
        }
    }

    /// Called for every intercepted request; return the stub to respond
    /// with, or throw to simulate a transport failure.
    nonisolated(unsafe) static var requestHandler: ((URLRequest) throws -> Stub)?
    nonisolated(unsafe) static var recordedRequests: [URLRequest] = []

    static func makeSession() -> URLSession {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        return URLSession(configuration: config)
    }

    static func reset() {
        requestHandler = nil
        recordedRequests = []
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        MockURLProtocol.recordedRequests.append(request)
        guard let handler = MockURLProtocol.requestHandler else {
            client?.urlProtocol(self, didFailWithError: URLError(.unknown))
            return
        }
        do {
            let stub = try handler(request)
            let response = HTTPURLResponse(
                url: request.url!, statusCode: stub.statusCode,
                httpVersion: "HTTP/1.1", headerFields: stub.headers
            )!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: stub.body)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}
