import XCTest
@testable import Drift

@MainActor
final class EventStoreTests: XCTestCase {
    private var realClient: APIClient!

    override func setUp() {
        super.setUp()
        MockURLProtocol.reset()
        realClient = APIClient.shared
        APIClient.shared = APIClient(session: MockURLProtocol.makeSession(), keychain: KeychainStore.shared)
    }

    override func tearDown() {
        APIClient.shared = realClient
        MockURLProtocol.reset()
        super.tearDown()
    }

    func testLoadPopulatesEventsFromTheServer() async {
        MockURLProtocol.requestHandler = { _ in
            .init(json: [
                ["id": "e1", "type": "coffee", "amount": "135", "occurred_at": "2026-01-01T08:00:00.000Z"],
            ])
        }
        let store = EventStore()

        await store.load()

        XCTAssertEqual(store.events.count, 1)
        XCTAssertEqual(store.events.first?.type, .coffee)
        XCTAssertEqual(store.events.first?.amount, "135")
        XCTAssertNil(store.errorMessage)
    }

    func testLoadFailureSurfacesAnErrorAndLeavesEventsEmpty() async {
        MockURLProtocol.requestHandler = { _ in throw URLError(.notConnectedToInternet) }
        let store = EventStore()

        await store.load()

        XCTAssertEqual(store.events, [])
        XCTAssertNotNil(store.errorMessage)
    }

    func testAddEventIsOptimisticThenConfirmedByServer() async {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }
        let store = EventStore()

        await store.addEvent(type: .coffee, amount: "135", time: Date())

        XCTAssertEqual(store.events.count, 1)
        XCTAssertNil(store.errorMessage)
    }

    func testAddEventRollsBackOnServerFailure() async {
        MockURLProtocol.requestHandler = { _ in .init(statusCode: 500, json: ["error": "Server error"]) }
        let store = EventStore()

        await store.addEvent(type: .coffee, amount: "135", time: Date())

        XCTAssertEqual(store.events, [], "a failed create must be rolled back from local state")
        XCTAssertNotNil(store.errorMessage)
    }

    func testUpdateEventChangesFieldsOnSuccess() async {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }
        let store = EventStore()
        await store.addEvent(type: .coffee, amount: "135", time: Date())
        let id = store.events[0].id

        await store.updateEvent(id: id, type: .coffee, amount: "200", time: Date())

        XCTAssertEqual(store.events.first?.amount, "200")
    }

    func testUpdateEventRevertsOnServerFailure() async {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }
        let store = EventStore()
        await store.addEvent(type: .coffee, amount: "135", time: Date())
        let id = store.events[0].id

        MockURLProtocol.requestHandler = { _ in .init(statusCode: 500, json: ["error": "Server error"]) }
        await store.updateEvent(id: id, type: .coffee, amount: "999", time: Date())

        XCTAssertEqual(store.events.first?.amount, "135", "a failed update must revert to the original event")
    }

    func testDeleteEventRemovesItOnSuccess() async {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }
        let store = EventStore()
        await store.addEvent(type: .coffee, amount: "135", time: Date())
        let id = store.events[0].id

        await store.deleteEvent(id: id)

        XCTAssertEqual(store.events, [])
    }

    func testDeleteEventRestoresItOnServerFailure() async {
        MockURLProtocol.requestHandler = { _ in .init(json: ["ok": true]) }
        let store = EventStore()
        await store.addEvent(type: .coffee, amount: "135", time: Date())
        let id = store.events[0].id

        MockURLProtocol.requestHandler = { _ in .init(statusCode: 500, json: ["error": "Server error"]) }
        await store.deleteEvent(id: id)

        XCTAssertEqual(store.events.count, 1, "a failed delete must restore the event")
    }

    func testTodaysEventsFiltersToTheCalendarDay() async {
        MockURLProtocol.requestHandler = { _ in
            .init(json: [
                ["id": "today", "type": "coffee", "amount": "135", "occurred_at": ISO8601DateFormatter.driftFractional.string(from: Date())],
                ["id": "old", "type": "coffee", "amount": "135", "occurred_at": "2020-01-01T08:00:00.000Z"],
            ])
        }
        let store = EventStore()

        await store.load()

        XCTAssertEqual(store.todaysEvents.map(\.id), ["today"])
    }
}
