import XCTest
@testable import Drift

final class TimeHelpersTests: XCTestCase {
    func testDayKeyFormatsAsYYYYMMDD() {
        var components = DateComponents()
        components.year = 2026
        components.month = 3
        components.day = 5
        components.hour = 14
        let date = Calendar.current.date(from: components)!
        XCTAssertEqual(TimeHelpers.dayKey(date), "2026-03-05")
    }

    func testDayKeyRoundTripsThroughDayKeyToDate() {
        let key = "2026-07-04"
        let date = TimeHelpers.dayKeyToDate(key)!
        XCTAssertEqual(TimeHelpers.dayKey(date), key)
    }

    func testToTimeInputValueFormatsHHMMWithZeroPadding() {
        let date = Calendar.current.date(bySettingHour: 9, minute: 5, second: 0, of: Date())!
        XCTAssertEqual(TimeHelpers.toTimeInputValue(date), "09:05")
    }

    func testParseTimeStrToTodayRoundTripsWithToTimeInputValue() {
        let parsed = TimeHelpers.parseTimeStrToToday("14:30")!
        XCTAssertEqual(TimeHelpers.toTimeInputValue(parsed), "14:30")
    }

    func testParseTimeStrToTodayReturnsNilForGarbageInput() {
        XCTAssertNil(TimeHelpers.parseTimeStrToToday("not-a-time"))
        XCTAssertNil(TimeHelpers.parseTimeStrToToday("14"))
    }

    func testTargetBedtimeDateRollsOverToTomorrowIfMoreThan2hPast() {
        // A bedtime of "now minus 3 hours" (clock time) should resolve to
        // tomorrow, matching js/time.js's targetBedtimeDate 2h grace window.
        let threeHoursAgo = Date().addingTimeInterval(-3 * 3600)
        let hhmm = TimeHelpers.toTimeInputValue(threeHoursAgo)
        let resolved = TimeHelpers.targetBedtimeDate(hhmm)
        XCTAssertGreaterThan(resolved, Date(), "a bedtime clock-time from 3h ago should roll to tomorrow")
    }

    func testTargetBedtimeDateStaysTodayIfStillUpcoming() {
        let inTwoHours = Date().addingTimeInterval(2 * 3600)
        let hhmm = TimeHelpers.toTimeInputValue(inTwoHours)
        let resolved = TimeHelpers.targetBedtimeDate(hhmm)
        // Should be today, i.e. within ~24h forward, not pushed to tomorrow.
        XCTAssertLessThan(resolved.timeIntervalSinceNow, 23 * 3600)
    }

    func testFmtHourLabelUsesLowercaseAmPmAndNoLeadingZero() {
        let noon = Calendar.current.date(bySettingHour: 12, minute: 0, second: 0, of: Date())!
        let midnight = Calendar.current.date(bySettingHour: 0, minute: 0, second: 0, of: Date())!
        let ninePM = Calendar.current.date(bySettingHour: 21, minute: 0, second: 0, of: Date())!
        XCTAssertEqual(TimeHelpers.fmtHourLabel(noon), "12pm")
        XCTAssertEqual(TimeHelpers.fmtHourLabel(midnight), "12am")
        XCTAssertEqual(TimeHelpers.fmtHourLabel(ninePM), "9pm")
    }
}
