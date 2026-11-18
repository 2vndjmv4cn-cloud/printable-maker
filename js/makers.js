// Wires each maker page to its form. All text from the form is inserted with textContent, never as HTML.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const val = id => ($(id) ? $(id).value.trim() : '');
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

  const sheets = $('sheets'), msg = $('msg'), printBtn = $('print');
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function error(text) { clear(msg); msg.appendChild(el('p', 'err', text)); printBtn.hidden = true; }
  function note(text) { clear(msg); if (text) msg.appendChild(el('p', '', text)); }
  function sheet(cls) { const s = el('div', 'sheet' + (cls ? ' ' + cls : '')); sheets.appendChild(s); return s; }
  function heading(s, title, sub) { s.appendChild(el('h2', '', title)); if (sub) s.appendChild(el('p', 'sub', sub)); }
  function credit(s) { s.appendChild(el('p', 'credit', 'Made free at D. Rose Printable Maker')); }
  function box() { return el('span', 'box'); }
  function done(text) { note(text); printBtn.hidden = false; }

  const makers = {
    chore() {
      const chores = Gen.lines(val('chores'), 15, 60);
      if (!chores.length) return error('Add at least one chore.');
      const names = Gen.lines(val('names'), 10, 30);
      const days = Gen.weekDays(val('start') === 'mon');
      const title = val('title') || 'Chore Chart';
      for (const name of (names.length ? names : [null])) {
        const s = sheet();
        heading(s, name ? `${name}'s ${title}` : title, 'Week of ______________');
        const t = el('table'), head = el('tr');
        head.appendChild(el('th', 'label', 'Chore'));
        days.forEach(d => head.appendChild(el('th', '', d.slice(0, 3))));
        t.appendChild(head);
        chores.forEach(c => { const r = el('tr'); r.appendChild(el('td', 'label', c)); days.forEach(() => { const td = el('td'); td.appendChild(box()); r.appendChild(td); }); t.appendChild(r); });
        s.appendChild(t);
        if (val('reward')) s.appendChild(el('p', 'foot', val('reward')));
        credit(s);
      }
      done(names.length > 1 ? `${names.length} charts ready, one per page.` : 'Your chart is ready.');
    },

    reward() {
      const n = parseInt(val('count'), 10);
      if (!(n >= 5 && n <= 50)) return error('Choose between 5 and 50 stickers.');
      const s = sheet();
      const name = val('name');
      heading(s, name ? `${name}'s Reward Chart` : 'My Reward Chart');
      if (val('goal')) s.appendChild(el('p', 'goal', val('goal')));
      const grid = el('div', 'shapes'), shape = val('shape');
      for (let i = 1; i <= n; i++) {
        const g = svg('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': 'Sticker space ' + i });
        const style = { fill: 'none', stroke: '#444', 'stroke-width': '3', 'stroke-linejoin': 'round' };
        if (shape === 'circle') g.appendChild(svg('circle', Object.assign({ cx: 50, cy: 50, r: 44 }, style)));
        else if (shape === 'heart') g.appendChild(svg('path', Object.assign({ d: 'M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C39 8 46 13 50 21 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z' }, style)));
        else g.appendChild(svg('polygon', Object.assign({ points: '50,5 61,37 95,37 68,57 79,91 50,71 21,91 32,57 5,37 39,37' }, style)));
        const tx = svg('text', { x: 50, y: shape === 'heart' ? 50 : 58, 'text-anchor': 'middle' }); tx.textContent = i; g.appendChild(tx);
        grid.appendChild(g);
      }
      s.appendChild(grid);
      if (val('prize')) s.appendChild(el('p', 'foot', `When every space is filled, I get: ${val('prize')}`));
      credit(s);
      done('Your chart is ready.');
    },

    habit() {
      const habits = Gen.lines(val('habits'), 12, 50);
      if (!habits.length) return error('Add at least one habit.');
      const month = parseInt(val('month'), 10), year = parseInt(val('year'), 10);
      if (!(year >= 1900 && year <= 2200)) return error('Enter a year like 2027.');
      const days = Gen.monthDays(year, month);
      const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });
      const s = sheet('habit');
      heading(s, `${monthName} ${year} ${val('title') || 'Habit Tracker'}`);
      const t = el('table'), r1 = el('tr'), r2 = el('tr');
      r1.appendChild(el('th', 'label', 'Habit')); r2.appendChild(el('th', 'label', ''));
      days.forEach(d => {
        const we = d.weekday === 0 || d.weekday === 6 ? 'we' : '';
        r1.appendChild(el('th', we, String(d.day)));
        r2.appendChild(el('th', we, Gen.DAY_NAMES[d.weekday][0]));
      });
      t.appendChild(r1); t.appendChild(r2);
      habits.forEach(h => { const r = el('tr'); r.appendChild(el('td', 'label', h)); days.forEach(() => r.appendChild(el('td', 'cell'))); t.appendChild(r); });
      s.appendChild(t);
      credit(s);
      done('Your tracker is ready. It prints sideways so every day fits.');
    },

    bingo() {
      const count = parseInt(val('count'), 10);
      const words = Gen.lines(val('words'), 200, 40);
      const res = Gen.bingoCards(words, count, $('free').checked);
      if (res.error) return error(res.error);
      const title = val('title') || 'Bingo';
      res.cards.forEach((card, i) => {
        const s = sheet('bingo' + (i >= 2 ? ' later' : ''));
        heading(s, title);
        const t = el('table'), head = el('tr');
        'BINGO'.split('').forEach(ch => head.appendChild(el('th', '', ch)));
        t.appendChild(head);
        for (let r = 0; r < 5; r++) {
          const tr = el('tr');
          for (let c = 0; c < 5; c++) { const w = card[r * 5 + c]; tr.appendChild(el('td', w === 'FREE' && $('free').checked && r === 2 && c === 2 ? 'free' : '', w)); }
          t.appendChild(tr);
        }
        s.appendChild(t);
        credit(s);
      });
      if (res.cards.length > 2) sheets.appendChild(el('p', 'more', `Showing 2 of ${res.cards.length} cards. All of them print, one per page, and each is shuffled differently.`));
      done(`${res.cards.length} card${res.cards.length > 1 ? 's' : ''} ready.`);
    },

    santa() {
      const names = Gen.lines(val('names'), 200, 30);
      const res = Gen.secretSanta(names, Gen.parsePairs(val('rules')));
      if (res.error) return error(res.error);
      const unknown = Gen.parsePairs(val('rules')).flat().filter(n => !names.some(p => p.toLowerCase() === n.toLowerCase()));
      const budget = val('budget'), date = val('date'), group = val('group');
      // Printed slips (not shown on screen)
      const s = sheet('print-only');
      const wrap = el('div', 'slips');
      res.matches.forEach(m => {
        const slip = el('div', 'slip');
        const top = el('div'); top.appendChild(el('div', 'small', group || 'Secret Santa')); top.appendChild(el('div', 'to', `For ${m.giver}`)); top.appendChild(el('div', 'small', 'Open the flap to see your name'));
        const mid = el('div', 'fold'); mid.appendChild(el('div', 'small', "You're buying a gift for")); mid.appendChild(el('div', 'gift', m.receiver));
        const extra = [budget && `Budget: ${budget}`, date && `Exchange: ${date}`].filter(Boolean).join('  |  ');
        if (extra) mid.appendChild(el('div', 'small', extra));
        const flap = el('div', 'fold'); flap.appendChild(el('div', 'small', 'Fold this flap up to cover the middle'));
        slip.appendChild(top); slip.appendChild(mid); slip.appendChild(flap);
        wrap.appendChild(slip);
      });
      s.appendChild(wrap);
      // Screen: summary + pass-the-phone
      clear(msg);
      msg.appendChild(el('p', '', `Names drawn for ${res.matches.length} people. Nobody got themselves${Gen.parsePairs(val('rules')).length ? ', and your rules were followed' : ''}. The results are hidden.`));
      if (unknown.length) msg.appendChild(el('p', 'err', `Not in the list, so ignored: ${unknown.join(', ')}. Check the spelling.`));
      msg.appendChild(el('p', 'hint', 'Print folded slips, or pass this phone around: each person taps their own name. Reloading the page draws again.'));
      const people = el('div', 'people'), stage = el('div');
      const byGiver = new Map(res.matches.map(m => [m.giver, m.receiver]));
      res.matches.map(m => m.giver).sort((a, b) => a.localeCompare(b)).forEach(g => {
        const b = el('button', 'ghost', g); b.type = 'button';
        b.addEventListener('click', () => {
          clear(stage);
          const card = el('div', 'reveal');
          card.appendChild(el('p', '', `Are you ${g}?`));
          const yes = el('button', '', `Yes, show me`); yes.type = 'button';
          yes.addEventListener('click', () => {
            clear(card);
            card.appendChild(el('p', '', `${g}, you're buying a gift for`));
            card.appendChild(el('p', 'who', byGiver.get(g)));
            const extra = [budget && `Budget: ${budget}`, date && `Exchange: ${date}`].filter(Boolean).join('  |  ');
            if (extra) card.appendChild(el('p', 'hint', extra));
            const hide = el('button', '', 'Hide it and pass the phone'); hide.type = 'button';
            hide.addEventListener('click', () => { clear(stage); b.disabled = true; b.textContent = g + ' (seen)'; });
            card.appendChild(hide);
          });
          const no = el('button', 'ghost', 'Cancel'); no.type = 'button'; no.style.marginLeft = '8px';
          no.addEventListener('click', () => clear(stage));
          card.appendChild(yes); card.appendChild(no);
          stage.appendChild(card);
        });
        people.appendChild(b);
      });
      msg.appendChild(people); msg.appendChild(stage);
      printBtn.textContent = 'Print folded slips';
      printBtn.hidden = false;
    },
  };

  const PRESETS = {
    holiday: ['Holiday Bingo', 'Someone wears a festive sweater\nHot cocoa\nA gift is re-wrapped\nSomeone mentions snow\nCookies come out of the oven\nA holiday song plays\nSomeone takes a group photo\nWrapping paper everywhere\nSomeone tells an old family story\nA pet gets a treat\nSomeone falls asleep on the couch\nSomeone asks for a recipe\nLights are switched on\nA board game comes out\nSomeone says "Is that for me?"\nA candle is lit\nSomeone sings along\nSomeone gets socks\nA toast is made\nSomeone checks the weather\nLeftovers are packed up\nA kid is too excited to sit still\nSomeone wears a hat\nSomeone hugs everyone\nA bow ends up on someone\'s head\nSomeone drops a cookie\nThe dessert table gets visited twice\nSomeone arrives late\nSomeone says "This is my favorite"\nA phone call from someone far away'],
    baby: ['Baby Shower Bingo', 'Onesie\nBlanket\nBaby wipes\nDiapers\nBottle\nPacifier\nBaby book\nBath towel with hood\nSocks\nTeething toy\nRattle\nBibs\nBaby lotion\nNight light\nBurp cloths\nSwaddle\nBaby monitor\nStuffed animal\nBaby hat\nNail clippers\nBath toys\nDiaper cream\nPlay mat\nMuslin cloths\nBaby carrier\nPicture frame\nBooties\nSleep sack\nGift card\nHandmade gift'],
    road: ['Road Trip Bingo', 'Red car\nCow\nGas station\nBridge\nTruck with a trailer\nMotorcycle\nSpeed limit sign\nRest stop\nHorse\nAirplane in the sky\nSchool bus\nTunnel\nLicense plate from another state\nWater tower\nStop sign\nRoad construction\nDog in a car\nYellow car\nRailroad crossing\nWind turbine\nFast food sign\nPolice car\nBillboard with a cow\nCamper van\nRiver or lake\nTractor\nFlag\nOne-way sign\nPicnic table\nBike on a car'],
  };

  function initBingo() {
    const preset = $('preset'), words = $('words'), title = $('title');
    function apply() {
      const p = PRESETS[preset.value];
      if (p) { title.value = p[0]; words.value = p[1]; }
      else if (preset.value === 'blank') { words.value = ''; title.value = 'Bingo'; words.focus(); }
    }
    preset.addEventListener('change', apply);
    apply();
  }

  const tool = document.body.dataset.tool;
  const form = $('f');
  if (!form || !makers[tool]) return;
  if (tool === 'bingo') initBingo();
  form.addEventListener('submit', e => { e.preventDefault(); clear(sheets); printBtn.hidden = true; makers[tool](); });
  printBtn.addEventListener('click', () => window.print());
  if (tool !== 'santa') makers[tool]();   // show a ready-made example straight away; Secret Santa waits for the organizer
})();
