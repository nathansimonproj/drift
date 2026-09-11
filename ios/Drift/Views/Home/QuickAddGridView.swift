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
                        QuickAddTile(label: meta.quickLabel, meta: meta.quickMeta, showChevron: true)
                    }
                } else {
                    Button {
                        onAdd(type, meta.defaultAmount)
                    } label: {
                        QuickAddTile(label: meta.quickLabel, meta: meta.quickMeta, showChevron: false)
                    }
                }
            }
        }
    }
}

private struct QuickAddTile: View {
    let label: String
    let meta: String
    let showChevron: Bool

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
            if showChevron {
                Image(systemName: "chevron.down")
                    .font(.caption2)
                    .foregroundStyle(DriftTheme.text3)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(DriftTheme.surface2, in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(DriftTheme.border))
    }
}

#Preview {
    QuickAddGridView { _, _ in }
        .padding()
        .background(DriftTheme.bg)
}
