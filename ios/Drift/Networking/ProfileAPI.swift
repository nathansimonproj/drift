import Foundation

// Full profile editing (name/sex/height/weight) is M3 — for now this only
// carries what the forecast needs: target bedtime.
struct ProfileResponseDTO: Decodable {
    let targetBedtime: String?

    enum CodingKeys: String, CodingKey {
        case targetBedtime = "target_bedtime"
    }

    // GET /profile returns `{}` for a brand-new account with no row yet.
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        targetBedtime = try container.decodeIfPresent(String.self, forKey: .targetBedtime)
    }
}

enum ProfileAPI {
    static func fetch() async throws -> String? {
        let dto: ProfileResponseDTO = try await APIClient.shared.request("/profile")
        return dto.targetBedtime
    }
}
