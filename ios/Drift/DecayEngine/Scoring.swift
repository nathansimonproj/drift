import Foundation

struct ScoreResult {
    let score: Double
    let byType: [EventType: Double]
    let totalPenalty: Double
}

enum Scoring {
    // Every DECAY curve is ~0 well within 72h of the event — bounds cost by
    // recent events regardless of how much history a user has accumulated.
    static func eventsNear(_ events: [LogEvent], _ t: Date, hours: Double = 72) -> [LogEvent] {
        let cutoff = t.addingTimeInterval(-hours * 3600)
        return events.filter { $0.time > cutoff }
    }

    static func score(events: [LogEvent], at t: Date) -> ScoreResult {
        var total = 0.0
        var byType: [EventType: Double] = [:]
        for event in events {
            // EventType.active is the source of truth for "does this type
            // currently count" — mirrors js/decay.js's scoreAt() checking
            // TYPES before DECAY, so a disabled type doesn't silently keep
            // scoring on already-logged events the UI can no longer show.
            guard EventType.active.contains(event.type) else { continue }
            let p = Decay.penalty(for: event, at: t)
            if p > 0 {
                total += p
                byType[event.type, default: 0] += p
            }
        }
        let score = max(0, min(100, 100 - total))
        return ScoreResult(score: score, byType: byType, totalPenalty: total)
    }
}
