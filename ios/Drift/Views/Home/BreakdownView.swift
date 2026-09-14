import SwiftUI

struct BreakdownView: View {
    let byType: [EventType: Double]

    private var categories: [CategoryCost] {
        InterpretationEngine.categoryCosts(byType).sorted { $0.cost > $1.cost }
    }

    private func color(for cost: Double) -> Color {
        cost == 0 ? DriftTheme.text3 : cost < 5 ? DriftTheme.text2 : cost < 12 ? DriftTheme.warn : DriftTheme.bad
    }

    var body: some View {
        VStack(spacing: 0) {
            ForEach(categories) { category in
                HStack {
                    Text(category.label)
                        .foregroundStyle(DriftTheme.text)
                    Spacer()
                    Text("−\(category.cost, specifier: "%.1f")")
                        .foregroundStyle(color(for: category.cost))
                        .fontWeight(.medium)
                }
                .padding(.vertical, 10)
                if category.id != categories.last?.id {
                    Divider().background(DriftTheme.border)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
        .background(DriftTheme.surface, in: RoundedRectangle(cornerRadius: DriftTheme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: DriftTheme.Radius.card).stroke(DriftTheme.border))
    }
}

#Preview {
    BreakdownView(byType: [.coffee: 8.2, .alcohol: 0, .marijuana: 14.5, .nicotine: 0])
        .padding()
        .background(DriftTheme.bg)
}
