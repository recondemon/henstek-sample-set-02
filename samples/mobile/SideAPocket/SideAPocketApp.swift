import SwiftUI
import UniformTypeIdentifiers

private let ink = Color(red: 0.098, green: 0.090, blue: 0.086)
private let paper = Color(red: 0.93, green: 0.91, blue: 0.86)
private let accent = Color(red: 0.945, green: 0.416, blue: 0.314)
private let muted = Color(red: 0.68, green: 0.64, blue: 0.59)

@main struct SideAPocketApp: App {
  var body: some Scene { WindowGroup { PocketHome().preferredColorScheme(.dark) } }
}
@MainActor final class PocketStore: ObservableObject {
  @Published var archive = PocketArchive(tickets: [], saved: [])
  @Published var error: String?
  @Published var blocked = false
  let disk: PocketDisk
  init() {
    disk = PocketDisk(
      directory: FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("SideAPocket"))
    do { archive = try disk.load() } catch {
      blocked = true
      self.error =
        "Saved data needs recovery. It has not been overwritten. " + error.localizedDescription
    }
  }
  @discardableResult func save(_ next: PocketArchive) -> Bool {
    guard !blocked else {
      error = "Preserve pocket.json and pocket.previous.json before attempting recovery."
      return false
    }
    do {
      try disk.save(next)
      archive = next
      return true
    } catch {
      self.error = error.localizedDescription
      return false
    }
  }
  func toggle(_ id: String) {
    var next = archive
    if next.saved.contains(id) { next.saved.removeAll { $0 == id } } else { next.saved.append(id) }
    save(next)
  }
  func cancel(_ id: UUID) {
    var next = archive
    next.tickets.removeAll { $0.id == id }
    save(next)
  }
}
struct PocketDocument: FileDocument {
  static var readableContentTypes: [UTType] { [.json] }
  var data: Data
  init(_ archive: PocketArchive) throws { data = try archive.encoded() }
  init(configuration: ReadConfiguration) throws {
    guard let data = configuration.file.regularFileContents else { throw PocketError.invalid }
    _ = try PocketArchive.decode(data)
    self.data = data
  }
  func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
    FileWrapper(regularFileWithContents: data)
  }
}
struct PocketHome: View {
  @StateObject private var store = PocketStore()
  @State private var tab = 0
  @State private var selection: ListeningSession?
  @State private var exporting = false
  @State private var importing = false
  @State private var document: PocketDocument?
  @State private var pendingImport: PocketArchive?
  @State private var confirmImport = false
  var body: some View {
    TabView(selection: $tab) {
      NavigationStack { tonight }.tabItem { Label("Discover", systemImage: "opticaldisc") }.tag(0)
      NavigationStack { tickets }.tabItem { Label("My tickets", systemImage: "ticket") }.tag(1)
      NavigationStack { crate }.tabItem { Label("My crate", systemImage: "square.stack") }.tag(2)
    }.tint(accent)
      .sheet(item: $selection) { s in ReservationSheet(session: s, store: store) }
      .alert(
        "A little attention needed",
        isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })
      ) {
        Button("OK") { store.error = nil }
      } message: {
        Text(store.error ?? "")
      }
      .fileExporter(
        isPresented: $exporting, document: document, contentType: .json,
        defaultFilename: "side-a-pocket"
      ) { if case .failure(let e) = $0 { store.error = e.localizedDescription } }
      .fileImporter(isPresented: $importing, allowedContentTypes: [.json]) { result in
        do {
          let url = try result.get()
          let access = url.startAccessingSecurityScopedResource()
          defer { if access { url.stopAccessingSecurityScopedResource() } }
          let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
          guard size <= 100_000 else { throw PocketError.invalid }
          pendingImport = try PocketArchive.decode(Data(contentsOf: url))
          confirmImport = true
        } catch { store.error = error.localizedDescription }
      }
      .confirmationDialog(
        "Replace your local tickets and crate?", isPresented: $confirmImport,
        titleVisibility: .visible
      ) {
        Button("Replace with imported copy", role: .destructive) {
          if let next = pendingImport { store.save(next) }
          pendingImport = nil
        }
        Button("Keep current data", role: .cancel) { pendingImport = nil }
      } message: {
        Text(
          "Export your current copy first if you want to keep it. This does not affect the website or desktop demo."
        )
      }
  }
  private var tonight: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 26) {
        masthead
        VStack(alignment: .leading, spacing: 8) {
          eyebrow("GOOD EVENINGS START HERE.")
          Text("Make a little\nroom for music.").font(
            .system(size: 43, weight: .regular, design: .serif)
          ).tracking(-1.8).lineSpacing(-3).foregroundStyle(paper)
        }
        ZStack(alignment: .bottomLeading) {
          Image("ListeningRoom").resizable().scaledToFill().frame(height: 220).clipped()
          LinearGradient(
            colors: [.clear, .black.opacity(0.8)], startPoint: .center, endPoint: .bottom)
          HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 7) {
              Text("FEATURED SESSION").font(.system(size: 8, design: .monospaced)).tracking(1.2)
              Text("The slow side").font(.system(size: 29, design: .serif))
              Text("FRI 06 NOV · 7:00 PM").font(.system(size: 9, design: .monospaced))
            }
            Spacer()
            Button {
              selection = ListeningSession.all[0]
            } label: {
              Image(systemName: "arrow.up.right").font(.system(size: 18)).frame(
                width: 44, height: 44
              ).background(accent).foregroundStyle(ink)
            }.accessibilityLabel("Book The slow side")
          }.foregroundStyle(paper).padding(22)
        }.frame(height: 220)
        HStack {
          Text("On the turntable").font(.system(size: 26, design: .serif))
          Spacer()
          eyebrow("NOV / DEMO")
        }.foregroundStyle(paper)
        VStack(spacing: 0) {
          ForEach(ListeningSession.all) { s in
            Button {
              selection = s
            } label: {
              sessionRow(s)
            }.buttonStyle(.plain)
            Divider().overlay(muted.opacity(0.3))
          }
        }
        demoNote
      }.padding(.horizontal, 24).padding(.top, 12).padding(.bottom, 24)
    }.background(ink).toolbar(.hidden, for: .navigationBar)
  }
  private var tickets: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 25) {
        masthead
        eyebrow("A LITTLE SOMETHING TO LOOK FORWARD TO.")
        Text("Your next\ngood evening.").font(.system(size: 43, design: .serif)).tracking(-1.7)
          .foregroundStyle(paper)
        if store.archive.tickets.isEmpty {
          VStack(alignment: .leading, spacing: 18) {
            Text("No tickets in your pocket.").font(.system(size: 25, design: .serif))
            Text("Explore the programme and add a demo booking.").font(.system(size: 14))
            Button("Explore sessions ↗") { tab = 0 }.tint(accent)
          }.foregroundStyle(paper).padding(.vertical, 35)
        }
        ForEach(store.archive.tickets) { t in
          TicketCard(ticket: t, onCancel: { store.cancel(t.id) }, disabled: store.blocked)
        }
        HStack {
          Button("Export backup") {
            do {
              document = try PocketDocument(store.archive)
              exporting = true
            } catch { store.error = error.localizedDescription }
          }
          Spacer()
          Button("Import backup") { importing = true }
        }.font(.system(size: 12)).disabled(store.blocked).padding(.vertical, 15)
        demoNote
      }.padding(24)
    }.background(ink).toolbar(.hidden, for: .navigationBar)
  }
  private var crate: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 25) {
        masthead
        eyebrow("SIDE A SELECTS / FICTIONAL RELEASES")
        HStack(alignment: .bottom) {
          Text("Keep it\non repeat.").font(.system(size: 43, design: .serif)).tracking(-1.7)
          Spacer()
          Text("\(store.archive.saved.count) SAVED").font(.system(size: 10, design: .monospaced))
            .foregroundStyle(accent)
        }.foregroundStyle(paper)
        ForEach(CrateRecord.all) { record in
          VStack(alignment: .leading, spacing: 15) {
            Sleeve(record: record)
            HStack {
              VStack(alignment: .leading, spacing: 6) {
                Text(record.title).font(.system(size: 17, weight: .medium))
                Text(record.artist).font(.system(size: 12)).foregroundStyle(muted)
              }
              Spacer()
              Button {
                store.toggle(record.id)
              } label: {
                Image(
                  systemName: store.archive.saved.contains(record.id) ? "bookmark.fill" : "bookmark"
                ).frame(width: 44, height: 44).overlay(Rectangle().stroke(muted.opacity(0.4)))
              }.accessibilityLabel(
                store.archive.saved.contains(record.id)
                  ? "Unsave \(record.title)" : "Save \(record.title)"
              ).disabled(store.blocked)
            }.foregroundStyle(paper)
          }.padding(.bottom, 15)
        }
        demoNote
      }.padding(24)
    }.background(ink).toolbar(.hidden, for: .navigationBar)
  }
  private var masthead: some View {
    HStack(spacing: 9) {
      ZStack {
        Circle().fill(accent).frame(width: 34, height: 34)
        Circle().stroke(ink, lineWidth: 1).frame(width: 27, height: 27)
        Text("A").font(.system(size: 24, weight: .black)).foregroundStyle(ink)
      }
      Text("SIDE A").font(.system(size: 25, weight: .black, design: .rounded)).tracking(-1.5)
        .foregroundStyle(paper)
      Spacer()
      Text("POCKET\nSA-02").font(.system(size: 8, design: .monospaced)).tracking(1)
        .multilineTextAlignment(.trailing).foregroundStyle(muted)
    }.padding(.bottom, 12).overlay(alignment: .bottom) {
      Rectangle().fill(muted.opacity(0.3)).frame(height: 1)
    }
  }
  private func sessionRow(_ s: ListeningSession) -> some View {
    HStack(spacing: 16) {
      VStack(spacing: 3) {
        Text(String(s.day.prefix(3))).font(.system(size: 8, design: .monospaced))
        Text(String(s.date.prefix(2))).font(.system(size: 28, design: .serif))
      }.foregroundStyle(accent).frame(width: 35)
      VStack(alignment: .leading, spacing: 6) {
        Text(s.title).font(.system(size: 20, design: .serif)).foregroundStyle(paper)
        Text("\(s.genre) · \(s.time)").font(.system(size: 10)).foregroundStyle(muted)
      }
      Spacer()
      Image(systemName: "arrow.up.right").foregroundStyle(muted)
    }.padding(.vertical, 19).contentShape(Rectangle())
  }
  private var demoNote: some View {
    Text(
      "SA-02 / MOBILE · Independent local sample. Fictional sessions and records. No payment, real reservation or cloud sync."
    ).font(.system(size: 10)).lineSpacing(4).foregroundStyle(muted)
  }
}
private func eyebrow(_ text: String) -> some View {
  Text(text).font(.system(size: 9, design: .monospaced)).tracking(1.1).foregroundStyle(muted)
}
struct ReservationSheet: View {
  let session: ListeningSession
  @ObservedObject var store: PocketStore
  @Environment(\.dismiss) private var dismiss
  @State private var name = "Alex Morgan"
  @State private var party = 2
  @State private var saved = false
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 24) {
          eyebrow("YOUR NIGHT / DEMO ONLY")
          Text(session.title).font(.system(size: 42, design: .serif)).tracking(-1.5)
          Text("\(session.day) \(session.date) · \(session.time)").font(
            .system(size: 11, design: .monospaced)
          ).foregroundStyle(accent)
          if store.archive.tickets.contains(where: { $0.session == session.id }) {
            Text(
              "You have a demo ticket for this session. Find it in My tickets; cancel it there to change your booking."
            ).font(.system(size: 16)).lineSpacing(6)
          } else {
            VStack(alignment: .leading, spacing: 10) {
              Text("Example guest name").font(.system(size: 12))
              TextField("Alex Morgan", text: $name).textFieldStyle(.plain).padding(15).background(
                paper.opacity(0.08)
              ).textInputAutocapitalization(.words)
            }
            Stepper("\(party) guests", value: $party, in: 1...min(6, session.seats)).tint(accent)
            Divider().overlay(muted)
            HStack {
              Text("Illustrative total")
              Spacer()
              Text("$\(party*session.price)").font(.system(size: 34, design: .serif))
            }
            Text(
              "Fictional details only. This creates a ticket on this device. It does not hold a seat or take payment."
            ).font(.system(size: 12)).lineSpacing(5).foregroundStyle(muted)
            Button {
              var next = store.archive
              next.tickets.append(
                Ticket(
                  id: UUID(), session: session.id,
                  name: name.trimmingCharacters(in: .whitespacesAndNewlines), party: party))
              if store.save(next) { saved = true }
            } label: {
              HStack {
                Text("Create demo ticket")
                Spacer()
                Image(systemName: "arrow.up.right")
              }.font(.system(size: 14, weight: .semibold)).foregroundStyle(ink).padding(18)
                .background(accent)
            }.disabled(
              store.blocked || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                || name.count > 60)
          }
          if saved {
            Label("Saved to My tickets", systemImage: "checkmark.circle").foregroundStyle(accent)
          }
        }.foregroundStyle(paper).padding(28)
      }.background(ink).toolbar {
        ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() }.tint(accent) }
      }
    }.presentationDetents([.large])
  }
}
struct TicketCard: View {
  let ticket: Ticket
  let onCancel: () -> Void
  let disabled: Bool
  @State private var cancel = false
  var body: some View {
    if let s = ticket.event {
      VStack(alignment: .leading, spacing: 20) {
        HStack {
          Text("SIDE A / LISTENING ROOM").font(.system(size: 9, design: .monospaced))
          Spacer()
          Image(systemName: "opticaldisc")
        }
        Text(s.title).font(.system(size: 34, design: .serif)).tracking(-1)
        Text("\(s.day) \(s.date)\n\(s.time)").font(.system(size: 12, design: .monospaced))
          .lineSpacing(6)
        Rectangle().fill(ink.opacity(0.2)).frame(height: 1)
        HStack {
          VStack(alignment: .leading, spacing: 6) {
            Text(ticket.name).font(.system(size: 16, weight: .medium))
            Text("\(ticket.party) guests · $\(ticket.party*s.price) illustrative total").font(
              .system(size: 11))
          }
          Spacer()
          Text("A").font(.system(size: 42, weight: .black))
        }
        Text("DEMO ONLY · NOT VALID FOR ENTRY").font(.system(size: 8, design: .monospaced))
          .tracking(1)
        Button("Cancel demo booking") { cancel = true }.font(.system(size: 12)).underline()
          .disabled(disabled)
      }.foregroundStyle(ink).padding(26).background(paper).confirmationDialog(
        "Cancel this demo booking?", isPresented: $cancel, titleVisibility: .visible
      ) {
        Button("Cancel booking", role: .destructive) { onCancel() }
        Button("Keep ticket", role: .cancel) {}
      }
    }
  }
}
struct Sleeve: View {
  let record: CrateRecord
  private var color: Color {
    record.id == "tide"
      ? Color(red: 0.56, green: 0.24, blue: 0.18)
      : record.id == "signal"
        ? Color(red: 0.16, green: 0.24, blue: 0.32) : Color(red: 0.33, green: 0.36, blue: 0.25)
  }
  var body: some View {
    ZStack(alignment: .topLeading) {
      color
      GeometryReader { g in
        ForEach(0..<5) { i in
          Circle().stroke(paper.opacity(0.12), lineWidth: 12).frame(
            width: g.size.width * 0.9 + CGFloat(i * 24)
          ).offset(
            x: g.size.width * 0.35 - CGFloat(i * 12), y: g.size.width * 0.3 - CGFloat(i * 12))
        }
      }
      VStack(alignment: .leading) {
        Text("SIDE A SELECTS / \(record.year)").font(.system(size: 8, design: .monospaced))
          .tracking(1)
        Spacer()
        Text(record.title).font(.system(size: 56, design: .serif)).tracking(-2).frame(
          maxWidth: 220, alignment: .leading)
        Spacer()
        Text("\(record.genre) / 33⅓ RPM").font(.system(size: 8, design: .monospaced)).tracking(1)
      }.padding(24).foregroundStyle(paper)
    }.aspectRatio(1, contentMode: .fit).clipped()
  }
}
