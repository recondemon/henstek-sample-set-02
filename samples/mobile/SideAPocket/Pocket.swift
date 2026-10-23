import Foundation

struct ListeningSession: Identifiable {
  let id: String
  let title: String
  let day: String
  let date: String
  let time: String
  let genre: String
  let price: Int
  let seats: Int
  static let all = [
    ListeningSession(
      id: "slow", title: "The slow side", day: "FRIDAY", date: "06 NOV", time: "7:00–9:00 PM",
      genre: "Jazz / soul", price: 18, seats: 8),
    ListeningSession(
      id: "deep", title: "Deep in the groove", day: "SATURDAY", date: "07 NOV",
      time: "8:00–10:00 PM", genre: "Funk / rare cuts", price: 22, seats: 6),
    ListeningSession(
      id: "sunday", title: "Sunday, unhurried", day: "SUNDAY", date: "08 NOV", time: "4:00–6:00 PM",
      genre: "Ambient / downbeat", price: 12, seats: 4),
  ]
}
struct CrateRecord: Identifiable {
  let id: String
  let title: String
  let artist: String
  let genre: String
  let year: String
  static let all = [
    CrateRecord(
      id: "tide", title: "Low Tide", artist: "The Meridian Quartet", genre: "JAZZ", year: "1978"),
    CrateRecord(
      id: "signal", title: "Night Signal", artist: "Nora Vale", genre: "SOUL", year: "1982"),
    CrateRecord(
      id: "soft", title: "Soft Corners", artist: "Parallel Forms", genre: "AMBIENT", year: "1991"),
  ]
}
struct Ticket: Codable, Identifiable, Equatable {
  var id: UUID
  var session: String
  var name: String
  var party: Int
  var event: ListeningSession? { ListeningSession.all.first { $0.id == session } }
}
struct PocketArchive: Codable, Equatable {
  var version = 1
  var tickets: [Ticket]
  var saved: [String]
  static let example = PocketArchive(
    tickets: [
      Ticket(
        id: UUID(uuidString: "00000000-0000-4000-8000-000000000001")!, session: "slow",
        name: "Alex Morgan", party: 2)
    ], saved: ["tide"])
  func validated() throws -> PocketArchive {
    guard version == 1, tickets.count <= 3, Set(tickets.map(\.id)).count == tickets.count,
      Set(tickets.map(\.session)).count == tickets.count, saved.count <= 3,
      Set(saved).count == saved.count,
      saved.allSatisfy({ id in CrateRecord.all.contains { $0.id == id } })
    else { throw PocketError.invalid }
    for t in tickets {
      guard let s = t.event, !t.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
        t.name.count <= 60, t.party >= 1, t.party <= min(6, s.seats)
      else { throw PocketError.invalid }
    }
    return self
  }
  static func decode(_ data: Data) throws -> PocketArchive {
    guard data.count <= 100_000 else { throw PocketError.invalid }
    return try JSONDecoder().decode(PocketArchive.self, from: data).validated()
  }
  func encoded() throws -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    return try encoder.encode(validated())
  }
}
enum PocketError: LocalizedError {
  case invalid
  var errorDescription: String? {
    "Choose a Side A Pocket version 1 export, under 100 KB. One ticket per session, 1–6 guests within availability, and names up to 60 characters are supported."
  }
}
struct PocketDisk {
  let directory: URL
  var file: URL { directory.appendingPathComponent("pocket.json") }
  func load() throws -> PocketArchive {
    if !FileManager.default.fileExists(atPath: file.path) { return .example }
    return try PocketArchive.decode(Data(contentsOf: file))
  }
  func save(_ archive: PocketArchive) throws {
    let data = try archive.encoded()
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    if FileManager.default.fileExists(atPath: file.path) {
      let old = try Data(contentsOf: file)
      _ = try PocketArchive.decode(old)
      try old.write(to: directory.appendingPathComponent("pocket.previous.json"), options: .atomic)
    }
    try data.write(to: file, options: .atomic)
  }
}
