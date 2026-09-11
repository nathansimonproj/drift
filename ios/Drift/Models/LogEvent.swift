import Foundation

// `amount` stays a String end-to-end, mirroring the server's TEXT column and
// js/state.js's own dynamic handling (a number for `amountKind: .number`
// types, or a variant/intensity/size key otherwise) — see EventType.metadata.
struct LogEvent: Identifiable, Equatable {
    let id: String
    var type: EventType
    var amount: String
    var time: Date

    /// Mirrors js/render-log.js's describeEvent(): resolves what to actually
    /// show for this event — a variant's own label/amount, or the generic
    /// type label + a formatted number.
    var description: (name: String, amountLabel: String)? {
        guard EventType.active.contains(type) else { return nil }
        let meta = type.metadata
        if meta.amountKind == .variant {
            guard let variant = meta.options.first(where: { $0.value == amount }) else {
                return (meta.label, amount)
            }
            let label = variant.amountLabel ?? variant.mg.map { "\(Self.formatNumber($0)) \(meta.unit)" } ?? amount
            return (variant.label, label)
        }
        if meta.amountKind == .number {
            return (meta.label, "\(amount) \(meta.unit)")
        }
        return (meta.label, amount)
    }

    static func formatNumber(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(value)) : String(value)
    }
}

// Wire format for GET /events — server returns `occurred_at`, amount is
// always a JSON string (Postgres TEXT column).
struct EventResponseDTO: Decodable {
    let id: String
    let type: String
    let amount: String
    let occurredAt: Date

    enum CodingKeys: String, CodingKey {
        case id, type, amount
        case occurredAt = "occurred_at"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        type = try container.decode(String.self, forKey: .type)
        amount = try container.decode(String.self, forKey: .amount)
        let raw = try container.decode(String.self, forKey: .occurredAt)
        guard let date = ISO8601DateFormatter.driftFractional.date(from: raw)
            ?? ISO8601DateFormatter.drift.date(from: raw) else {
            throw DecodingError.dataCorruptedError(forKey: .occurredAt, in: container, debugDescription: "Bad date: \(raw)")
        }
        occurredAt = date
    }

    /// nil if `type` isn't a known EventType at all (never happens in
    /// practice, but keeps decoding total rather than throwing on drift
    /// between client and server type lists).
    var asLogEvent: LogEvent? {
        guard let eventType = EventType(rawValue: type) else { return nil }
        return LogEvent(id: id, type: eventType, amount: amount, time: occurredAt)
    }
}

// Wire format for POST/PUT /events — server expects `time`, not `occurred_at`.
struct EventRequestDTO: Encodable {
    let id: String?
    let type: String
    let amount: String
    let time: String

    init(id: String? = nil, type: EventType, amount: String, time: Date) {
        self.id = id
        self.type = type.rawValue
        self.amount = amount
        self.time = ISO8601DateFormatter.driftFractional.string(from: time)
    }
}

extension ISO8601DateFormatter {
    static let drift: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    static let driftFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}
