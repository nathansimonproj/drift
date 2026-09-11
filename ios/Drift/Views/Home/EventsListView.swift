import SwiftUI

// Port of js/render-log.js's renderEventsList() — the What-if dashed-border
// "changed" treatment is M4, not needed until the sandbox mode exists.
struct EventsListView: View {
    let events: [LogEvent]
    let onEdit: (LogEvent) -> Void
    let onDelete: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Today")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(DriftTheme.text)
                .padding(.bottom, 8)

            if events.isEmpty {
                Text("No events logged yet.")
                    .font(.subheadline)
                    .foregroundStyle(DriftTheme.text3)
                    .padding(.vertical, 12)
            } else {
                ForEach(events) { event in
                    if let description = event.description {
                        HStack(spacing: 12) {
                            Text(TimeHelpers.fmtTime(event.time))
                                .font(.footnote)
                                .foregroundStyle(DriftTheme.text3)
                                .frame(width: 56, alignment: .leading)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(description.name)
                                    .foregroundStyle(DriftTheme.text)
                                Text(description.amountLabel)
                                    .font(.caption)
                                    .foregroundStyle(DriftTheme.text3)
                            }
                            Spacer()
                            Button { onEdit(event) } label: {
                                Image(systemName: "pencil")
                            }
                            .tint(DriftTheme.text2)
                            .accessibilityIdentifier("editEvent_\(event.id)")
                            Button(role: .destructive) { onDelete(event.id) } label: {
                                Image(systemName: "xmark")
                            }
                            .tint(DriftTheme.bad)
                            .accessibilityIdentifier("deleteEvent_\(event.id)")
                        }
                        .padding(.vertical, 8)

                        if event.id != events.last?.id {
                            Divider().background(DriftTheme.border)
                        }
                    }
                }
            }
        }
        .padding(16)
        .background(DriftTheme.surface, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(DriftTheme.border))
    }
}
