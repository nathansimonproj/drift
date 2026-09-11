import SwiftUI

extension Severity {
    var color: Color {
        switch self {
        case .good: return DriftTheme.good
        case .ok: return DriftTheme.accent2
        case .warn: return DriftTheme.warn
        case .bad: return DriftTheme.bad
        }
    }
}

struct ScoreHeroView: View {
    let result: ScoreResult
    let interpretation: Interpretation
    let bedtime: Date

    var body: some View {
        VStack(spacing: 8) {
            Text("\(Int(result.score.rounded()))")
                .font(.system(size: 64, weight: .bold, design: .rounded))
                .foregroundStyle(interpretation.severity.color)
            Text(interpretation.word)
                .font(.title3.weight(.semibold))
                .foregroundStyle(DriftTheme.text)
            Text(interpretation.feel)
                .font(.subheadline)
                .foregroundStyle(DriftTheme.text2)
                .multilineTextAlignment(.center)
            Text("bed \(TimeHelpers.fmtTime(bedtime))")
                .font(.footnote)
                .foregroundStyle(DriftTheme.text3)
                .padding(.top, 4)
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(DriftTheme.surface, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DriftTheme.border))
    }
}

#Preview {
    ScoreHeroView(
        result: ScoreResult(score: 72, byType: [.coffee: 12], totalPenalty: 28),
        interpretation: Interpretation(word: "Mostly clear", severity: .ok, feel: "Sleep onset might take a few extra minutes tonight."),
        bedtime: Date()
    )
    .padding()
    .background(DriftTheme.bg)
}
