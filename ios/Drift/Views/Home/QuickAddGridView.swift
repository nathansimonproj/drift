import SwiftUI

// Port of js/render-log.js's renderQuickAdd()/makeQuickAddButton()/
// makeQuickAddVariantTile(): a tile per active type, adding the default
// amount immediately, except variant types which open a picker of options
// instead (a native Menu here, replacing the web's custom-positioned
// popover — which existed there only to route around a CSS/viewport bug
// that has no equivalent in native layout).
struct QuickAddGridView: View {
    let onAdd: (EventType, String) -> Void

    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 10) {
            ForEach(EventType.quickAddOrder) { type in
                let meta = type.metadata
                if meta.amountKind == .variant {
                    Menu {
                        ForEach(meta.options) { option in
                            Button(option.label) { onAdd(type, option.value) }
                        }
                    } label: {
                        QuickAddTile(label: meta.quickLabel, meta: meta.quickMeta, icon: "chevron.down")
                    }
                    .accessibilityIdentifier("quickAdd_\(type.rawValue)")
                } else {
                    Button {
                        onAdd(type, meta.defaultAmount)
                    } label: {
                        QuickAddTile(label: meta.quickLabel, meta: meta.quickMeta, icon: "plus")
                    }
                    .accessibilityIdentifier("quickAdd_\(type.rawValue)")
                }
            }
        }
    }
}

private struct QuickAddTile: View {
    let label: String
    let meta: String
    // "chevron.down" (opens a menu of options) or "plus" (adds the shown
    // default amount immediately) — every tile gets one, so it's always
    // clear what tapping it does rather than only variant types having an
    // affordance.
    let icon: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(DriftTheme.text)
                Text(meta)
                    .font(.caption)
                    .foregroundStyle(DriftTheme.text3)
            }
            Spacer()
            Image(systemName: icon)
                .font(.caption2)
                .foregroundStyle(DriftTheme.text3)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(DriftTheme.surface2, in: RoundedRectangle(cornerRadius: DriftTheme.Radius.tile))
        .overlay(RoundedRectangle(cornerRadius: DriftTheme.Radius.tile).stroke(DriftTheme.border))
    }
}

#Preview {
    QuickAddGridView { _, _ in }
        .padding()
        .background(DriftTheme.bg)
}
