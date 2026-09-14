import SwiftUI

// Port of js/render-log.js's rebuildAmountField()/populateTypeSelect() and
// home-page.js's setupForm(): a type picker whose amount field's shape
// (number / brand-variant / intensity / size) changes with the selected
// type, plus an optional time override.
struct CustomEntryFormView: View {
    let onAdd: (EventType, String, Date) -> Void

    @State private var selectedType: EventType = .coffee
    @State private var numberAmount = ""
    @State private var variantAmount = ""
    @State private var timeString = ""

    private var meta: EventMetadata { selectedType.metadata }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Custom entry")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(DriftTheme.text)

            Picker("Type", selection: $selectedType) {
                ForEach(EventType.active) { type in
                    Text(type.metadata.label).tag(type)
                }
            }
            .pickerStyle(.menu)
            .tint(DriftTheme.text)
            .onChange(of: selectedType) { resetAmountForType() }

            amountField

            HStack {
                Text("Time")
                    .font(.footnote)
                    .foregroundStyle(DriftTheme.text2)
                Spacer()
                TextField("now (HH:MM)", text: $timeString)
                    .keyboardType(.numbersAndPunctuation)
                    .multilineTextAlignment(.trailing)
                    .foregroundStyle(DriftTheme.text)
                    .frame(width: 120)
            }

            Button {
                submit()
            } label: {
                Text("Add").fontWeight(.semibold).frame(maxWidth: .infinity)
            }
            .buttonStyle(DriftPrimaryButtonStyle())
        }
        .padding(16)
        .background(DriftTheme.surface, in: RoundedRectangle(cornerRadius: DriftTheme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: DriftTheme.Radius.card).stroke(DriftTheme.border))
        .onAppear { resetAmountForType() }
    }

    @ViewBuilder
    private var amountField: some View {
        switch meta.amountKind {
        case .number:
            HStack {
                Text(meta.amountFieldLabel)
                    .font(.footnote)
                    .foregroundStyle(DriftTheme.text2)
                Spacer()
                TextField(meta.unit, text: $numberAmount)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .foregroundStyle(DriftTheme.text)
                    .frame(width: 100)
            }
        case .variant:
            Picker(meta.amountFieldLabel, selection: $variantAmount) {
                ForEach(meta.options) { option in
                    Text(option.label).tag(option.value)
                }
            }
            .pickerStyle(.menu)
            .tint(DriftTheme.text)
        case .intensity:
            Picker(meta.amountFieldLabel, selection: $variantAmount) {
                ForEach(intensityOptions, id: \.self) { option in
                    Text(option.capitalized).tag(option)
                }
            }
            .pickerStyle(.segmented)
        case .size:
            Picker(meta.amountFieldLabel, selection: $variantAmount) {
                ForEach(sizeOptions, id: \.self) { option in
                    Text(option.capitalized).tag(option)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    private func resetAmountForType() {
        switch meta.amountKind {
        case .number: numberAmount = meta.defaultAmount
        default: variantAmount = meta.defaultAmount
        }
    }

    private func submit() {
        let amount: String
        switch meta.amountKind {
        case .number:
            guard let value = Double(numberAmount), value >= 0 else { return }
            amount = LogEvent.formatNumber(value)
        default:
            amount = variantAmount
        }
        let time = timeString.isEmpty ? Date() : (TimeHelpers.parseTimeStrToToday(timeString) ?? Date())
        onAdd(selectedType, amount, time)
        timeString = ""
    }
}

#Preview {
    CustomEntryFormView { _, _, _ in }
        .padding()
        .background(DriftTheme.bg)
}
