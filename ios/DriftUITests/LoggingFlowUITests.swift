import XCTest

// Exercises the core logging loop against a live backend (same setup and
// the same known SecureField-typing environment limitation as
// AuthFlowUITests — see its header comment; also excluded from CI for that
// reason).
final class LoggingFlowUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-clearKeychainForTesting"]
        app.launch()
    }

    private func typeSlowly(_ text: String, into element: XCUIElement) {
        for character in text {
            element.tap()
            element.typeText(String(character))
            Thread.sleep(forTimeInterval: 0.35)
        }
    }

    private func registerFreshAccount() {
        let uniqueEmail = "ui-test-\(Int(Date().timeIntervalSince1970))@example.com"
        app.segmentedControls["authModePicker"].buttons["Create account"].tap()

        let emailField = app.textFields["authEmailField"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))
        emailField.tap()
        emailField.typeText(uniqueEmail)

        let passwordField = app.secureTextFields["authPasswordField"]
        passwordField.tap()
        typeSlowly("password123", into: passwordField)

        let confirmField = app.secureTextFields["authConfirmPasswordField"]
        confirmField.tap()
        typeSlowly("password123", into: confirmField)

        app.buttons["authSubmitButton"].tap()
    }

    private func switchToTab(_ name: String) {
        let tab = app.tabBars.buttons[name]
        XCTAssertTrue(tab.waitForExistence(timeout: 5), "expected a \(name) tab")
        tab.tap()
    }

    func testQuickAddCoffeeUpdatesScoreAndAppearsInTodaysList() throws {
        registerFreshAccount()

        // Registration lands on the Forecast tab.
        let scoreValue = app.staticTexts["scoreValue"]
        XCTAssertTrue(scoreValue.waitForExistence(timeout: 10))
        XCTAssertEqual(scoreValue.label, "100", "a brand-new account should start at a clean 100")

        switchToTab("Log")
        app.buttons["quickAdd_coffee"].tap()

        // "No events logged yet." must be gone, and the logged coffee shows
        // up with its resolved name/amount (see LogEvent.description).
        XCTAssertFalse(app.staticTexts["No events logged yet."].exists)
        XCTAssertTrue(app.staticTexts["Coffee"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["135 mg"].waitForExistence(timeout: 5))

        switchToTab("Forecast")
        // The score should move off 100 once a real penalty is logged.
        let scoreChanged = NSPredicate(format: "label != '100'")
        expectation(for: scoreChanged, evaluatedWith: scoreValue)
        waitForExpectations(timeout: 10)
    }

    func testDeletingALoggedEventRemovesItAndRestoresScore() throws {
        registerFreshAccount()

        let scoreValue = app.staticTexts["scoreValue"]
        XCTAssertTrue(scoreValue.waitForExistence(timeout: 10))

        switchToTab("Log")
        app.buttons["quickAdd_coffee"].tap()
        XCTAssertTrue(app.staticTexts["Coffee"].waitForExistence(timeout: 5))

        // The delete button on the event row (identifier is "deleteEvent_<id>";
        // the id is server-assigned so match by prefix).
        let deleteButton = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'deleteEvent_'")).firstMatch
        XCTAssertTrue(deleteButton.waitForExistence(timeout: 5))
        deleteButton.tap()
        XCTAssertTrue(app.staticTexts["No events logged yet."].waitForExistence(timeout: 5))

        switchToTab("Forecast")
        let scoreRestored = NSPredicate(format: "label == '100'")
        expectation(for: scoreRestored, evaluatedWith: scoreValue)
        waitForExpectations(timeout: 10)
    }
}
