import Foundation

enum APIError: Error {
    case transport
    case decoding
    case unauthorized
    case server(status: Int, message: String?)
}

struct APIErrorBody: Decodable {
    let error: String?
}
