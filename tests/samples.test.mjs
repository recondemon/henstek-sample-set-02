import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, readFile, writeFile, rm, readdir, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { booking, savedRecords } from "../samples/website/catalog.mjs";
const require = createRequire(import.meta.url),
  { seed, validate, totals } = require("../samples/desktop/model.js"),
  { Store } = require("../samples/desktop/store.cjs"),
  { isAppPage } = require("../samples/desktop/security.cjs");
test("booking totals are computed from the catalogue, and unsupported names or parties are rejected", () => {
  assert.deepEqual(booking({ session: "slow", name: " Alex ", party: 2, total: 1 }), {
    version: 1,
    session: "slow",
    name: "Alex",
    party: 2,
    total: 36,
    demo: true,
  });
  for (const change of [
    { party: 0 },
    { party: 7 },
    { party: 1.5 },
    { name: " " },
    { session: "unknown" },
    { name: "x".repeat(61) },
  ])
    assert.throws(() => booking({ session: "slow", name: "Alex", party: 2, ...change }));
  assert.throws(() => booking({ session: "sunday", name: "Alex", party: 5 }));
});
test("record imports reject duplicates and unsupported IDs", () => {
  assert.deepEqual(savedRecords(["tide"]), ["tide"]);
  for (const value of [["tide", "tide"], ["constructor"], {}, null])
    assert.throws(() => savedRecords(value));
});
test("guest counts exclude cancellations, include arrivals and enforce total session capacity", () => {
  assert.deepEqual(totals(seed.guests, "slow"), { reserved: 12, arrived: 3, parties: 5 });
  const next = structuredClone(seed);
  for (let i = 0; i < 3; i++)
    next.guests.push({
      id: "new-" + i,
      name: "Sample Guest",
      session: "slow",
      party: 6,
      status: "booked",
      note: "",
    });
  assert.throws(() => validate(next), /capacity/);
  next.guests.at(-1).status = "canceled";
  assert.equal(totals(validate(next).guests, "slow").reserved, 24);
});
test("guest archive validates IDs, lengths, statuses and integer party size", () => {
  assert.deepEqual(validate(seed), seed);
  for (const change of [
    { party: 0 },
    { party: 2.5 },
    { status: "paid" },
    { note: "x".repeat(501) },
    { name: "" },
    { session: "bad" },
    { id: "<img>" },
  ]) {
    const next = structuredClone(seed);
    Object.assign(next.guests[0], change);
    assert.throws(() => validate(next));
  }
  const next = structuredClone(seed);
  next.guests.push(next.guests[0]);
  assert.throws(() => validate(next));
});
test("native store retains a previous revision and serializes saves", async () => {
  const dir = await mkdtemp(join(tmpdir(), "side-a-"));
  try {
    const store = new Store(dir);
    assert.deepEqual(await store.load(), seed);
    await store.save(seed);
    const next = structuredClone(seed);
    next.guests[0].name = "Changed Guest";
    await store.save(next);
    assert.deepEqual(JSON.parse(await readFile(join(dir, "guests.previous.json"), "utf8")), seed);
    assert.deepEqual(await store.load(), next);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("damaged native data is preserved and future writes are blocked", async () => {
  const dir = await mkdtemp(join(tmpdir(), "side-a-"));
  try {
    await writeFile(join(dir, "guests.json"), "broken");
    const store = new Store(dir);
    await assert.rejects(store.load(), /recovery/);
    await assert.rejects(store.save(seed), /overwritten/);
    assert.equal(await readFile(join(dir, "guests.json"), "utf8"), "broken");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("native IPC page boundary rejects lookalike and external URLs", () => {
  assert.equal(isAppPage("venue://app/index.html"), true);
  for (const value of [
    "https://app/index.html",
    "venue://evil/index.html",
    "venue://app/index.html?x=1",
    "venue://user@app/index.html",
    "venue://app/other.html",
    "not a url",
  ])
    assert.equal(isAppPage(value), false);
});
test("published pages reference existing local assets and required metadata", async () => {
  const root = resolve("docs");
  for (const page of ["index.html", "web/index.html", "desktop/index.html"]) {
    const html = await readFile(join(root, page), "utf8");
    assert.match(html, /<title>/);
    assert.match(html, /name="viewport"/);
    for (const [, url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^(https?:|mailto:|data:)/.test(url)) continue;
      const path = resolve(dirname(join(root, page)), url.split("#")[0]);
      await access(path);
    }
  }
});
