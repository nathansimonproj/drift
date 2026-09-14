import SwiftUI

// The "data-entry" tab: quick-add, custom entry, and today's events. Split
// out of the old single-scroll HomeView — see ForecastView for the
// at-a-glance half. No TimelineView here: nothing in this tab is a
// live-decaying score, so there's no need for a periodic recompute tick.
struct LogView: View {
    @Environment(EventStore.self) private var eventStore
    @State private var editingEvent: LogEvent?
    @State private var showProfile = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    QuickAddGridView { type, amount in
                        Task { await eventStore.addEvent(type: type, amount: amount, time: Date()) }
                    }
                    CustomEntryFormView { type, amount, time in
                        Task { await eventStore.addEvent(type: type, amount: amount, time: time) }
                    }
                    EventsListView(
                        events: eventStore.todaysEvents,
                        onEdit: { editingEvent = $0 },
                        onDelete: { id in Task { await eventStore.deleteEvent(id: id) } }
                    )

                    if let errorMessage = eventStore.errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(DriftTheme.bad)
                    }
                }
                .padding(20)
            }
            .background(DriftTheme.bg)
            .navigationTitle("Log")
            .profileToolbar(isPresented: $showProfile)
            .sheet(item: $editingEvent) { event in
                EditEventSheet(event: event) { id, type, amount, time in
                    Task { await eventStore.updateEvent(id: id, type: type, amount: amount, time: time) }
                } onDelete: { id in
                    Task { await eventStore.deleteEvent(id: id) }
                }
            }
        }
        .refreshable {
            await eventStore.load()
        }
    }
}

#Preview {
    LogView()
        .environment(EventStore())
        .environment(ProfileStore())
}
