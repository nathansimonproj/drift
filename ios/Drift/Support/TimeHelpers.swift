import Foundation

// Direct port of js/time.js.
enum TimeHelpers {
    /// Parses "HH:MM" into today's Date, assuming yesterday if the result
    /// would be more than 12h in the future (e.g. entering a late-night event
    /// after midnight while still meaning "last night").
    static func parseTimeStrToToday(_ hhmm: String) -> Date? {
        let parts = hhmm.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2 else { return nil }
        var date = Calendar.current.date(
            bySettingHour: parts[0], minute: parts[1], second: 0, of: Date()
        ) ?? Date()
        if date.timeIntervalSinceNow > 12 * 3600 {
            date = Calendar.current.date(byAdding: .day, value: -1, to: date) ?? date
        }
        return date
    }

    static func fmtTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.setLocalizedDateFormatFromTemplate("j:mm")
        return formatter.string(from: date)
    }

    /// "HH:MM" for pre-filling a time picker/field.
    static func toTimeInputValue(_ date: Date) -> String {
        let c = Calendar.current.dateComponents([.hour, .minute], from: date)
        return String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
    }

    /// Local calendar-day key ("YYYY-MM-DD"), bucketing events into real days
    /// instead of a rolling 24h window.
    static func dayKey(_ date: Date) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    static func dayKeyToDate(_ key: String) -> Date? {
        let parts = key.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
    }

    static func fmtDayLabel(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.setLocalizedDateFormatFromTemplate("EEEE MMMM d")
        return formatter.string(from: date)
    }

    /// Today's target bedtime as a Date — tonight if it hasn't passed yet
    /// (with a 2h grace window), otherwise tomorrow night.
    static func targetBedtimeDate(_ hhmm: String) -> Date {
        let parts = hhmm.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2 else { return Date() }
        var date = Calendar.current.date(
            bySettingHour: parts[0], minute: parts[1], second: 0, of: Date()
        ) ?? Date()
        if date.timeIntervalSinceNow < -2 * 3600 {
            date = Calendar.current.date(byAdding: .day, value: 1, to: date) ?? date
        }
        return date
    }

    static func fmtHourLabel(_ date: Date) -> String {
        let hour24 = Calendar.current.component(.hour, from: date)
        let hour = hour24 % 12 == 0 ? 12 : hour24 % 12
        let ampm = hour24 < 12 ? "am" : "pm"
        return "\(hour)\(ampm)"
    }
}
