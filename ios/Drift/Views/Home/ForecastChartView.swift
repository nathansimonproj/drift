import SwiftUI
import Charts

struct ForecastSample: Identifiable {
    let date: Date
    let score: Double
    let byType: [EventType: Double]
    var id: Date { date }
}

// Swift Charts port of js/render-forecast.js's Chart.js line: samples the
// score every 15 min from now through bedtime+2h, a dashed bedtime RuleMark
// replaces the Chart.js afterDraw plugin, and a drag gesture replaces the
// hover tooltip (touch has no hover) — showing the same per-category
// breakdown at the nearest sampled instant.
struct ForecastChartView: View {
    let events: [LogEvent]
    let bedtime: Date

    @State private var selectedSample: ForecastSample?

    private var samples: [ForecastSample] {
        let now = Date()
        let end = bedtime.addingTimeInterval(2 * 3600)
        let stepSeconds = 15.0 * 60
        var result: [ForecastSample] = []
        var t = now
        while t <= end {
            let r = Scoring.score(events: events, at: t)
            result.append(ForecastSample(date: t, score: r.score, byType: r.byType))
            t = t.addingTimeInterval(stepSeconds)
        }
        return result
    }

    var body: some View {
        let currentSamples = samples
        VStack(alignment: .leading, spacing: 10) {
            Chart {
                ForEach(currentSamples) { sample in
                    AreaMark(x: .value("Time", sample.date), y: .value("Score", sample.score))
                        .foregroundStyle(DriftTheme.accent.opacity(0.08))
                        .interpolationMethod(.catmullRom)
                    LineMark(x: .value("Time", sample.date), y: .value("Score", sample.score))
                        .foregroundStyle(DriftTheme.accent)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                        .interpolationMethod(.catmullRom)
                }

                RuleMark(x: .value("Bedtime", bedtime))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                    .foregroundStyle(DriftTheme.text2)
                    .annotation(position: .top, alignment: .leading, spacing: 2) {
                        Text("bed \(TimeHelpers.fmtTime(bedtime))")
                            .font(.caption2)
                            .foregroundStyle(DriftTheme.text2)
                    }

                if let selectedSample {
                    RuleMark(x: .value("Selected", selectedSample.date))
                        .lineStyle(StrokeStyle(lineWidth: 1))
                        .foregroundStyle(DriftTheme.border)
                    PointMark(x: .value("Time", selectedSample.date), y: .value("Score", selectedSample.score))
                        .foregroundStyle(DriftTheme.text)
                        .symbolSize(60)
                }
            }
            .chartYScale(domain: 0...100)
            .chartYAxis {
                AxisMarks(values: [0, 25, 50, 75, 100]) { _ in
                    AxisGridLine().foregroundStyle(DriftTheme.border.opacity(0.6))
                    AxisValueLabel().foregroundStyle(DriftTheme.text3)
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .hour)) { _ in
                    AxisGridLine().foregroundStyle(.clear)
                    AxisValueLabel(format: .dateTime.hour(), centered: true)
                        .foregroundStyle(DriftTheme.text3)
                }
            }
            .chartOverlay { proxy in
                GeometryReader { geometry in
                    Rectangle()
                        .fill(.clear)
                        .contentShape(Rectangle())
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { value in
                                    let plotFrame = geometry[proxy.plotAreaFrame]
                                    let xPosition = value.location.x - plotFrame.origin.x
                                    guard let date: Date = proxy.value(atX: xPosition) else { return }
                                    selectedSample = currentSamples.min {
                                        abs($0.date.timeIntervalSince(date)) < abs($1.date.timeIntervalSince(date))
                                    }
                                }
                                .onEnded { _ in selectedSample = nil }
                        )
                }
            }
            .frame(height: 200)

            if let selectedSample {
                let costs = InterpretationEngine.categoryCosts(selectedSample.byType).filter { $0.cost > 0 }
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(Int(selectedSample.score.rounded())) at \(TimeHelpers.fmtTime(selectedSample.date))")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(DriftTheme.text)
                    ForEach(costs) { cost in
                        Text("\(cost.label): −\(cost.cost, specifier: "%.1f")")
                            .font(.caption2)
                            .foregroundStyle(DriftTheme.text2)
                    }
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(DriftTheme.surface2, in: RoundedRectangle(cornerRadius: DriftTheme.Radius.field))
            }
        }
        .padding(16)
        .background(DriftTheme.surface, in: RoundedRectangle(cornerRadius: DriftTheme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: DriftTheme.Radius.card).stroke(DriftTheme.border))
    }
}
