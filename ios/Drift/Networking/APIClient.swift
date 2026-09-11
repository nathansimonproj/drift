import Foundation

// Thin async/await wrapper over URLSession. One-shot request/response only —
// no streaming, so Combine buys nothing here.
struct APIClient {
    // `var` (not `let`) so tests can substitute a mock-backed instance for
    // the duration of a test and restore the real one afterward — the
    // AuthAPI/EventsAPI/ProfileAPI call sites all go through `.shared`
    // rather than taking a client parameter, so this is the seam.
    static var shared = APIClient()

    private let session: URLSession
    private let keychain: KeychainStore

    init(session: URLSession = .shared, keychain: KeychainStore = .shared) {
        self.session = session
        self.keychain = keychain
    }

    var baseURL: URL {
        let raw = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String
        return URL(string: raw ?? "https://drift-hs0w.onrender.com")!
    }

    struct EmptyBody: Encodable {}

    func request<Response: Decodable>(
        _ path: String,
        method: String = "GET",
        authenticated: Bool = true
    ) async throws -> Response {
        try await send(path: path, method: method, bodyData: nil, authenticated: authenticated)
    }

    func request<Body: Encodable, Response: Decodable>(
        _ path: String,
        method: String = "POST",
        body: Body,
        authenticated: Bool = true
    ) async throws -> Response {
        let bodyData = try JSONEncoder().encode(body)
        return try await send(path: path, method: method, bodyData: bodyData, authenticated: authenticated)
    }

    private func send<Response: Decodable>(
        path: String,
        method: String,
        bodyData: Data?,
        authenticated: Bool
    ) async throws -> Response {
        var urlRequest = URLRequest(url: baseURL.appendingPathComponent(path))
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")

        if let bodyData {
            urlRequest.httpBody = bodyData
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if authenticated, let token = keychain.token {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.transport
        }

        guard let http = response as? HTTPURLResponse else { throw APIError.transport }

        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONDecoder().decode(APIErrorBody.self, from: data))?.error
            if http.statusCode == 401 { throw APIError.unauthorized }
            throw APIError.server(status: http.statusCode, message: message)
        }

        if Response.self == EmptyResponse.self {
            return EmptyResponse() as! Response // swiftlint:disable:this force_cast
        }
        do {
            return try JSONDecoder().decode(Response.self, from: data)
        } catch {
            throw APIError.decoding
        }
    }
}

// Used for endpoints whose body we don't care about beyond a 2xx status.
struct EmptyResponse: Decodable {}
