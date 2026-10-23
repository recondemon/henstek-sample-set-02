import Foundation

@main struct PocketChecks {
  static func main() throws {
    let original = PocketArchive.example
    let roundtrip = try PocketArchive.decode(original.encoded())
    precondition(roundtrip == original)
    func rejects(_ value: PocketArchive) {
      do {
        _ = try value.validated()
        fatalError("Invalid archive was accepted")
      } catch {}
    }
    var bad = original
    bad.tickets.append(bad.tickets[0])
    rejects(bad)
    bad = original
    bad.tickets[0].party = 7
    rejects(bad)
    bad = original
    bad.tickets[0].session = "unknown"
    rejects(bad)
    bad = original
    bad.tickets[0].name = " "
    rejects(bad)
    bad = original
    bad.saved = ["unknown"]
    rejects(bad)
    bad = original
    bad.saved = ["tide", "tide"]
    rejects(bad)
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    defer { try? FileManager.default.removeItem(at: directory) }
    let disk = PocketDisk(directory: directory)
    let initial = try disk.load()
    precondition(initial == original)
    try disk.save(original)
    var changed = original
    changed.tickets[0].party = 3
    try disk.save(changed)
    let loaded = try disk.load()
    precondition(loaded == changed)
    let previous = try PocketArchive.decode(
      Data(contentsOf: directory.appendingPathComponent("pocket.previous.json")))
    precondition(previous == original)
    let broken = Data("broken".utf8)
    try broken.write(to: disk.file)
    do {
      _ = try disk.load()
      fatalError("Damaged file accepted")
    } catch {}
    do {
      try disk.save(original)
      fatalError("Damaged file overwritten")
    } catch {}
    let preserved = try Data(contentsOf: disk.file)
    precondition(preserved == broken)
    print(
      "Pocket checks passed: archive validation, round trip, local persistence and damaged-file preservation."
    )
  }
}
