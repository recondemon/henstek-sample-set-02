(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SideAModel = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const sessions = [
    { id: "slow", title: "The slow side", day: "FRI 06 NOV", time: "7:00–9:00 PM", capacity: 24 },
    {
      id: "deep",
      title: "Deep in the groove",
      day: "SAT 07 NOV",
      time: "8:00–10:00 PM",
      capacity: 24,
    },
    {
      id: "sunday",
      title: "Sunday, unhurried",
      day: "SUN 08 NOV",
      time: "4:00–6:00 PM",
      capacity: 18,
    },
  ];
  const seed = {
    version: 1,
    guests: [
      {
        id: "sa-001",
        name: "Alex Morgan",
        session: "slow",
        party: 2,
        status: "arrived",
        note: "Window seats, if available.",
      },
      {
        id: "sa-002",
        name: "Jamie Reed",
        session: "slow",
        party: 4,
        status: "booked",
        note: "Celebrating a birthday.",
      },
      {
        id: "sa-003",
        name: "Casey Brooks",
        session: "slow",
        party: 2,
        status: "booked",
        note: "First visit.",
      },
      {
        id: "sa-004",
        name: "Robin Ellis",
        session: "slow",
        party: 1,
        status: "arrived",
        note: "Listening counter.",
      },
      { id: "sa-005", name: "Taylor Quinn", session: "slow", party: 3, status: "booked", note: "" },
      {
        id: "sa-006",
        name: "Avery Lane",
        session: "deep",
        party: 2,
        status: "booked",
        note: "Near the speakers.",
      },
      {
        id: "sa-007",
        name: "Jordan Wells",
        session: "sunday",
        party: 2,
        status: "booked",
        note: "",
      },
      {
        id: "sa-008",
        name: "Drew Parker",
        session: "slow",
        party: 2,
        status: "canceled",
        note: "Changed plans.",
      },
    ],
  };
  function validate(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.guests) || value.guests.length > 500)
      throw Error("Choose a Side A guest-list version 1 file with up to 500 bookings.");
    const seen = new Set();
    const guests = value.guests.map((g) => {
      if (
        !g ||
        typeof g.id !== "string" ||
        !/^[a-zA-Z0-9-]{1,60}$/.test(g.id) ||
        seen.has(g.id) ||
        typeof g.name !== "string" ||
        !g.name.trim() ||
        g.name.length > 60 ||
        !sessions.some((s) => s.id === g.session) ||
        !Number.isInteger(g.party) ||
        g.party < 1 ||
        g.party > 6 ||
        !["booked", "arrived", "canceled"].includes(g.status) ||
        typeof g.note !== "string" ||
        g.note.length > 500
      )
        throw Error(
          "Each booking needs a unique ID, name, valid session, 1–6 guests, status and a note under 500 characters.",
        );
      seen.add(g.id);
      return {
        id: g.id,
        name: g.name.trim(),
        session: g.session,
        party: g.party,
        status: g.status,
        note: g.note,
      };
    });
    for (const s of sessions) {
      if (
        guests
          .filter((g) => g.session === s.id && g.status !== "canceled")
          .reduce((n, g) => n + g.party, 0) > s.capacity
      )
        throw Error(
          `${s.title} exceeds its ${s.capacity}-seat capacity. Cancel or move another booking first.`,
        );
    }
    return { version: 1, guests };
  }
  function totals(guests, session) {
    const rows = guests.filter((g) => g.session === session);
    return {
      reserved: rows.filter((g) => g.status !== "canceled").reduce((n, g) => n + g.party, 0),
      arrived: rows.filter((g) => g.status === "arrived").reduce((n, g) => n + g.party, 0),
      parties: rows.filter((g) => g.status !== "canceled").length,
    };
  }
  return { seed, sessions, validate, totals };
});
