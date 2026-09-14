import SwiftUI

// The "at-a-glance" tab: score, forecast chart, and breakdown. Split out of
// the old single-scroll HomeView so the app isn't one long pane — this tab
// is purely for looking, not logging (see LogView for that).
struct ForecastView: View {
    @Environment(EventStore.self) private var eventStore
    @Environment(ProfileStore.self) private var profileStore
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
            .navigationTitle("Forecast")
            .profileToolbar(isPresented: $showProfile)
        }
        .refreshable {
            await eventStore.load()
            await profileStore.load()
        }
    }
}

#Preview {
    ForecastView()
        .environment(EventStore())
        .environment(ProfileStore())
}
