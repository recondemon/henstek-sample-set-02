import SwiftUI
import UniformTypeIdentifiers

private let ink = Color(red: 0.10, green: 0.14, blue: 0.12)
private let paper = Color(red: 0.95, green: 0.93, blue: 0.87)
private let accent = Color(red: 0.90, green: 0.30, blue: 0.19)
private let cobalt = Color(red: 0.14, green: 0.22, blue: 0.67)
private let citron = Color(red: 0.89, green: 0.91, blue: 0.68)
private let muted = Color(red: 0.38, green: 0.42, blue: 0.36)

@main struct SideAPocketApp: App {
  var body: some Scene { WindowGroup { PocketHome().preferredColorScheme(.light) } }
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
  @State private var tab = 1
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
    }.tint(cobalt)
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
      VStack(alignment: .leading, spacing: 24) {
        masthead
        HStack(alignment: .bottom) {
          Text("WHAT’S\nON.").font(.system(size: 58, weight: .black)).tracking(-4).lineSpacing(-8)
          Spacer()
          Text("THE NOVEMBER\nEDITION / 02").font(.system(size: 9, design: .monospaced))
            .multilineTextAlignment(.trailing)
        }.foregroundStyle(ink)
        ForEach(Array(ListeningSession.all.enumerated()), id: \.element.id) { index, session in
          Button {
            selection = session
          } label: {
            VStack(alignment: .leading, spacing: 16) {
              HStack(alignment: .firstTextBaseline) {
                Text(String(session.date.prefix(2))).font(.system(size: 57, weight: .black))
                  .tracking(-4)
                Text("NOV / " + session.day).font(.system(size: 9, design: .monospaced))
                Spacer()
                Image(systemName: "arrow.up.right").font(.system(size: 26))
              }
              Rectangle().fill(index == 0 ? paper : ink).frame(height: 1)
              Text(session.title.uppercased()).font(.system(size: 38, weight: .black)).tracking(
                -1.8
              ).lineSpacing(-4).multilineTextAlignment(.leading)
              HStack {
                Text(session.genre)
                Spacer()
                Text("$\(session.price) / person")
              }.font(.system(size: 10, design: .monospaced))
              Text(session.time).font(.system(size: 11))
            }.padding(24).frame(maxWidth: .infinity, alignment: .leading)
              .background(index == 0 ? cobalt : index == 1 ? accent : citron)
              .foregroundStyle(index == 0 ? paper : ink)
          }.buttonStyle(.plain).accessibilityLabel("Book " + session.title)
        }
        demoNote
      }.padding(24)
    }.background(paper).toolbar(.hidden, for: .navigationBar)
  }
  private var tickets: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 0) {
        VStack(alignment: .leading, spacing: 23) {
          masthead
          HStack(alignment: .bottom) {
            Text("GOOD\nNIGHTS\nAHEAD.").font(.system(size: 46, weight: .black)).tracking(-3.5)
              .lineSpacing(-7)
            Spacer()
            VStack(spacing: 5) {
              Image(systemName: "ticket").font(.system(size: 25))
              Text("\(store.archive.tickets.count) IN\nYOUR POCKET").font(
                .system(size: 8, design: .monospaced)
              ).multilineTextAlignment(.center)
            }.rotationEffect(.degrees(8)).padding(14).overlay(Circle().stroke(ink, lineWidth: 1))
          }.foregroundStyle(ink)
        }.padding(24).padding(.bottom, 15).background(accent)
        VStack(alignment: .leading, spacing: 24) {
          HStack {
            eyebrow("YOUR TICKETS / LOCAL DEMO")
            Spacer()
            Button {
              tab = 0
            } label: {
              Image(systemName: "plus").font(.system(size: 20)).frame(width: 44, height: 44)
            }.accessibilityLabel("Explore sessions")
          }
          if store.archive.tickets.isEmpty {
            VStack(alignment: .leading, spacing: 16) {
              Text("ROOM FOR\nANOTHER NIGHT.").font(.system(size: 32, weight: .black)).tracking(
                -1.7)
              Text("Nothing booked yet. Find a record worth staying for.").font(.system(size: 14))
              Button("Explore sessions ↗") { tab = 0 }.font(.system(size: 14, weight: .bold))
                .padding(.vertical, 12)
            }.foregroundStyle(ink)
          }
          ForEach(store.archive.tickets) { ticket in
            TicketCard(
              ticket: ticket, onCancel: { store.cancel(ticket.id) }, disabled: store.blocked)
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
      }
    }.background(paper).toolbar(.hidden, for: .navigationBar)
  }
  private var crate: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 24) {
        masthead
        Text("GOOD\nFINDS.").font(.system(size: 58, weight: .black)).tracking(-4).lineSpacing(-8)
          .foregroundStyle(ink)
        HStack {
          eyebrow("YOUR RECORD SHOP FINDS")
          Spacer()
          Text("\(store.archive.saved.count) SAVED").font(.system(size: 10, design: .monospaced))
            .foregroundStyle(cobalt)
        }
        ForEach(CrateRecord.all) { record in
          VStack(spacing: 16) {
            HStack(alignment: .top, spacing: 20) {
              Sleeve(record: record).frame(width: 150)
              VStack(alignment: .leading, spacing: 9) {
                Text(record.title.uppercased()).font(.system(size: 23, weight: .black)).tracking(-1)
                Text(record.artist).font(.system(size: 12)).foregroundStyle(muted)
                Text(record.genre + " / " + record.year).font(.system(size: 8, design: .monospaced))
                Button {
                  store.toggle(record.id)
                } label: {
                  Label(
                    store.archive.saved.contains(record.id) ? "Saved" : "Save",
                    systemImage: store.archive.saved.contains(record.id)
                      ? "bookmark.fill" : "bookmark"
                  ).font(.system(size: 12, weight: .bold)).padding(.vertical, 12)
                }.accessibilityLabel(
                  store.archive.saved.contains(record.id)
                    ? "Unsave \(record.title)" : "Save \(record.title)"
                ).disabled(store.blocked)
              }.frame(maxWidth: .infinity, alignment: .leading)
            }
            Rectangle().fill(ink.opacity(0.25)).frame(height: 1)
          }.foregroundStyle(ink)
        }
        demoNote
      }.padding(24)
    }.background(paper).toolbar(.hidden, for: .navigationBar)
  }
  private var masthead: some View {
    HStack(spacing: 8) {
      Image(systemName: "opticaldisc").font(.system(size: 25, weight: .bold))
      Text("SIDE A").font(.system(size: 24, weight: .black)).tracking(-1.6)
      Spacer()
      Text("POCKET EDITION\nSA-02 / MOBILE").font(.system(size: 8, design: .monospaced))
        .multilineTextAlignment(.trailing)
    }.foregroundStyle(ink).padding(.bottom, 14).overlay(alignment: .bottom) {
      Rectangle().fill(ink).frame(height: 1)
    }
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
          Text(session.title).font(.system(size: 42, weight: .black)).tracking(-1.5)
          Text("\(session.day) \(session.date) · \(session.time)").font(
            .system(size: 11, design: .monospaced)
          ).foregroundStyle(cobalt)
          if store.archive.tickets.contains(where: { $0.session == session.id }) {
            Text(
              "You have a demo ticket for this session. Find it in My tickets; cancel it there to change your booking."
            ).font(.system(size: 16)).lineSpacing(6)
          } else {
            VStack(alignment: .leading, spacing: 10) {
              Text("Example guest name").font(.system(size: 12))
              TextField("Alex Morgan", text: $name).textFieldStyle(.plain).padding(15).background(
                ink.opacity(0.06)
              ).textInputAutocapitalization(.words)
            }
            Stepper("\(party) guests", value: $party, in: 1...min(6, session.seats)).tint(cobalt)
            Divider().overlay(muted)
            HStack {
              Text("Illustrative total")
              Spacer()
              Text("$\(party*session.price)").font(.system(size: 34, weight: .black))
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
            Label("Saved to My tickets", systemImage: "checkmark.circle").foregroundStyle(cobalt)
          }
        }.foregroundStyle(ink).padding(28)
      }.background(paper).toolbar {
        ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() }.tint(cobalt) }
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
    if let session = ticket.event {
      VStack(alignment: .leading, spacing: 0) {
        HStack {
          Text("ADMIT / \(String(format: "%02d",ticket.party))").font(
            .system(size: 11, design: .monospaced))
          Spacer()
          Text("SIDE A").font(.system(size: 18, weight: .black)).tracking(-1)
        }.padding(18).background(cobalt).foregroundStyle(paper)
        VStack(alignment: .leading, spacing: 17) {
          Text(session.title.uppercased()).font(.system(size: 35, weight: .black)).tracking(-1.8)
            .lineSpacing(-3)
          HStack(alignment: .firstTextBaseline) {
            Text(session.date).font(.system(size: 25, weight: .black)).tracking(-1)
            Spacer()
            Text(session.day).font(.system(size: 9, design: .monospaced))
          }
          Text(session.time).font(.system(size: 11, design: .monospaced))
        }.padding(22)
        HStack(spacing: 4) {
          ForEach(0..<30) { _ in Rectangle().fill(ink.opacity(0.35)).frame(height: 1) }
        }.padding(.horizontal, 12)
        VStack(alignment: .leading, spacing: 13) {
          HStack {
            VStack(alignment: .leading, spacing: 5) {
              Text(ticket.name).font(.system(size: 15, weight: .bold))
              Text("\(ticket.party) guests · $\(ticket.party*session.price) demo total").font(
                .system(size: 10))
            }
            Spacer()
            Image(systemName: "opticaldisc").font(.system(size: 32)).foregroundStyle(cobalt)
          }
          Text("DEMO ONLY / NOT VALID FOR ENTRY").font(.system(size: 8, design: .monospaced))
          Button("Cancel demo booking") { cancel = true }.font(.system(size: 11)).underline()
            .disabled(disabled)
        }.padding(22)
      }.foregroundStyle(ink).background(Color(red: 0.99, green: 0.98, blue: 0.94))
        .overlay(Rectangle().stroke(ink, lineWidth: 1)).compositingGroup().shadow(
          color: ink.opacity(0.13), radius: 0, x: 5, y: 5
        )
        .confirmationDialog(
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
      ? accent
      : record.id == "signal"
        ? cobalt : Color(red: 0.34, green: 0.43, blue: 0.28)
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
        Text(record.title.uppercased()).font(.system(size: 29, weight: .black)).tracking(-1.6)
          .frame(
            maxWidth: 220, alignment: .leading)
        Spacer()
        Text("\(record.genre) / 33⅓ RPM").font(.system(size: 8, design: .monospaced)).tracking(1)
      }.padding(14).foregroundStyle(paper)
    }.aspectRatio(1, contentMode: .fit).clipped()
  }
}
