import Foundation

// Mirrors js/state.js's STATE.settings / server/profile.js's row shape.
struct Profile: Equatable, Codable {
    var name: String = ""
    var sex: String = ""
    var height: String = ""
    var heightUnit: String = "cm"
    var weight: String = ""
    var weightUnit: String = "kg"
    var targetBedtime: String = "22:00"
}
