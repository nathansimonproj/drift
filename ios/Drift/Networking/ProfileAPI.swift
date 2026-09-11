import Foundation

// GET /profile returns `{}` for a brand-new account with no row yet, or the
// full row otherwise. height/weight are Postgres REAL columns (JSON numbers,
// unlike events' TEXT `amount`), so they decode as Double? here and get
// stringified for the form-friendly Profile model.
struct ProfileResponseDTO: Decodable {
    let name: String?
    let sex: String?
    let height: Double?
    let heightUnit: String?
    let weight: Double?
    let weightUnit: String?
    let targetBedtime: String?

    enum CodingKeys: String, CodingKey {
        case name, sex, height, weight
        case heightUnit = "height_unit"
        case weightUnit = "weight_unit"
        case targetBedtime = "target_bedtime"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decodeIfPresent(String.self, forKey: .name)
        sex = try container.decodeIfPresent(String.self, forKey: .sex)
        height = try container.decodeIfPresent(Double.self, forKey: .height)
        heightUnit = try container.decodeIfPresent(String.self, forKey: .heightUnit)
        weight = try container.decodeIfPresent(Double.self, forKey: .weight)
        weightUnit = try container.decodeIfPresent(String.self, forKey: .weightUnit)
        targetBedtime = try container.decodeIfPresent(String.self, forKey: .targetBedtime)
    }

    var asProfile: Profile {
        Profile(
            name: name ?? "",
            sex: sex ?? "",
            height: height.map(LogEvent.formatNumber) ?? "",
            heightUnit: heightUnit ?? "cm",
            weight: weight.map(LogEvent.formatNumber) ?? "",
            weightUnit: weightUnit ?? "kg",
            targetBedtime: targetBedtime ?? "22:00"
        )
    }
}

private struct ProfileRequestDTO: Encodable {
    let name: String
    let sex: String
    let height: String
    let heightUnit: String
    let weight: String
    let weightUnit: String
    let targetBedtime: String

    init(_ profile: Profile) {
        name = profile.name
        sex = profile.sex
        height = profile.height
        heightUnit = profile.heightUnit
        weight = profile.weight
        weightUnit = profile.weightUnit
        targetBedtime = profile.targetBedtime.isEmpty ? "22:00" : profile.targetBedtime
    }
}

enum ProfileAPI {
    /// nil only when the account has no profile row yet (brand new account).
    static func fetch() async throws -> Profile? {
        let dto: ProfileResponseDTO = try await APIClient.shared.request("/profile")
        if dto.name == nil, dto.sex == nil, dto.height == nil, dto.weight == nil, dto.targetBedtime == nil {
            return nil
        }
        return dto.asProfile
    }

    static func save(_ profile: Profile) async throws {
        let _: OKResponse = try await APIClient.shared.request("/profile", method: "PUT", body: ProfileRequestDTO(profile))
    }
}
