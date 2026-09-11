import Foundation
import Observation

@Observable
final class AuthStore {
    enum SessionState {
        case signedOut
        case signedIn
    }

    private(set) var state: SessionState
    var errorMessage: String?
    var isBusy = false

    private let keychain: KeychainStore

    init(keychain: KeychainStore = .shared) {
        self.keychain = keychain
        state = keychain.token != nil ? .signedIn : .signedOut
    }

    @MainActor
    func register(email: String, password: String) async {
        await run {
            let token = try await AuthAPI.register(email: email, password: password)
            keychain.token = token
            state = .signedIn
        }
    }

    @MainActor
    func login(email: String, password: String) async {
        await run {
            let token = try await AuthAPI.login(email: email, password: password)
            keychain.token = token
            state = .signedIn
        }
    }

    @MainActor
    func logout() async {
        // Best-effort: revoke server-side, but always clear local state even
        // if the network call fails (e.g. offline) so the user isn't stuck.
        try? await AuthAPI.logout()
        keychain.token = nil
        state = .signedOut
    }

    @MainActor
    func deleteAccount() async {
        await run {
            try await AuthAPI.deleteAccount()
            keychain.token = nil
            state = .signedOut
        }
    }

    @MainActor
    private func run(_ operation: () async throws -> Void) async {
        errorMessage = nil
        isBusy = true
        defer { isBusy = false }
        do {
            try await operation()
        } catch {
            errorMessage = Self.message(for: error)
        }
    }

    private static func message(for error: Error) -> String {
        switch error as? APIError {
        case .server(_, let message):
            return message ?? "Something went wrong"
        case .unauthorized:
            return "Invalid email or password"
        case .decoding, .transport, .none:
            return "Could not reach server"
        }
    }
}
