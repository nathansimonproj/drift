import SwiftUI

// The full reset-password flow (deep-linking the emailed token back into the
// app via Universal Links) is M3 work. This screen only covers the request
// step, which is already fully served by the existing backend endpoint.
struct ForgotPasswordView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var isBusy = false
    @State private var resultMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Text("Enter your email and we'll send you a reset link.")
                    .font(.subheadline)
                    .foregroundStyle(DriftTheme.text2)

                TextField("", text: $email, prompt: Text("Email").foregroundStyle(DriftTheme.text3))
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .foregroundStyle(DriftTheme.text)
                    .fieldStyle()

                if let resultMessage {
                    Text(resultMessage)
                        .font(.footnote)
                        .foregroundStyle(DriftTheme.text2)
                }

                Button {
                    Task { await send() }
                } label: {
                    if isBusy {
                        ProgressView().tint(DriftTheme.bg).frame(maxWidth: .infinity)
                    } else {
                        Text("Send reset link").fontWeight(.semibold).frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(DriftPrimaryButtonStyle())
                .disabled(email.isEmpty || isBusy)

                Spacer()
            }
            .padding(24)
            .background(DriftTheme.bg)
            .navigationTitle("Reset password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .tint(DriftTheme.text2)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func send() async {
        isBusy = true
        defer { isBusy = false }
        // Backend always returns a generic response regardless of whether the
        // email exists, to avoid account enumeration — mirror that here.
        try? await AuthAPI.forgotPassword(email: email)
        resultMessage = "If an account exists for that email, a reset link has been sent."
    }
}

#Preview {
    ForgotPasswordView()
}
