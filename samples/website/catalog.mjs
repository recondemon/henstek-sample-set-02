export const sessions = Object.freeze([
  {
    id: "slow",
    day: "FRI",
    date: "06",
    month: "NOV",
    title: "The slow side",
    genre: "Jazz / soul",
    time: "7:00–9:00 PM",
    host: "With Mara Ellis",
    price: 18,
    seats: 8,
    tone: "rust",
  },
  {
    id: "deep",
    day: "SAT",
    date: "07",
    month: "NOV",
    title: "Deep in the groove",
    genre: "Funk / rare cuts",
    time: "8:00–10:00 PM",
    host: "With Jules Park",
    price: 22,
    seats: 6,
    tone: "blue",
  },
  {
    id: "sunday",
    day: "SUN",
    date: "08",
    month: "NOV",
    title: "Sunday, unhurried",
    genre: "Ambient / downbeat",
    time: "4:00–6:00 PM",
    host: "With Sol Bennett",
    price: 12,
    seats: 4,
    tone: "olive",
  },
]);
export const records = Object.freeze([
  {
    id: "tide",
    title: "Low Tide",
    artist: "The Meridian Quartet",
    genre: "JAZZ",
    year: "1978",
    color: "rust",
  },
  {
    id: "signal",
    title: "Night Signal",
    artist: "Nora Vale",
    genre: "SOUL",
    year: "1982",
    color: "blue",
  },
  {
    id: "soft",
    title: "Soft Corners",
    artist: "Parallel Forms",
    genre: "AMBIENT",
    year: "1991",
    color: "olive",
  },
]);
export function booking(value) {
  const session = sessions.find((s) => s.id === value?.session);
  const name = typeof value?.name === "string" ? value.name.trim() : "";
  if (
    !session ||
    !name ||
    name.length > 60 ||
    !Number.isInteger(value.party) ||
    value.party < 1 ||
    value.party > Math.min(6, session.seats)
  )
    throw Error(
      "Choose a session, a name (up to 60 characters), and a party of 1–6 within the available seats.",
    );
  return {
    version: 1,
    session: session.id,
    name,
    party: value.party,
    total: value.party * session.price,
    demo: true,
  };
}
export function savedRecords(value) {
  if (
    !Array.isArray(value) ||
    new Set(value).size !== value.length ||
    value.some((id) => !records.some((r) => r.id === id))
  )
    throw Error("Saved record list is not supported.");
  return [...value];
}
