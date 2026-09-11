import SwiftUI
import UIKit

// Mirrors pages/login.html: one screen, a Sign in / Create account segmented
// toggle, rather than two separate flows.
struct AuthView: View {
    private enum Mode: String, CaseIterable {
        case signIn = "Sign in"
        case register = "Create account"
    }

    @Environment(AuthStore.self) private var authStore

    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showForgotPassword = false
    @State private var showResetPassword = false

    private var confirmMismatch: Bool {
        mode == .register && !confirmPassword.isEmpty && confirmPassword != password
    }

    private var canSubmit: Bool {
        !email.isEmpty && password.count >= 8 && !(mode == .register && confirmPassword != password)
    }

    // See AppEnvironment.isUITesting: .newPassword triggers the Strong
    // Password AutoFill bar, which swallows synthesized keystrokes in tests.
    private var passwordContentType: UITextContentType? {
        guard !AppEnvironment.isUITesting else { return nil }
        return mode == .register ? .newPassword : .password
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(spacing: 4) {
                    Text("Drift")
                        .font(.largeTitle.bold())
                        .foregroundStyle(DriftTheme.text)
                    Text("Sleep forecast for your day")
                        .font(.subheadline)
                        .foregroundStyle(DriftTheme.text3)
                }
                .padding(.top, 40)

                Label("We will never share, sell, or report your data.", systemImage: "lock.fill")
                    .font(.footnote)
                    .foregroundStyle(DriftTheme.text2)
                    .padding(12)
                    .frame(maxWidth: .infinity)
                    .background(DriftTheme.accent.opacity(0.05), in: RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(DriftTheme.border))

                Picker("Mode", selection: $mode) {
                    ForEach(Mode.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .accessibilityIdentifier("authModePicker")

                if let errorMessage = authStore.errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(DriftTheme.bad)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                VStack(spacing: 12) {
                    TextField("", text: $email, prompt: Text("Email").foregroundStyle(DriftTheme.text3))
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .foregroundStyle(DriftTheme.text)
                        .fieldStyle()
                        .accessibilityIdentifier("authEmailField")

                    SecureField("", text: $password, prompt: Text("Password").foregroundStyle(DriftTheme.text3))
                        .textContentType(passwordContentType)
                        .foregroundStyle(DriftTheme.text)
                        .fieldStyle()
                        .accessibilityIdentifier("authPasswordField")

                    if mode == .register {
                        SecureField("", text: $confirmPassword, prompt: Text("Confirm password").foregroundStyle(DriftTheme.text3))
                            .textContentType(passwordContentType)
                            .foregroundStyle(DriftTheme.text)
                            .fieldStyle()
                            .accessibilityIdentifier("authConfirmPasswordField")
                        if confirmMismatch {
                            Text("Passwords do not match")
                                .font(.footnote)
                                .foregroundStyle(DriftTheme.bad)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }

                Button {
                    Task { await submit() }
                } label: {
                    if authStore.isBusy {
                        ProgressView()
                            .tint(DriftTheme.bg)
                            .frame(maxWidth: .infinity)
                    } else {
                        Text(mode == .register ? "Create account" : "Sign in")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(DriftPrimaryButtonStyle())
                .disabled(!canSubmit || authStore.isBusy)
                .accessibilityIdentifier("authSubmitButton")

                if mode == .signIn {
                    HStack(spacing: 16) {
                        Button("Forgot password?") { showForgotPassword = true }
                        Button("Have a reset code?") { showResetPassword = true }
                    }
                    .font(.footnote)
                    .tint(DriftTheme.text2)
                }
            }
            .padding(24)
        }
        .background(DriftTheme.bg)
        .scrollContentBackground(.hidden)
        .sheet(isPresented: $showForgotPassword) {
            ForgotPasswordView()
        }
        .sheet(isPresented: $showResetPassword) {
            ResetPasswordView()
        }
        .onChange(of: mode) { authStore.errorMessage = nil }
    }

    private func submit() async {
        switch mode {
        case .signIn:
            await authStore.login(email: email, password: password)
        case .register:
            await authStore.register(email: email, password: password)
        }
    }
}

#Preview {
    AuthView().environment(AuthStore())
}
