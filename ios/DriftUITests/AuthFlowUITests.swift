import XCTest

// Exercises the real UI against a live backend — point Debug builds at a
// local `node server/server.js` (DATABASE_URL pointing at a throwaway
// Postgres db) before running these. Requires the app's Keychain to start
// empty, which -clearKeychainForTesting (set up in setUp) guarantees per
// test run.
//
// KNOWN ENVIRONMENT LIMITATION: typing into a SecureField via XCUITest is
// unreliable in the iOS 26 Simulator (Xcode 26.1) — individual keystrokes
// are sometimes dropped even when the driver reports each one as
// successfully synthesized, which can leave the password short enough that
// the submit button never enables. This was confirmed to be a
// Simulator/XCUITest issue rather than an app bug by temporarily swapping
// the SecureField for a plain TextField, at which point the identical flow
// passed reliably every time. `typeSlowly` (re-tapping the field before
// every character, with a delay) reduces but does not eliminate the drop
// rate. Because of this, CI runs only the DriftTests unit test target
// (see .github/workflows/ios-tests.yml) — these UI tests are meant to be
// run locally/manually against a real Simulator, and a failure here should
// be treated as suspect until reproduced a few times.
final class AuthFlowUITests: XCTestCase {
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

    func testRegisterThenSignOutThenSignIn() throws {
        let uniqueEmail = "ui-test-\(Int(Date().timeIntervalSince1970))@example.com"
        let password = "password123"

        // Register a brand-new account.
        app.segmentedControls["authModePicker"].buttons["Create account"].tap()

        let emailField = app.textFields["authEmailField"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))
        emailField.tap()
        emailField.typeText(uniqueEmail)

        let passwordField = app.secureTextFields["authPasswordField"]
        passwordField.tap()
        typeSlowly(password, into: passwordField)

        let confirmField = app.secureTextFields["authConfirmPasswordField"]
        confirmField.tap()
        typeSlowly(password, into: confirmField)

        app.buttons["authSubmitButton"].tap()

        // The quick-add grid only exists on the real HomeView, so its
        // presence is proof registration landed us there.
        let coffeeQuickAdd = app.staticTexts["Coffee (12oz)"]
        XCTAssertTrue(coffeeQuickAdd.waitForExistence(timeout: 10), "expected to land on HomeView after registering")

        // Sign out (behind the toolbar menu) drops back to the auth screen.
        app.buttons["accountMenuButton"].tap()
        app.buttons["Sign out"].tap()
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))

        // Signing back in with the same credentials works too.
        emailField.tap()
        emailField.typeText(uniqueEmail)
        passwordField.tap()
        typeSlowly(password, into: passwordField)
        app.buttons["authSubmitButton"].tap()

        XCTAssertTrue(coffeeQuickAdd.waitForExistence(timeout: 10), "expected to sign back in with the same credentials")
    }
}
