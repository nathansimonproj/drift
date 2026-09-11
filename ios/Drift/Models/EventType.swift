import Foundation

enum AmountKind {
    case number
    case variant
    case intensity
    case size
}

struct VariantOption: Identifiable {
    let value: String
    let label: String
    let mg: Double?
    /// Overrides the generic per-amountKind label for this option specifically
    /// (e.g. alcohol's "1 standard drink" instead of an mg figure).
    let amountLabel: String?

    var id: String { value }

    init(_ value: String, _ label: String, mg: Double? = nil, amountLabel: String? = nil) {
        self.value = value
        self.label = label
        self.mg = mg
        self.amountLabel = amountLabel
    }
}

struct EventMetadata {
    let label: String
    let unit: String
    let defaultAmount: String
    let amountKind: AmountKind
    let quickLabel: String
    let quickMeta: String
    let options: [VariantOption]
    /// Overrides the generic per-amountKind label (e.g. nicotine's options are
    /// delivery methods, not brands, so it's labeled "Product").
    let amountLabelOverride: String?

    init(
        label: String, unit: String, defaultAmount: String, amountKind: AmountKind,
        quickLabel: String, quickMeta: String, options: [VariantOption] = [],
        amountLabelOverride: String? = nil
    ) {
        self.label = label
        self.unit = unit
        self.defaultAmount = defaultAmount
        self.amountKind = amountKind
        self.quickLabel = quickLabel
        self.quickMeta = quickMeta
        self.options = options
        self.amountLabelOverride = amountLabelOverride
    }

    var amountFieldLabel: String {
        if let amountLabelOverride { return amountLabelOverride }
        switch amountKind {
        case .variant: return "Brand"
        case .intensity: return "Intensity"
        case .size: return "Size"
        case .number: return "Amount"
        }
    }
}

// Mirrors js/types.js's TYPES registry. Every case here has a DECAY curve
// (see Decay.swift), but only `active` types are shown in the UI or counted
// by Scoring — matching js/decay.js's TYPES-gates-DECAY split exactly, so a
// disabled type doesn't silently keep scoring on old logged events.
enum EventType: String, CaseIterable, Codable, Identifiable, Hashable {
    case coffee
    case energyDrink = "energy_drink"
    case soda
    case marijuana
    case alcohol
    case nicotine
    // Dormant in the web app (commented out in js/types.js) — kept here so
    // the DecayEngine has them ready, but excluded from `active`.
    case stimulant
    case nap
    case caffeine
    case workout
    case meal
    case stress
    case brightlight
    case screen

    var id: String { rawValue }

    static let active: [EventType] = [.coffee, .energyDrink, .soda, .marijuana, .alcohol, .nicotine]

    /// Order used for the quick-add grid, matching js/render-log.js's
    /// renderQuickAdd() key list (nap is listed there too but is inactive).
    static let quickAddOrder: [EventType] = [.coffee, .energyDrink, .soda, .marijuana, .alcohol, .nicotine]

