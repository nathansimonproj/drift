import Foundation

enum EventsAPI {
    static func fetchAll() async throws -> [LogEvent] {
        let dtos: [EventResponseDTO] = try await APIClient.shared.request("/events")
        return dtos.compactMap(\.asLogEvent).sorted { $0.time < $1.time }
    }

    static func create(_ event: LogEvent) async throws {
        let body = EventRequestDTO(id: event.id, type: event.type, amount: event.amount, time: event.time)
        let _: OKResponse = try await APIClient.shared.request("/events", method: "POST", body: body)
    }

    static func update(_ event: LogEvent) async throws {
        let body = EventRequestDTO(type: event.type, amount: event.amount, time: event.time)
        let _: OKResponse = try await APIClient.shared.request("/events/\(event.id)", method: "PUT", body: body)
    }

    static func delete(id: String) async throws {
        let _: OKResponse = try await APIClient.shared.request("/events/\(id)", method: "DELETE")
    }
}
