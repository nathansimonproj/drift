import SwiftUI

// Port of js/home-page.js's openEditModal()/saveEditModal() — same
// type/amount field logic as CustomEntryFormView, pre-filled from the event
// being edited.
struct EditEventSheet: View {
    let event: LogEvent
    let onSave: (String, EventType, String, Date) -> Void
    let onDelete: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var selectedType: EventType
    @State private var numberAmount = ""
    @State private var variantAmount = ""
    @State private var timeString: String
    @State private var showDeleteConfirm = false

    init(event: LogEvent, onSave: @escaping (String, EventType, String, Date) -> Void, onDelete: @escaping (String) -> Void) {
        self.event = event
        self.onSave = onSave
        self.onDelete = onDelete
        _selectedType = State(initialValue: event.type)
        _timeString = State(initialValue: TimeHelpers.toTimeInputValue(event.time))
        switch event.type.metadata.amountKind {
        case .number: _numberAmount = State(initialValue: event.amount)
        default: _variantAmount = State(initialValue: event.amount)
        }
    }

    private var meta: EventMetadata { selectedType.metadata }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Type", selection: $selectedType) {
                        ForEach(EventType.active) { type in
                            Text(type.metadata.label).tag(type)
                        }
                    }
                    .onChange(of: selectedType) { resetAmountForType() }

                    amountField

                    HStack {
                        Text("Time")
                        Spacer()
                        TextField("HH:MM", text: $timeString)
                            .keyboardType(.numbersAndPunctuation)
                            .multilineTextAlignment(.trailing)
                    }
                }
                .listRowBackground(DriftTheme.surface2)

                Section {
                    Button("Delete event", role: .destructive) { showDeleteConfirm = true }
                }
                .listRowBackground(DriftTheme.surface2)
            }
            .scrollContentBackground(.hidden)
            .background(DriftTheme.bg)
            .navigationTitle("Edit event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                }
            }
            .confirmationDialog(
                "Delete this event?", isPresented: $showDeleteConfirm, titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    onDelete(event.id)
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            }
        }
        .preferredColorScheme(.dark)
    }

    @ViewBuilder
    private var amountField: some View {
        switch meta.amountKind {
        case .number:
            HStack {
                Text(meta.amountFieldLabel)
                Spacer()
                TextField(meta.unit, text: $numberAmount)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
            }
        case .variant:
            Picker(meta.amountFieldLabel, selection: $variantAmount) {
                ForEach(meta.options) { option in
                    Text(option.label).tag(option.value)
                }
            }
        case .intensity:
            Picker(meta.amountFieldLabel, selection: $variantAmount) {
                ForEach(intensityOptions, id: \.self) { option in
                    Text(option.capitalized).tag(option)
                }
            }
        case .size:
            Picker(meta.amountFieldLabel, selection: $variantAmount) {
                ForEach(sizeOptions, id: \.self) { option in
                    Text(option.capitalized).tag(option)
                }
            }
        }
    }

    private func resetAmountForType() {
        switch meta.amountKind {
        case .number: numberAmount = meta.defaultAmount
        default: variantAmount = meta.defaultAmount
        }
    }

    private func save() {
        let amount: String
        switch meta.amountKind {
        case .number:
            guard let value = Double(numberAmount), value >= 0 else { return }
            amount = LogEvent.formatNumber(value)
        default:
            amount = variantAmount
        }
        let time = timeString.isEmpty ? event.time : (TimeHelpers.parseTimeStrToToday(timeString) ?? event.time)
        onSave(event.id, selectedType, amount, time)
        dismiss()
    }
}
