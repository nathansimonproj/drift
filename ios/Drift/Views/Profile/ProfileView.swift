import SwiftUI

// Port of pages/profile.html + js/profile-page.js: personal info (name, sex,
// height/weight with units) and sleep settings (target bedtime), saved as
// one PUT /profile call.
struct ProfileView: View {
    @Environment(ProfileStore.self) private var profileStore
    @Environment(AuthStore.self) private var authStore
    @Environment(\.dismiss) private var dismiss

    @State private var draft = Profile()
    @State private var showSaved = false
    @State private var showDeleteConfirm = false

    private let sexOptions = [("", "Prefer not to say"), ("male", "Male"), ("female", "Female")]

    var body: some View {
        NavigationStack {
            Form {
                Section("Personal") {
                    LabeledContent("Name") {
                        TextField("Your name", text: $draft.name)
                            .multilineTextAlignment(.trailing)
                            .textContentType(.name)
                    }
                    Picker("Sex", selection: $draft.sex) {
                        ForEach(sexOptions, id: \.0) { value, label in
                            Text(label).tag(value)
                        }
                    }
                    HStack {
                        LabeledContent("Height") {
                            TextField("170", text: $draft.height)
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.trailing)
                        }
                        Picker("", selection: $draft.heightUnit) {
                            Text("cm").tag("cm")
                            Text("in").tag("in")
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 100)
                        .labelsHidden()
                    }
                    HStack {
                        LabeledContent("Weight") {
                            TextField("70", text: $draft.weight)
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.trailing)
                        }
                        Picker("", selection: $draft.weightUnit) {
                            Text("kg").tag("kg")
                            Text("lbs").tag("lbs")
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 100)
                        .labelsHidden()
                    }
                }
                .listRowBackground(DriftTheme.surface2)

                Section("Sleep") {
                    DatePicker(
                        "Target bedtime",
                        selection: bedtimeBinding,
                        displayedComponents: .hourAndMinute
                    )
                }
                .listRowBackground(DriftTheme.surface2)

                if let errorMessage = profileStore.errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(DriftTheme.bad)
                        .listRowBackground(DriftTheme.surface2)
                }

                Section {
                    Button {
                        Task {
                            await profileStore.save(draft)
                            showSaved = true
                            try? await Task.sleep(for: .seconds(2))
                            showSaved = false
                        }
                    } label: {
                        HStack {
                            Text(profileStore.isSaving ? "Saving…" : (showSaved ? "Saved" : "Save changes"))
                                .fontWeight(.semibold)
                            Spacer()
                            if profileStore.isSaving {
                                ProgressView().tint(DriftTheme.bg)
                            }
                        }
                    }
                    .disabled(profileStore.isSaving)
                }
                .listRowBackground(DriftTheme.accent)
                .foregroundStyle(DriftTheme.bg)

                Section("Account") {
                    Button("Sign out") {
                        Task { await authStore.logout() }
                    }
                    Button("Delete account", role: .destructive) {
                        showDeleteConfirm = true
                    }
                    if let errorMessage = authStore.errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(DriftTheme.bad)
                    }
                }
                .listRowBackground(DriftTheme.surface2)
            }
            .scrollContentBackground(.hidden)
            .background(DriftTheme.bg)
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .confirmationDialog(
                "Delete your account? This permanently deletes your event history and cannot be undone.",
                isPresented: $showDeleteConfirm,
                titleVisibility: .visible
            ) {
                Button("Delete account", role: .destructive) { Task { await authStore.deleteAccount() } }
                Button("Cancel", role: .cancel) {}
            }
        }
        .preferredColorScheme(.dark)
        .fontDesign(.rounded)
        .onAppear { draft = profileStore.profile }
        .task {
            await profileStore.load()
            draft = profileStore.profile
        }
    }

    /// DatePicker needs a Date binding; target bedtime is stored as "HH:MM".
    private var bedtimeBinding: Binding<Date> {
        Binding(
            get: { TimeHelpers.parseTimeStrToToday(draft.targetBedtime) ?? Date() },
            set: { draft.targetBedtime = TimeHelpers.toTimeInputValue($0) }
        )
    }
}

#Preview {
    ProfileView()
        .environment(ProfileStore())
        .environment(AuthStore())
}
