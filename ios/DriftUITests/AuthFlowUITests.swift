import XCTest

// Exercises the real UI against a live backend (see ios/README.md for how to
// point this at a local server). Requires the app's Keychain to start empty,
// which -clearKeychainForTesting (set up in setUp) guarantees per test run.
final class AuthFlowUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-clearKeychainForTesting"]
        app.launch()
    }

    // XCUITest's typeText(_:) delivers only the first character to a
    // SecureField reliably in the Simulator — a known XCUITest/secure-entry
    // limitation, not an app bug (confirmed by swapping in a plain TextField
    // during debugging: the same batched typeText worked perfectly). Typing
    // one character at a time works around it.
    private func typeSlowly(_ text: String, into element: XCUIElement) {
        for character in text {
            element.tap()
            element.typeText(String(character))
            Thread.sleep(forTimeInterval: 0.15)
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
