import SwiftUI

// Shared by both tabs: a plain profile icon (no menu) that opens ProfileView
// directly, plus the sheet that presents it. Each tab keeps its own
// `showProfile` @State — this only factors out the button/sheet code, the
// same way DriftTheme.fieldStyle() factors out repeated view styling.
extension View {
    func profileToolbar(isPresented: Binding<Bool>) -> some View {
        self
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresented.wrappedValue = true
                    } label: {
                        Image(systemName: "person.circle")
                    }
                    .tint(DriftTheme.text2)
                    .accessibilityIdentifier("profileButton")
                }
            }
            .sheet(isPresented: isPresented) {
                ProfileView()
            }
    }
}
