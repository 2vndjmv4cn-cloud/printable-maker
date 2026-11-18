// Pure logic for the printable makers. No page access here, so tests can run it directly.
(function (root) {
  'use strict';

  // Fair random number in [0, 1) from the browser's crypto source; Math.random only as a fallback.
  function rand() {
    if (root.crypto && root.crypto.getRandomValues) {
      const a = new Uint32Array(1); root.crypto.getRandomValues(a); return a[0] / 4294967296;
    }
    return Math.random();
  }

  // Fisher-Yates shuffle of a copy.
  function shuffle(arr, rnd) {
    rnd = rnd || rand; const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Non-empty trimmed lines, capped at max, each capped at maxLen characters.
  function lines(text, max, maxLen) {
    const out = String(text || '').split(/\r?\n/).map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean)
      .map(s => s.slice(0, maxLen || 80));
    return max ? out.slice(0, max) : out;
  }

  // Remove case-insensitive duplicates, keeping the first spelling.
  function unique(list) {
    const seen = new Set(); const out = [];
    for (const s of list) { const k = s.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(s); } }
    return out;
  }

  function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); } // month is 1-12

  // [{day, weekday}] for a month; weekday 0 = Sunday.
  function monthDays(year, month) {
    const n = daysInMonth(year, month), out = [];
    for (let d = 1; d <= n; d++) out.push({ day: d, weekday: new Date(year, month - 1, d).getDay() });
    return out;
  }

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function weekDays(startMonday) {
    return startMonday ? DAY_NAMES.slice(1).concat(DAY_NAMES[0]) : DAY_NAMES.slice();
  }

  // Bingo: each card has 25 squares, centre is FREE when free=true. Words must be unique.
  function bingoCards(words, count, free, rnd) {
    const list = unique(words);
    const need = free ? 24 : 25;
    if (list.length < need) return { error: `Add at least ${need} different words or phrases (you have ${list.length}).` };
    if (!(count >= 1 && count <= 60)) return { error: 'Choose between 1 and 60 cards.' };
    const cards = [], seen = new Set();
    let tries = 0;
    while (cards.length < count && tries < count * 50) {
      tries++;
      const pick = shuffle(list, rnd).slice(0, need);
      if (free) pick.splice(12, 0, 'FREE');
      const key = pick.join('\u0001');
      // Avoid printing two identical cards when there are enough words to make them different.
      if (seen.has(key)) continue;
      seen.add(key); cards.push(pick);
    }
    if (cards.length < count) return { error: 'Not enough different words to make that many unique cards. Add more words.' };
    return { cards };
  }

  // "Sam, Alex" or "Sam & Alex" per line -> [['Sam','Alex']]. Names are matched case-insensitively later.
  function parsePairs(text) {
    return lines(text, 100).map(l => l.split(/\s*(?:,|&|\+|\band\b)\s*/i).map(s => s.trim()).filter(Boolean))
      .filter(p => p.length >= 2);
  }

  // Secret Santa draw. Nobody gets themselves; pairs listed in exclusions never get each other (both directions).
  // Returns {matches:[{giver, receiver}]} or {error}.
  function secretSanta(names, exclusions, rnd) {
    rnd = rnd || rand;
    const people = unique(names);
    if (people.length !== names.length) return { error: 'Two people have the same name. Add a last initial so every name is different.' };
    if (people.length < 3) return { error: 'Add at least 3 people.' };
    if (people.length > 200) return { error: 'Up to 200 people at a time.' };
    const idx = new Map(people.map((p, i) => [p.toLowerCase(), i]));
    const blocked = people.map((_, i) => new Set([i]));
    for (const group of exclusions || []) {
      const ids = group.map(n => idx.get(n.toLowerCase())).filter(i => i !== undefined);
      for (const a of ids) for (const b of ids) blocked[a].add(b);
    }
    const order = shuffle(people.map((_, i) => i), rnd);
    const taken = new Array(people.length).fill(false), result = new Array(people.length);
    let steps = 0;
    function place(k) {
      if (k === order.length) return true;
      if (++steps > 200000) return false;
      const g = order[k];
      for (const r of shuffle(people.map((_, i) => i), rnd)) {
        if (taken[r] || blocked[g].has(r)) continue;
        taken[r] = true; result[g] = r;
        if (place(k + 1)) return true;
        taken[r] = false;
      }
      return false;
    }
    if (!place(0)) return { error: 'No fair draw is possible with these rules. Remove an exclusion or add more people.' };
    return { matches: people.map((p, i) => ({ giver: p, receiver: people[result[i]] })) };
  }

  root.Gen = { rand, shuffle, lines, unique, daysInMonth, monthDays, weekDays, DAY_NAMES, bingoCards, parsePairs, secretSanta };
})(typeof window !== 'undefined' ? window : globalThis);
