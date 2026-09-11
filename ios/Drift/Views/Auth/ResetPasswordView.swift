import SwiftUI

// Port of pages/reset-password.html. The web version reads the token from
// the emailed link's URL query string; the native app has no Universal
// Links wired up yet (needs a backend-served apple-app-site-association
// file — tracked as follow-up), so the token is entered manually here
// instead — the emailed link still works fine by opening the web page, and
// the token in it can be copy-pasted into this screen.
struct ResetPasswordView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var token = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isBusy = false
    @State private var errorMessage: String?
    @State private var didSucceed = false

    private var canSubmit: Bool {
        !token.isEmpty && password.count >= 8 && password == confirmPassword
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if didSucceed {
                        VStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 40))
                                .foregroundStyle(DriftTheme.good)
                            Text("Your password has been reset.")
                                .foregroundStyle(DriftTheme.text)
                                .multilineTextAlignment(.center)
                            Text("Sign in with your new password.")
                                .font(.subheadline)
                                .foregroundStyle(DriftTheme.text2)
                        }
                        .padding(.top, 40)
                    } else {
                        Text("Paste the reset code from your email, then choose a new password.")
                            .font(.subheadline)
                            .foregroundStyle(DriftTheme.text2)
                            .multilineTextAlignment(.center)

                        TextField("", text: $token, prompt: Text("Reset code").foregroundStyle(DriftTheme.text3))
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .foregroundStyle(DriftTheme.text)
                            .fieldStyle()

                        SecureField("", text: $password, prompt: Text("New password").foregroundStyle(DriftTheme.text3))
                            .foregroundStyle(DriftTheme.text)
                            .fieldStyle()

                        SecureField("", text: $confirmPassword, prompt: Text("Confirm new password").foregroundStyle(DriftTheme.text3))
                            .foregroundStyle(DriftTheme.text)
                            .fieldStyle()

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.footnote)
                                .foregroundStyle(DriftTheme.bad)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        Button {
                            Task { await submit() }
                        } label: {
                            if isBusy {
                                ProgressView().tint(DriftTheme.bg).frame(maxWidth: .infinity)
                            } else {
                                Text("Reset password").fontWeight(.semibold).frame(maxWidth: .infinity)
                            }
                        }
                        .buttonStyle(DriftPrimaryButtonStyle())
                        .disabled(!canSubmit || isBusy)
                    }
                }
                .padding(24)
            }
            .background(DriftTheme.bg)
            .navigationTitle("Reset password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func submit() async {
        errorMessage = nil
        isBusy = true
        defer { isBusy = false }
        do {
            try await AuthAPI.resetPassword(token: token, password: password)
            didSucceed = true
        } catch {
            errorMessage = Self.message(for: error)
        }
    }

    private static func message(for error: Error) -> String {
        switch error as? APIError {
        case .server(_, let message): return message ?? "This reset link is invalid or has expired"
        default: return "Could not reach server"
        }
    }
}

#Preview {
    ResetPasswordView()
}
