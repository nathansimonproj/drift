import Foundation

// Direct port of js/decay.js's DECAY object. Constants, half-lives, and peak
// values are copied verbatim — they encode real calibration against
// pharmacokinetics research (see docs/SCORING.md); do not "clean up" the
// numbers here without updating both implementations.
enum Decay {
    static func hoursSince(_ eventTime: Date, _ t: Date) -> Double {
        t.timeIntervalSince(eventTime) / 3600
    }

    // Shared by every caffeine-containing type (coffee, energy_drink, soda,
    // plain caffeine). See js/decay.js's caffeineDecay() for the full
    // pharmacokinetics citations behind the 5h half-life and the 20mg
    // floor / 0.4 multiplier modeling choices.
    static func caffeinePenalty(mg: Double, hoursSince h: Double) -> Double {
        guard h >= 0 else { return 0 }
        let remainingMg = mg * pow(0.5, h / 5)
        return max(0, (remainingMg - 20) * 0.4)
    }

    private static let energyDrinkMgByVariant: [String: Double] = [
        "red_bull": 80, "celsius": 200, "monster": 160, "alani_nu": 200, "rockstar": 160,
        "bang": 300, "reign": 300, "ghost": 200, "nos": 160, "bloom": 150, "bum": 112,
    ]

    private static let sodaMgByVariant: [String: Double] = [
        "diet": 46, "regular": 34, "zero": 34,
    ]

    private static let nicotineMgByVariant: [String: Double] = [
        "cigarette": 1.2, "vape": 1.3, "pouch_3": 3, "pouch_6": 6,
    ]

    static func penalty(for event: LogEvent, at t: Date) -> Double {
        let h = hoursSince(event.time, t)

        switch event.type {
        case .coffee, .caffeine:
            return caffeinePenalty(mg: Double(event.amount) ?? 0, hoursSince: h)

        case .energyDrink:
            let mg = energyDrinkMgByVariant[event.amount] ?? 160
            return caffeinePenalty(mg: mg, hoursSince: h)

        case .soda:
            let mg = sodaMgByVariant[event.amount] ?? 34
            return caffeinePenalty(mg: mg, hoursSince: h)

        case .marijuana:
            guard h >= 0 else { return 0 }
            // Models same-night REM-suppression impact, not the multi-day THC
            // clearance half-life (which is about detectability, not sleep effect).
            return (Double(event.amount) ?? 0) * 20 * pow(0.5, h / 7)

        case .stimulant:
            guard h >= 0 else { return 0 }
            // Modeled as XR-formulation default (most common student usage).
            let halfLife = 10.0
            let peak: [String: Double] = ["low": 14, "medium": 22, "high": 32]
            return (peak[event.amount] ?? 22) * pow(0.5, h / halfLife)

        case .nap:
            guard h >= 0 else { return 0 }
            let napMin = Double(event.amount) ?? 0
            var basePenalty = 0.0
            if napMin > 25 && napMin <= 90 {
                basePenalty = (napMin - 25) * 0.15
            } else if napMin > 90 {
                basePenalty = (90 - 25) * 0.15 + (napMin - 90) * 0.25
            }
            let napHour = Calendar.current.component(.hour, from: event.time)
            let lateMult = napHour >= 16 ? 1.7 : napHour >= 14 ? 1.3 : 1.0
            // Effect fades over ~10h as sleep pressure rebuilds.
            guard h <= 10 else { return 0 }
            return basePenalty * lateMult * (1 - h / 10)

        case .alcohol:
            guard h >= 0 else { return 0 }
            // Each event is one standard drink (beer/wine/shot all ~14g
            // ethanol per NIAAA) so all variants share this curve — see
            // js/decay.js's alcohol() for the full sourcing/calibration notes.
            let clearH = 1.5
            var p = 0.0
            if h < clearH {
                p += 8 * (1 - 0.4 * (h / clearH))
            }
            let post = h - clearH
            if post >= 0 && post < 6 {
                p += 10 * (1 - post / 6)
            }
            return p

        case .workout:
            guard h >= 0 else { return 0 }
            let tau: [String: Double] = ["low": 0.9, "medium": 1.6, "high": 2.6]
            let peak: [String: Double] = ["low": 10, "medium": 16, "high": 22]
            return (peak[event.amount] ?? 16) * exp(-h / (tau[event.amount] ?? 1.6))

        case .meal:
            guard h >= 0 else { return 0 }
            let dur: [String: Double] = ["light": 1.8, "medium": 3.2, "heavy": 5]
            let peak: [String: Double] = ["light": 6, "medium": 11, "heavy": 16]
            let duration = dur[event.amount] ?? 3.2
            guard h <= duration else { return 0 }
            return (peak[event.amount] ?? 11) * (1 - h / duration)

        case .nicotine:
            guard h >= 0 else { return 0 }
            let mg = nicotineMgByVariant[event.amount] ?? 3
            let halfLife = 2.0
            let remainingMg = mg * pow(0.5, h / halfLife)
            var p = max(0, (remainingMg - 0.5) * 1.5)
            let reboundWindow = 4.0
            let sinceHalfLife = h - halfLife
            if sinceHalfLife >= 0 && sinceHalfLife < reboundWindow {
                p += mg * 3 * (1 - sinceHalfLife / reboundWindow)
            }
            return p

        case .stress:
            guard h >= 0 else { return 0 }
            let tau: [String: Double] = ["low": 0.8, "medium": 1.4, "high": 2.2]
            let peak: [String: Double] = ["low": 6, "medium": 11, "high": 16]
            return (peak[event.amount] ?? 11) * exp(-h / (tau[event.amount] ?? 1.4))

        case .brightlight:
            guard h >= 0 else { return 0 }
            let lifeH = 1.5
            guard h <= lifeH else { return 0 }
            let minutes = Double(event.amount) ?? 0
            return (1 - h / lifeH) * (minutes / 60) * 9

        case .screen:
            guard h >= 0 else { return 0 }
            let lifeH = 1.0
            guard h <= lifeH else { return 0 }
            let minutes = Double(event.amount) ?? 0
            return (1 - h / lifeH) * (minutes / 60) * 6
        }
    }
}
