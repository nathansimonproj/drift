import Foundation
import Observation

// Direct analog of js/state.js's STATE.events + its mutation functions:
// optimistic local update first, then fire the network call, matching the
// existing app's UX (immediate feedback) but with a real error path instead
// of a console.warn.
@Observable
final class EventStore {
    private(set) var events: [LogEvent] = []
    private(set) var isLoading = false
    var errorMessage: String?

    @MainActor
    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            events = try await EventsAPI.fetchAll()
        } catch {
            errorMessage = "Could not load your events."
        }
    }

    @MainActor
    func addEvent(type: EventType, amount: String, time: Date) async {
        let event = LogEvent(id: UUID().uuidString, type: type, amount: amount, time: time)
        events.append(event)
        events.sort { $0.time < $1.time }
        do {
            try await EventsAPI.create(event)
        } catch {
            events.removeAll { $0.id == event.id }
            errorMessage = "Could not save that event."
        }
    }

    @MainActor
    func updateEvent(id: String, type: EventType, amount: String, time: Date) async {
        guard let idx = events.firstIndex(where: { $0.id == id }) else { return }
        let original = events[idx]
        let updated = LogEvent(id: id, type: type, amount: amount, time: time)
        events[idx] = updated
        events.sort { $0.time < $1.time }
        do {
            try await EventsAPI.update(updated)
        } catch {
            if let revertIdx = events.firstIndex(where: { $0.id == id }) {
                events[revertIdx] = original
            }
            errorMessage = "Could not update that event."
        }
    }

    @MainActor
    func deleteEvent(id: String) async {
        guard let idx = events.firstIndex(where: { $0.id == id }) else { return }
        let removed = events.remove(at: idx)
        do {
            try await EventsAPI.delete(id: id)
        } catch {
            events.insert(removed, at: min(idx, events.count))
            events.sort { $0.time < $1.time }
            errorMessage = "Could not delete that event."
        }
    }

    /// Today's events, calendar-day bucketed (not a rolling 24h window) —
    /// matches js/render-log.js's renderEventsList().
    var todaysEvents: [LogEvent] {
        let todayKey = TimeHelpers.dayKey(Date())
        return events.filter { TimeHelpers.dayKey($0.time) == todayKey }
    }
}
