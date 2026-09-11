import Foundation

enum Severity {
    case good, ok, warn, bad
}

struct SeverityBand {
    let min: Double
    let word: String
    let severity: Severity
    let lead: String
}

struct SubstanceCategory {
    let label: String
    let keys: [EventType]
}

struct CategoryCost: Identifiable {
    let label: String
    let cost: Double
    var id: String { label }
}

struct Interpretation {
    let word: String
    let severity: Severity
    let feel: String
}

// Direct port of js/decay.js's interpret()/SEVERITY_BANDS/SUBSTANCE_*
// constants — copy text and banding logic, no JS-isms to clean up here.
enum InterpretationEngine {
    static let substanceCategories: [SubstanceCategory] = [
        SubstanceCategory(label: "Caffeine", keys: [.caffeine, .coffee, .energyDrink, .soda]),
        SubstanceCategory(label: "Marijuana", keys: [.marijuana]),
        SubstanceCategory(label: "Alcohol", keys: [.alcohol]),
        SubstanceCategory(label: "Nicotine", keys: [.nicotine]),
    ]

    static let substanceEffect: [String: String] = [
        "Caffeine": "caffeine is still active and blocking the sleep drive that pulls you under",
        "Marijuana": "marijuana tends to suppress REM sleep tonight",
        "Nicotine": "nicotine gives a stimulant kick early on, then fragments sleep with withdrawal as it wears off",
        "Alcohol": "alcohol sedates you early, then fragments sleep and triggers waking as it metabolizes",
        "Nap": "today's nap has lowered your sleep pressure, which can make it harder to drop off",
    ]

    static let severityBands: [SeverityBand] = [
        SeverityBand(min: 85, word: "Clean", severity: .good,
                     lead: "Falling asleep should be easy tonight, and your sleep should run its normal course."),
        SeverityBand(min: 70, word: "Mostly clear", severity: .ok,
                     lead: "Sleep onset might take a few extra minutes tonight"),
        SeverityBand(min: 50, word: "Some interference", severity: .warn,
                     lead: "Expect a longer time to fall asleep tonight"),
        SeverityBand(min: 30, word: "Disrupted", severity: .bad,
                     lead: "Falling asleep will be a real struggle tonight"),
        SeverityBand(min: -.infinity, word: "Heavily disrupted", severity: .bad,
                     lead: "This is shaping up to be a rough night for actually sleeping"),
    ]

    static func categoryCosts(_ byType: [EventType: Double]) -> [CategoryCost] {
        substanceCategories.map { category in
            let cost = category.keys.reduce(0.0) { $0 + (byType[$1] ?? 0) }
            return CategoryCost(label: category.label, cost: cost)
        }
    }

    static func topContributors(_ byType: [EventType: Double]) -> [CategoryCost] {
        let sorted = categoryCosts(byType).filter { $0.cost > 0.5 }.sorted { $0.cost > $1.cost }
        guard let first = sorted.first else { return [] }
        var contributors = [first]
        if sorted.count > 1, sorted[1].cost >= first.cost * 0.6 {
            contributors.append(sorted[1])
        }
        return contributors
    }

    static func interpret(score: Double, byType: [EventType: Double]?) -> Interpretation {
        let band = severityBands.first { score >= $0.min } ?? severityBands.last!

        guard band.word != "Clean", let byType else {
            return Interpretation(word: band.word, severity: band.severity, feel: band.lead)
        }

        let contributors = topContributors(byType)
        guard !contributors.isEmpty else {
            return Interpretation(word: band.word, severity: band.severity, feel: "\(band.lead).")
        }

        let clauses = contributors.compactMap { substanceEffect[$0.label] }
        let attribution = clauses.count == 1 ? clauses[0] : "\(clauses[0]), and \(clauses[1])"
        return Interpretation(word: band.word, severity: band.severity, feel: "\(band.lead) — \(attribution).")
    }
}
