import Foundation
#if canImport(UIKit)
import UIKit
#endif

struct AuthResponse: Decodable {
    let ok: Bool
    let token: String?
}

struct OKResponse: Decodable {
    let ok: Bool
}

enum AuthAPI {
    private struct Credentials: Encodable {
        let email: String
        let password: String
        let deviceLabel: String
    }

    private static var deviceLabel: String {
        #if canImport(UIKit)
        let device = UIDevice.current
        return "\(device.name) (\(device.systemName) \(device.systemVersion))"
        #else
        return "iOS device"
        #endif
    }

    static func register(email: String, password: String) async throws -> String {
        let body = Credentials(email: email, password: password, deviceLabel: deviceLabel)
        let response: AuthResponse = try await APIClient.shared.request(
            "/auth/register", method: "POST", body: body, authenticated: false
        )
        guard let token = response.token else { throw APIError.decoding }
        return token
    }

    static func login(email: String, password: String) async throws -> String {
        let body = Credentials(email: email, password: password, deviceLabel: deviceLabel)
        let response: AuthResponse = try await APIClient.shared.request(
            "/auth/login", method: "POST", body: body, authenticated: false
        )
        guard let token = response.token else { throw APIError.decoding }
        return token
    }

    static func logout() async throws {
        let _: OKResponse = try await APIClient.shared.request("/auth/logout", method: "POST", authenticated: true)
    }

    static func forgotPassword(email: String) async throws {
        struct Body: Encodable { let email: String }
        let _: OKResponse = try await APIClient.shared.request(
            "/auth/forgot-password", method: "POST", body: Body(email: email), authenticated: false
        )
    }

    static func resetPassword(token: String, password: String) async throws {
        struct Body: Encodable { let token: String; let password: String }
        let _: OKResponse = try await APIClient.shared.request(
            "/auth/reset-password", method: "POST", body: Body(token: token, password: password), authenticated: false
        )
    }

    static func deleteAccount() async throws {
        let _: OKResponse = try await APIClient.shared.request("/auth/account", method: "DELETE", authenticated: true)
    }
}