    var metadata: EventMetadata {
        switch self {
        case .coffee:
            return EventMetadata(
                label: "Coffee", unit: "mg", defaultAmount: "135", amountKind: .number,
                quickLabel: "Coffee (12oz)", quickMeta: "135 mg"
            )
        case .energyDrink:
            return EventMetadata(
                label: "Energy Drink", unit: "mg", defaultAmount: "celsius", amountKind: .variant,
                quickLabel: "Energy Drink", quickMeta: "Varies",
                options: [
                    VariantOption("red_bull", "Red Bull", mg: 80),
                    VariantOption("celsius", "Celsius", mg: 200),
                    VariantOption("monster", "Monster Energy", mg: 160),
                    VariantOption("alani_nu", "Alani Nu", mg: 200),
                    VariantOption("rockstar", "Rockstar Energy", mg: 160),
                    VariantOption("bang", "Bang Energy", mg: 300),
                    VariantOption("reign", "Reign Total Body Fuel", mg: 300),
                    VariantOption("ghost", "Ghost Energy", mg: 200),
                    VariantOption("nos", "NOS", mg: 160),
                    VariantOption("bloom", "Bloom Nutrition", mg: 150),
                    VariantOption("bum", "Bum Energy", mg: 112),
                ]
            )
        case .soda:
            return EventMetadata(
                label: "Soda", unit: "mg", defaultAmount: "regular", amountKind: .variant,
                quickLabel: "Soda", quickMeta: "Varies",
                options: [
                    VariantOption("diet", "Diet Coke", mg: 46),
                    VariantOption("regular", "Coca-Cola", mg: 34),
                    VariantOption("zero", "Coke Zero Sugar", mg: 34),
                ]
            )
        case .marijuana:
            return EventMetadata(
                label: "Marijuana", unit: "mg", defaultAmount: "10", amountKind: .number,
                quickLabel: "Marijuana", quickMeta: "10 mg"
            )
        case .alcohol:
            return EventMetadata(
                label: "Alcohol", unit: "drinks", defaultAmount: "beer", amountKind: .variant,
                quickLabel: "Alcohol", quickMeta: "Varies",
                options: [
                    VariantOption("beer", "Beer (12oz)", amountLabel: "1 standard drink"),
                    VariantOption("wine", "Glass of Wine (5oz)", amountLabel: "1 standard drink"),
                    VariantOption("shot", "Shot (1.5oz)", amountLabel: "1 standard drink"),
                ]
            )
        case .nicotine:
            return EventMetadata(
                label: "Nicotine", unit: "mg", defaultAmount: "pouch_6", amountKind: .variant,
                quickLabel: "Nicotine", quickMeta: "Varies",
                options: [
                    VariantOption("cigarette", "Cigarette", mg: 1.2),
                    VariantOption("vape", "Vape (session)", mg: 1.3),
                    VariantOption("pouch_3", "Nicotine Pouch (3mg)", mg: 3),
                    VariantOption("pouch_6", "Nicotine Pouch (6mg)", mg: 6),
                ],
                amountLabelOverride: "Product"
            )
        case .stimulant:
            return EventMetadata(
                label: "Adderall / Vyvanse", unit: "dose", defaultAmount: "medium", amountKind: .intensity,
                quickLabel: "Adderall", quickMeta: "medium dose"
            )
        case .nap:
            return EventMetadata(
                label: "Nap", unit: "min", defaultAmount: "30", amountKind: .number,
                quickLabel: "Nap", quickMeta: "30 min"
            )
        case .caffeine:
            return EventMetadata(
                label: "Caffeine", unit: "mg", defaultAmount: "100", amountKind: .number,
                quickLabel: "Caffeine", quickMeta: "100 mg"
            )
        case .workout:
            return EventMetadata(
                label: "Workout", unit: "intensity", defaultAmount: "medium", amountKind: .intensity,
                quickLabel: "Workout", quickMeta: "medium"
            )
        case .meal:
            return EventMetadata(
                label: "Meal", unit: "size", defaultAmount: "medium", amountKind: .size,
                quickLabel: "Meal", quickMeta: "medium"
            )
        case .stress:
            return EventMetadata(
                label: "Stressor", unit: "level", defaultAmount: "medium", amountKind: .intensity,
                quickLabel: "Stress", quickMeta: "medium"
            )
        case .brightlight:
            return EventMetadata(
                label: "Bright light", unit: "min", defaultAmount: "30", amountKind: .number,
                quickLabel: "Bright light", quickMeta: "30 min"
            )
        case .screen:
            return EventMetadata(
                label: "Screen time", unit: "min", defaultAmount: "60", amountKind: .number,
                quickLabel: "Screen", quickMeta: "60 min"
            )
        }
    }
}

let intensityOptions = ["low", "medium", "high"]
let sizeOptions = ["light", "medium", "heavy"]
