import SwiftUI

struct HomeView: View {
    @Environment(AuthStore.self) private var authStore
    @Environment(EventStore.self) private var eventStore
    @Environment(ProfileStore.self) private var profileStore
    @State private var editingEvent: LogEvent?
    @State private var showDeleteConfirm = false
    @State private var showProfile = false

    var body: some View {
        NavigationStack {
            TimelineView(.periodic(from: .now, by: 60)) { _ in
                ScrollView {
                    VStack(spacing: 20) {
                        let bedtime = TimeHelpers.targetBedtimeDate(profileStore.targetBedtime)
                        let nearEvents = Scoring.eventsNear(eventStore.events, bedtime)
                        let result = Scoring.score(events: nearEvents, at: bedtime)
                        let interpretation = InterpretationEngine.interpret(score: result.score, byType: result.byType)

                        ScoreHeroView(result: result, interpretation: interpretation, bedtime: bedtime)
                        ForecastChartView(events: nearEvents, bedtime: bedtime)
                        BreakdownView(byType: result.byType)
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
            }
            .background(DriftTheme.bg)
            .navigationTitle("Drift")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("Profile") { showProfile = true }
                        Button("Sign out") { Task { await authStore.logout() } }
                        Button("Delete account", role: .destructive) { showDeleteConfirm = true }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                    .tint(DriftTheme.text2)
                    .accessibilityIdentifier("accountMenuButton")
                }
            }
            .confirmationDialog(
                "Delete your account? This permanently deletes your event history and cannot be undone.",
                isPresented: $showDeleteConfirm,
                titleVisibility: .visible
            ) {
                Button("Delete account", role: .destructive) { Task { await authStore.deleteAccount() } }
                Button("Cancel", role: .cancel) {}
            }
            .sheet(item: $editingEvent) { event in
                EditEventSheet(event: event) { id, type, amount, time in
                    Task { await eventStore.updateEvent(id: id, type: type, amount: amount, time: time) }
                } onDelete: { id in
                    Task { await eventStore.deleteEvent(id: id) }
                }
            }
            .sheet(isPresented: $showProfile) {
                ProfileView()
            }
        }
        .task {
            await eventStore.load()
            await profileStore.load()
        }
        .refreshable {
            await eventStore.load()
            await profileStore.load()
        }
    }
}

#Preview {
    HomeView()
        .environment(AuthStore())
        .environment(EventStore())
        .environment(ProfileStore())
}
