import SwiftUI

// Mirrors css/app.css's :root custom properties exactly. The web app ships a
// single fixed dark theme (no prefers-color-scheme handling), so the native
// app matches that rather than adapting to the system light/dark setting —
// see AppRootView's .preferredColorScheme(.dark).
enum DriftTheme {
    static let bg = Color(hex: 0x0A0A0A)
    static let surface = Color(hex: 0x141414)
    static let surface2 = Color(hex: 0x1E1E1E)
    static let border = Color(hex: 0x2E2E2E)
    static let text = Color(hex: 0xF0F0F0)
    static let text2 = Color(hex: 0x999999)
    static let text3 = Color(hex: 0x555555)
    static let accent = Color(hex: 0xE0E0E0)
    static let accent2 = Color(hex: 0xB0B0B0)
    static let good = Color(hex: 0xC0C0C0)
    static let warn = Color(hex: 0xAAAAAA)
    static let bad = Color(hex: 0x888888)

    // Softer, more generous rounding across cards/fields/tiles — same dark
    // palette as the web app, but a friendlier, less clinical shape
    // language (buttons go fully pill-shaped via Capsule).
    enum Radius {
        static let card: CGFloat = 22
        static let field: CGFloat = 14
        static let tile: CGFloat = 18
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

// Mirrors css/app.css's `input` styling: surface-2 background, 1px border —
// rounded well past the web's 8px for a softer, friendlier field shape.
private struct DriftFieldStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(12)
            .background(DriftTheme.surface2, in: RoundedRectangle(cornerRadius: DriftTheme.Radius.field))
            .overlay(RoundedRectangle(cornerRadius: DriftTheme.Radius.field).stroke(DriftTheme.border))
    }
}

extension View {
    func fieldStyle() -> some View {
        modifier(DriftFieldStyle())
    }
}

// Mirrors css/app.css's `.btn-primary`: light accent background with dark
// (bg-colored) text — an inverted look, not the system's white-on-tint.
// Fully pill-shaped (Capsule) rather than a slightly-rounded rectangle, for
// a softer, friendlier button shape.
struct DriftPrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(DriftTheme.bg)
            .padding(.vertical, 13)
            .background(
                configuration.isPressed ? Color.white : DriftTheme.accent,
                in: Capsule()
            )
            .opacity(isEnabled ? 1 : 0.5)
    }
}
