(function () {
  const ADMIN_PIN = '8049';
  const DRAFT_KEY = 'girnar_yatra_draft_v2';
  const GH_KEY = 'girnar_yatra_gh_cfg_v1';
  const AUTH_KEY = 'girnar_yatra_admin_unlocked';

  let DATA = window.YATRA_DATA ? JSON.parse(JSON.stringify(window.YATRA_DATA)) : null;
  if (!DATA) {
    document.body.innerHTML = '<p style="padding:20px;color:red;">Error: data.js not loaded.</p>';
    return;
  }

  const DH_SHORT = [
    'मांडोली (13/12)',
    'संके. पारस (14/12)',
    'संके. राजेंद्र (14/12)',
    'गिरनार (15-16)',
    'भीलड़ी संघवी (17)',
    'भीलड़ी भूरीबाई (17)'
  ];

  // Helpers
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const isMale = (g) => /पुरुष|male/i.test(g || '') && !/स्त्री|female/i.test(g || '');
  const isFemale = (g) => /स्त्री|female/i.test(g || '');

  const phoneClean = (m) => {
    if (!m) return '';
    return String(m).split(/[\\/,]/)[0].replace(/[^\d+]/g, '');
  };

  function waNumber(m) {
    const digits = phoneClean(m).replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    if (digits.length > 10) return `91${digits.slice(-10)}`;
    return '';
  }

  function buildSingleWaMessage(p) {
    const rmLabels = [
      '13/12/26 (मांडोली - शांति पुरम)',
      '14/12/26 (संकेश्वर - पारस पद्मावती)',
      '14/12/26 (संकेश्वर - राजेंद्र सूरी)',
      '15-16/12/26 (गिरनार दर्शन)',
      '17/12/26 (भीलड़ी - श्री संघवी)',
      '17/12/26 (भीलड़ी - भूरी बाई)'
    ];
    const roomLines = p.rooms
      .map((rm, idx) => (rm && rm !== '-' ? `• ${rmLabels[idx]}: *कमरा ${rm}*` : ''))
      .filter(Boolean);

    return [
      '🚩 *समदड़ी से श्री गिरनारजी तीर्थ यात्रा संघ – 2026*',
      'आयोजक: श्री समदड़ी जैन मित्र मंडल, समदड़ी',
      '',
      '🙏 *जय जिनेंद्र,*',
      `*यात्री का नाम:* ${p.fullName} (Sr #${p.srNo})`,
      `*शहर:* ${p.city || '-'}`,
      '',
      '🚌 *बस एवं सीट विवरण:*',
      `• बस नंबर: *Bus ${p.bus}*`,
      `• सीट नंबर: *Seat ${p.seat}*`,
      '',
      '🏨 *धर्मशाला एवं कमरा आवंटन:*',
      ...(roomLines.length ? roomLines : ['• कमरा आवंटन शेष']),
      '',
      '🙏 सुखद एवं मंगलमय तीर्थ यात्रा की शुभकामनाएं!'
    ].join('\n');
  }

  function buildFamilyWaMessage(p, famMembers) {
    const shortLabels = ['मांडोली', 'संके. पारस', 'संके. राजेंद्र', 'गिरनार', 'भीलड़ी संघवी', 'भीलड़ी भूरीबाई'];
    const lines = [
      '🚩 *समदड़ी से श्री गिरनारजी तीर्थ यात्रा संघ – 2026*',
      'आयोजक: श्री समदड़ी जैन मित्र मंडल, समदड़ी',
      '',
      '🙏 *जय जिनेंद्र,*',
      `*परिवार विवरण (मुखिया: ${p.headOfFamily || p.fullName} | ${p.city || '-'})*`,
      ''
    ];
    famMembers.forEach((fm, idx) => {
      const gTxt = isMale(fm.gender) ? 'पुरुष' : 'स्त्री';
      const rms = fm.rooms
        .map((rm, rIdx) => (rm && rm !== '-' ? `${shortLabels[rIdx]}: *${rm}*` : ''))
        .filter(Boolean)
        .join(' | ');
      lines.push(`*${idx + 1}. ${fm.fullName}* (${fm.age} वर्ष, ${gTxt})`);
      lines.push(`🚌 बस: *${fm.bus}* | सीट: *${fm.seat}*`);
      lines.push(`🏨 ${rms || 'कमरा आवंटन शेष'}`);
      lines.push('');
    });
    lines.push('🙏 सुखद एवं मंगलमय तीर्थ यात्रा की शुभकामनाएं!');
    return lines.join('\n');
  }

  function renderCardWaBtn(p) {
    const wa = waNumber(p.mobile);
    if (!wa) return '';
    if (isAdmin) {
      const url = `https://wa.me/${wa}?text=${encodeURIComponent(buildSingleWaMessage(p))}`;
      return `<a class="call-link" style="background:#dcfce7;color:#166534;" href="${url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">💬 विवरण भेजें</a>`;
    }
    return `<a class="call-link" style="background:#dcfce7;color:#166534;" href="https://wa.me/${wa}" target="_blank" rel="noopener" onclick="event.stopPropagation()">💬</a>`;
  }

  // Hindi (Devanagari) <-> English Phonetic Search Helper
  const DEVA_MAP = {
    'अ':'a','आ':'a','इ':'i','ई':'i','उ':'u','ऊ':'u','ए':'e','ऐ':'ai','ओ':'o','औ':'au','ऋ':'ri',
    'ा':'a','ि':'i','ी':'i','ु':'u','ू':'u','े':'e','ै':'ai','ो':'o','ौ':'au','ं':'n','ँ':'n','ः':'h','्':'',
    'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n','च':'c','छ':'c','ज':'j','झ':'jh','ञ':'n',
    'ट':'t','ठ':'t','ड':'d','ढ':'d','ण':'n','त':'t','थ':'t','द':'d','ध':'d','न':'n',
    'प':'p','फ':'f','ब':'b','भ':'b','म':'m','य':'y','र':'r','ल':'l','व':'v',
    'श':'s','ष':'s','स':'s','ह':'h','ळ':'l','ड़':'d','ढ़':'d','क़':'k','ख़':'k','ग़':'g','ज़':'z','फ़':'f'
  };

  function toPhoneticSkeleton(str) {
    let out = '';
    for (const ch of String(str || '').toLowerCase()) {
      out += DEVA_MAP[ch] !== undefined ? DEVA_MAP[ch] : ch;
    }
    return out
      .replace(/x/g, 'ks')
      .replace(/ph/g, 'f')
      .replace(/bh/g, 'b')
      .replace(/dh/g, 'd')
      .replace(/th/g, 't')
      .replace(/kh/g, 'k')
      .replace(/gh/g, 'g')
      .replace(/jh/g, 'j')
      .replace(/sh/g, 's')
      .replace(/chh?/g, 'c')
      .replace(/ostw/g, 'osw')
      .replace(/w/g, 'v')
      .replace(/z/g, 'j')
      .replace(/[aeiouhy\u200c\u200d]/g, '')
      .replace(/(.)\1+/g, '$1');
  }

  function smartMatch(query, hayText) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    const hay = String(hayText || '').toLowerCase();
    if (hay.includes(q)) return true;
    const tokens = q.split(/\s+/).filter(Boolean);
    const haySkel = toPhoneticSkeleton(hay);
    return tokens.every((tok) => {
      if (hay.includes(tok)) return true;
      const sk = toPhoneticSkeleton(tok);
      if (sk.length >= 2 && haySkel.includes(sk)) return true;
      if (/[ड़ढ़]/.test(tok)) {
        const skR = toPhoneticSkeleton(tok.replace(/[ड़ढ़]/g, 'r'));
        if (skR.length >= 2 && haySkel.includes(skR)) return true;
      }
      return false;
    });
  }

  function bindYatriPicker(inputId, listId, onPick) {
    const inp = document.getElementById(inputId);
    const listEl = document.getElementById(listId);
    if (!inp || !listEl) return;

    inp.addEventListener('input', () => {
      const q = inp.value.trim();
      if (!q) {
        listEl.hidden = true;
        listEl.innerHTML = '';
        return;
      }
      const matches = DATA.passengers.filter((p) =>
        smartMatch(q, `${p.fullName} ${p.mobile} ${p.city} bus ${p.bus}`)
      ).slice(0, 12);

      if (!matches.length) {
        listEl.innerHTML = '<div class="muted" style="padding:8px 10px;font-size:12px;">कोई यात्री नहीं मिला — नीचे सीधे नाम लिखें।</div>';
        listEl.hidden = false;
        return;
      }
      listEl.innerHTML = matches.map((p) => `
        <button type="button" class="pick-item" data-pid="${p.id}">
          <span><strong>${esc(p.fullName)}</strong> <span class="muted">(${esc(p.city)} • B${esc(p.bus)}/S${esc(p.seat)})</span></span>
          <span style="color:var(--green-fg);font-weight:700;">${esc(p.mobile || '')}</span>
        </button>
      `).join('');
      listEl.hidden = false;
    });

    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.pick-item');
      if (!btn) return;
      const p = DATA.passengers.find((x) => x.id === Number(btn.dataset.pid));
      if (p) {
        onPick(p);
        inp.value = '';
        listEl.hidden = true;
        listEl.innerHTML = '';
      }
    });
  }

  // App State
  let isAdmin = sessionStorage.getItem(AUTH_KEY) === '1';
  let hasDraft = false;
  let passengerView = 'cards';
  let activeDharamshala = 0;
  let activeServiceChip = '';
  let selectedBusNo = null;
  let currentSlotGenderWarningRef = null;

  function ensureDataIntegrity() {
    if (!Array.isArray(DATA.freedSlots)) DATA.freedSlots = [];
    if (!Array.isArray(DATA.cancelled)) DATA.cancelled = [];
    if (!Array.isArray(DATA.route)) DATA.route = [];
    if (!Array.isArray(DATA.committees)) DATA.committees = [];
    if (!Array.isArray(DATA.busTeam) || DATA.busTeam.length === 0) {
      DATA.busTeam = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => ({ bus: b, members: [] }));
    }
    DATA.meta.totalPassengers = DATA.passengers.length;
    DATA.meta.totalCancelled = DATA.cancelled.length;
  }

  function saveDraft() {
    ensureDataIntegrity();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(DATA));
    hasDraft = true;
    updateAdminUI();
  }

  function loadDraftIfAny() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.passengers)) {
          DATA = parsed;
          hasDraft = true;
        }
      }
    } catch (e) {
      console.warn('Draft parse error', e);
    }
    ensureDataIntegrity();
  }

  // Available Vacant & Freed Slots Computation
  function getAvailableSlots() {
    const activeFreed = DATA.freedSlots.filter((s) => !s.filledBy);
    const freedBusSeatKeys = new Set(activeFreed.map((s) => `${s.bus}:${s.seat}`));
    const emptySeats = [];

    for (let b = 1; b <= 9; b++) {
      const cap = Number(DATA.meta.busCapacities[b] || 0);
      const occupied = new Set(DATA.passengers.filter((p) => Number(p.bus) === b).map((p) => Number(p.seat)));
      for (let s = 1; s <= cap; s++) {
        if (!occupied.has(s) && !freedBusSeatKeys.has(`${b}:${s}`)) {
          emptySeats.push({
            id: `empty-${b}-${s}`,
            type: 'empty',
            bus: b,
            seat: s,
            rooms: ['-', '-', '-', '-', '-', '-'],
            fromName: '',
            fromGender: ''
          });
        }
      }
    }

    return {
      freed: activeFreed.map((f) => ({ ...f, type: 'freed' })),
      emptySeats
    };
  }

  function renderAll() {
    ensureDataIntegrity();
    renderKPI();
    initPassengerFilters();
    renderPassengers();
    renderBusCards();
    if (selectedBusNo && !document.getElementById('bus-detail-panel').hidden) {
      renderBusDetailRows();
    }
    renderRooms();
    renderRoute();
    renderContacts();
    renderCommittees();
    renderBusTeam();
    renderCitiesVacantCancelled();
    updateAdminUI();
  }

  function updateAdminUI() {
    const authBtn = document.getElementById('btn-admin-auth');
    const bar = document.getElementById('admin-bar');
    const syncNote = document.getElementById('sync-status-text');
    const discardBtn = document.getElementById('btn-discard-draft');

    if (isAdmin) {
      authBtn.textContent = '🔓 Admin (लॉक करें)';
      authBtn.classList.add('unlocked');
      bar.hidden = false;
    } else {
      authBtn.textContent = '🔒 Admin';
      authBtn.classList.remove('unlocked');
      bar.hidden = true;
    }

    ['btn-export-open', 'btn-dl-all-buses-xlsx', 'bd-dl-xlsx', 'btn-dl-busteam-xlsx'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !isAdmin;
    });

    if (hasDraft) {
      syncNote.textContent = '📝 अप्रकाशित बदलाव सहेजे गए — GitHub पर लाइव सेव करें';
      discardBtn.hidden = false;
    } else {
      syncNote.textContent = 'डेटा सिंक है (Live)';
      discardBtn.hidden = true;
    }

    const { freed, emptySeats } = getAvailableSlots();
    const totalAvail = freed.length + emptySeats.length;
    document.getElementById('vacant-cnt-pill').textContent = totalAvail;
    document.getElementById('vacant-sub-cnt').textContent = totalAvail;
  }

  // Render KPI Strip
  function renderKPI() {
    const p = DATA.passengers;
    const males = p.filter((x) => isMale(x.gender)).length;
    const females = p.filter((x) => isFemale(x.gender)).length;
    const totalCap = DATA.meta.totalCapacity;
    const { freed, emptySeats } = getAvailableSlots();
    const vacant = totalCap - p.length;
    const citiesCount = new Set(p.map((x) => x.city).filter(Boolean)).size;
    const familyCount = new Set(p.map((x) => x.familyId)).size;

    document.getElementById('nav-cnt-passengers').textContent = p.length;
    document.getElementById('nav-cnt-cancelled').textContent = DATA.cancelled.length;
    document.getElementById('city-cnt').textContent = citiesCount;
    document.getElementById('canc-cnt').textContent = DATA.cancelled.length;

    document.getElementById('kpi-strip').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">कुल सक्रिय यात्री (Yatris)</div>
        <div class="kpi-val">${p.length}</div>
        <div class="kpi-sub">पुरुष: ${males} • स्त्री: ${females}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">बस क्षमता व रिक्त सीटें</div>
        <div class="kpi-val">${p.length} / ${totalCap}</div>
        <div class="kpi-sub">9 बसें • ${vacant >= 0 ? vacant + ' रिक्त' : Math.abs(vacant) + ' अतिरिक्त'} (${freed.length} रद्द स्लॉट)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">शहर एवं परिवार</div>
        <div class="kpi-val">${citiesCount} शहर</div>
        <div class="kpi-sub">${familyCount} परिवार समूह</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">मार्ग व धर्मशालाएं</div>
        <div class="kpi-val">~1,381 कि.मी.</div>
        <div class="kpi-sub">6 धर्मशालाएं • ${DATA.tirthContacts.length} संपर्क केंद्र</div>
      </div>
    `;
  }

  // Tab Switching
  function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === 'tab-' + tabId);
    });
  }

  document.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Tab 1: Filters & Passengers
  function initPassengerFilters() {
    const busSel = document.getElementById('p-bus-filter');
    const prevBus = busSel.value;
    busSel.innerHTML = '<option value="">सभी बसें (All Buses)</option>';
    for (let b = 1; b <= 9; b++) {
      const cnt = DATA.passengers.filter((x) => Number(x.bus) === b).length;
      const opt = document.createElement('option');
      opt.value = String(b);
      opt.textContent = `Bus ${b} (${cnt} यात्री)`;
      busSel.appendChild(opt);
    }
    busSel.value = prevBus;

    const citySel = document.getElementById('p-city-filter');
    const prevCity = citySel.value;
    citySel.innerHTML = '<option value="">सभी शहर (All Cities)</option>';
    const cityCounts = {};
    DATA.passengers.forEach((x) => {
      if (x.city) cityCounts[x.city] = (cityCounts[x.city] || 0) + 1;
    });
    Object.keys(cityCounts).sort().forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = `${c} (${cityCounts[c]})`;
      citySel.appendChild(opt);
    });
    if (cityCounts[prevCity]) citySel.value = prevCity;
  }

  function getFilteredPassengers() {
    const q = document.getElementById('p-search').value.trim().toLowerCase();
    const bus = document.getElementById('p-bus-filter').value;
    const city = document.getElementById('p-city-filter').value;
    const gender = document.getElementById('p-gender-filter').value;

    return DATA.passengers.filter((p) => {
      if (bus && String(p.bus) !== bus) return false;
      if (city && p.city !== city) return false;
      if (gender === 'male' && !isMale(p.gender)) return false;
      if (gender === 'female' && !isFemale(p.gender)) return false;
      if (q) {
        const hay = [
          p.fullName, p.mobile, p.city, p.state, p.headOfFamily,
          `bus ${p.bus}`, `seat ${p.seat}`, p.srNo, ...p.rooms
        ].join(' ');
        if (!smartMatch(q, hay)) return false;
      }
      return true;
    });
  }

  function renderPassengers() {
    const list = getFilteredPassengers();
    const q = document.getElementById('p-search').value.trim();
    const bus = document.getElementById('p-bus-filter').value;
    const city = document.getElementById('p-city-filter').value;
    const gender = document.getElementById('p-gender-filter').value;

    document.getElementById('p-clear').hidden = !q;
    document.getElementById('p-reset-filters').hidden = !(q || bus || city || gender);
    document.getElementById('p-count-label').textContent = `कुल ${list.length} यात्री प्रदर्शित (${DATA.passengers.length} में से)`;

    const cardsEl = document.getElementById('p-results-cards');
    const tableWrap = document.getElementById('p-results-table');
    const tbody = document.getElementById('p-table-body');

    if (passengerView === 'cards') {
      cardsEl.hidden = false;
      tableWrap.hidden = true;
      if (!list.length) {
        cardsEl.innerHTML = '<div class="card muted">कोई यात्री नहीं मिला। कृपया खोज बदलें।</div>';
        return;
      }
      cardsEl.innerHTML = list.map((p) => {
        const gCls = isMale(p.gender) ? 'badge-male' : 'badge-female';
        const gTxt = isMale(p.gender) ? 'पुरुष' : 'स्त्री';
        const ph = phoneClean(p.mobile);
        const rmHtml = p.rooms.map((rm, idx) => `
          <div class="rm-chip ${rm === '-' ? 'empty' : ''}">
            <span class="rm-lbl">${esc(DH_SHORT[idx])}</span>
            <span class="rm-val">${esc(rm)}</span>
          </div>
        `).join('');
        return `
          <article class="p-card" data-pid="${p.id}">
            <div class="p-top">
              <div>
                <div class="p-name"><span class="p-sr">#${esc(p.srNo)}</span>${esc(p.fullName)}</div>
              </div>
              <span class="badge-bus">🚌 B${esc(p.bus)} • S${esc(p.seat)}</span>
            </div>
            <div class="p-badges">
              <span class="badge-gender ${gCls}">${gTxt} • ${esc(p.age)} वर्ष</span>
              <span class="badge-city">📍 ${esc(p.city)}</span>
            </div>
            <div class="p-meta">
              <span>मुखिया: <strong>${esc(p.headOfFamily || '-')}</strong></span>
              <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;">
                ${ph ? `<a class="call-link" href="tel:${esc(ph)}" onclick="event.stopPropagation()">📞 ${esc(p.mobile)}</a>` : '<span class="muted">मोबाइल नहीं</span>'}
                ${renderCardWaBtn(p)}
              </div>
            </div>
            <div class="rooms-mini-grid">${rmHtml}</div>
          </article>
        `;
      }).join('');
    } else {
      cardsEl.hidden = true;
      tableWrap.hidden = false;
      tbody.innerHTML = list.map((p) => {
        const gTxt = isMale(p.gender) ? 'पुरुष' : 'स्त्री';
        const ph = phoneClean(p.mobile);
        return `
          <tr class="clickable-row" data-pid="${p.id}">
            <td><strong>${esc(p.srNo)}</strong></td>
            <td><strong>${esc(p.fullName)}</strong><br><span class="muted" style="font-size:11px;">मुखिया: ${esc(p.headOfFamily || '-')}</span></td>
            <td>${esc(p.age)} / ${gTxt}</td>
            <td>${esc(p.city)}</td>
            <td>${ph ? `<a class="call-link" href="tel:${esc(ph)}" onclick="event.stopPropagation()">📞 ${esc(p.mobile)}</a>` : '-'}</td>
            <td><span class="badge-bus">B${esc(p.bus)} / ${esc(p.seat)}</span></td>
            ${p.rooms.map((r) => `<td><strong>${esc(r)}</strong></td>`).join('')}
          </tr>
        `;
      }).join('');
    }
  }

  document.getElementById('p-results-cards').addEventListener('click', (e) => {
    const card = e.target.closest('.p-card');
    if (card) openPassengerModal(Number(card.dataset.pid));
  });
  document.getElementById('p-table-body').addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (row) openPassengerModal(Number(row.dataset.pid));
  });

  ['p-search', 'p-bus-filter', 'p-city-filter', 'p-gender-filter'].forEach((id) => {
    document.getElementById(id).addEventListener('input', renderPassengers);
    document.getElementById(id).addEventListener('change', renderPassengers);
  });
  document.getElementById('p-clear').addEventListener('click', () => {
    document.getElementById('p-search').value = '';
    renderPassengers();
  });
  document.getElementById('p-reset-filters').addEventListener('click', () => {
    document.getElementById('p-search').value = '';
    document.getElementById('p-bus-filter').value = '';
    document.getElementById('p-city-filter').value = '';
    document.getElementById('p-gender-filter').value = '';
    renderPassengers();
  });
  document.querySelectorAll('.vt-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      passengerView = btn.dataset.view;
      document.querySelectorAll('.vt-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderPassengers();
    });
  });

  // TAB 2: BUSES (including Vacant/Freed seats inline)
  function renderBusCards() {
    const grid = document.getElementById('bus-cards-grid');
    let html = '';
    for (let b = 1; b <= 9; b++) {
      const cap = Number(DATA.meta.busCapacities[b] || 0);
      const pax = DATA.passengers.filter((x) => Number(x.bus) === b);
      const mCnt = pax.filter((x) => isMale(x.gender)).length;
      const fCnt = pax.filter((x) => isFemale(x.gender)).length;
      const vac = cap - pax.length;
      const pct = cap ? Math.min(100, Math.round((pax.length / cap) * 100)) : 100;
      const statusHtml = vac === 0
        ? `<span class="bus-status status-full">पूर्ण (${pax.length}/${cap})</span>`
        : vac > 0
          ? `<span class="bus-status status-vacant">${vac} सीट रिक्त</span>`
          : `<span class="bus-status status-vacant">+${Math.abs(vac)} अतिरिक्त</span>`;

      html += `
        <div class="bus-card" data-bus="${b}">
          <div class="bus-card-top">
            <span class="bus-title">🚌 बस नंबर ${b}</span>
            ${statusHtml}
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="bus-stats-row">
            <span>आवंटित: <strong>${pax.length}</strong> / क्षमता: <strong>${cap}</strong></span>
            <span>👨 ${mCnt} • 👩 ${fCnt}</span>
          </div>
        </div>
      `;
    }
    grid.innerHTML = html;
  }

  function openBusDetail(b) {
    selectedBusNo = b;
    document.getElementById('bus-cards-grid').hidden = true;
    document.getElementById('bus-detail-panel').hidden = false;
    document.getElementById('bd-search').value = '';
    renderBusDetailRows();
  }

  function renderBusDetailRows() {
    const b = selectedBusNo;
    const cap = Number(DATA.meta.busCapacities[b] || 0);
    const q = document.getElementById('bd-search').value.trim().toLowerCase();
    const pax = DATA.passengers
      .filter((x) => Number(x.bus) === b)
      .sort((a, z) => (Number(a.seat) || 999) - (Number(z.seat) || 999));

    const { freed, emptySeats } = getAvailableSlots();
    const busVacant = [
      ...freed.filter((s) => Number(s.bus) === b),
      ...emptySeats.filter((s) => Number(s.bus) === b)
    ].sort((a, z) => Number(a.seat) - Number(z.seat));

    const filtered = q
      ? pax.filter((p) => smartMatch(q, [p.fullName, p.city, p.mobile, p.seat, ...p.rooms].join(' ')))
      : pax;

    const mCnt = pax.filter((x) => isMale(x.gender)).length;
    const fCnt = pax.filter((x) => isFemale(x.gender)).length;
    document.getElementById('bd-title').textContent = `🚌 बस नंबर ${b} — यात्री एवं कमरा सूची`;
    document.getElementById('bd-meta').textContent = `निर्धारित क्षमता: ${cap} सीटें • आवंटित: ${pax.length} (पुरुष: ${mCnt}, स्त्री: ${fCnt}) • रिक्त सीटें: ${busVacant.length}`;

    // Mobile Cards View for Bus Detail
    const bdCardsEl = document.getElementById('bd-cards-view');
    if (bdCardsEl) {
      const paxCardsHtml = filtered.map((p) => {
        const gCls = isMale(p.gender) ? 'badge-male' : 'badge-female';
        const gTxt = isMale(p.gender) ? 'पुरुष' : 'स्त्री';
        const ph = phoneClean(p.mobile);
        const rmHtml = p.rooms.map((rm, idx) => `
          <div class="rm-chip ${rm === '-' ? 'empty' : ''}">
            <span class="rm-lbl">${esc(DH_SHORT[idx])}</span>
            <span class="rm-val">${esc(rm)}</span>
          </div>
        `).join('');
        return `
          <article class="p-card" data-pid="${p.id}">
            <div class="p-top">
              <div class="p-name"><span class="p-sr">#${esc(p.srNo)}</span>${esc(p.fullName)}</div>
              <span class="badge-bus">सीट ${esc(p.seat)}</span>
            </div>
            <div class="p-badges">
              <span class="badge-gender ${gCls}">${gTxt} • ${esc(p.age)} वर्ष</span>
              <span class="badge-city">📍 ${esc(p.city)}</span>
            </div>
            <div class="p-meta">
              <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;">
                ${ph ? `<a class="call-link" href="tel:${esc(ph)}" onclick="event.stopPropagation()">📞 ${esc(p.mobile)}</a>` : 'मोबाइल नहीं'}
                ${renderCardWaBtn(p)}
              </div>
            </div>
            <div class="rooms-mini-grid">${rmHtml}</div>
          </article>
        `;
      }).join('');
      const vacCardsHtml = !q ? busVacant.map((v) => `
        <article class="p-card vacant-row" style="cursor:default;">
          <div class="p-top">
            <strong>💺 रिक्त सीट ${esc(v.seat)}</strong>
            <span class="freed-badge">${v.type === 'freed' ? 'रद्द स्लॉट' : 'खाली सीट'}</span>
          </div>
          ${v.type === 'freed' ? `<p class="muted" style="font-size:12px;">पूर्व यात्री: ${esc(v.fromName)} (${esc(v.fromGender)})</p>` : ''}
          ${isAdmin ? `<button class="btn-admin-primary assign-slot-btn" data-slot-id="${esc(v.id)}">➕ इस सीट पर यात्री जोड़ें</button>` : ''}
        </article>
      `).join('') : '';
      bdCardsEl.innerHTML = paxCardsHtml + vacCardsHtml;
    }

    const paxRowsHtml = filtered.map((p) => {
      const gTxt = isMale(p.gender) ? 'पुरुष' : 'स्त्री';
      const ph = phoneClean(p.mobile);
      return `
        <tr class="clickable-row" data-pid="${p.id}">
          <td><span class="badge-bus">सीट ${esc(p.seat)}</span></td>
          <td>${esc(p.srNo)}</td>
          <td><strong>${esc(p.fullName)}</strong></td>
          <td>${esc(p.age)} / ${gTxt}</td>
          <td>${esc(p.city)}</td>
          <td>${ph ? `<a class="call-link" href="tel:${esc(ph)}" onclick="event.stopPropagation()">📞 ${esc(p.mobile)}</a>` : '-'}</td>
          ${p.rooms.map((r) => `<td><strong>${esc(r)}</strong></td>`).join('')}
        </tr>
      `;
    }).join('');

    const vacantRowsHtml = !q ? busVacant.map((v) => `
      <tr class="vacant-row">
        <td><span class="freed-badge">सीट ${esc(v.seat)} (रिक्त)</span></td>
        <td>-</td>
        <td colspan="4">
          <strong>💺 उपलब्ध सीट</strong>
          ${v.type === 'freed' ? ` — रद्द यात्री: <em>${esc(v.fromName)}</em> (${esc(v.fromGender)}) के कमरे भी उपलब्ध` : ' — खाली सीट उपलब्ध'}
          ${isAdmin ? `<button class="comm-find-btn assign-slot-btn" data-slot-id="${esc(v.id)}" style="margin-left:8px;">➕ यात्री जोड़ें</button>` : ''}
        </td>
        ${v.rooms.map((r) => `<td><strong>${esc(r)}</strong></td>`).join('')}
      </tr>
    `).join('') : '';

    document.getElementById('bd-table-body').innerHTML = paxRowsHtml + vacantRowsHtml;
  }

  document.getElementById('bus-cards-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.bus-card');
    if (card) openBusDetail(Number(card.dataset.bus));
  });
  document.getElementById('bd-close').addEventListener('click', () => {
    document.getElementById('bus-detail-panel').hidden = true;
    document.getElementById('bus-cards-grid').hidden = false;
  });
  document.getElementById('bd-search').addEventListener('input', renderBusDetailRows);
  document.getElementById('bd-table-body').addEventListener('click', (e) => {
    const assignBtn = e.target.closest('.assign-slot-btn');
    if (assignBtn) {
      e.stopPropagation();
      openEditModal(null, assignBtn.dataset.slotId);
      return;
    }
    const row = e.target.closest('tr[data-pid]');
    if (row) openPassengerModal(Number(row.dataset.pid));
  });
  document.getElementById('bd-cards-view').addEventListener('click', (e) => {
    const assignBtn = e.target.closest('.assign-slot-btn');
    if (assignBtn) {
      e.stopPropagation();
      openEditModal(null, assignBtn.dataset.slotId);
      return;
    }
    const card = e.target.closest('.p-card[data-pid]');
    if (card) openPassengerModal(Number(card.dataset.pid));
  });

  // TAB 3: DHARAMSHALA ROOMS (including Freed Room Slots!)
  function initDharamshalaPills() {
    const container = document.getElementById('dh-pills');
    container.innerHTML = DATA.dharamshalas.map((dh) => `
      <button class="dh-pill ${dh.id === activeDharamshala ? 'active' : ''}" data-dh="${dh.id}">
        <span class="dh-date">${esc(dh.date)} • ${esc(dh.tirth)}</span>
        ${esc(dh.name)}
      </button>
    `).join('');
  }

  function renderRooms() {
    const q = document.getElementById('r-search').value.trim().toLowerCase();
    const gFilter = document.getElementById('r-gender-filter').value;
    const roomMap = new Map(); // rmNo -> { occs: [], freed: [] }

    const ensureRm = (rm) => {
      if (!roomMap.has(rm)) roomMap.set(rm, { occs: [], freed: [] });
      return roomMap.get(rm);
    };

    DATA.passengers.forEach((p) => {
      const rm = p.rooms[activeDharamshala];
      if (!rm || rm === '-') return;
      ensureRm(rm).occs.push(p);
    });

    DATA.freedSlots.filter((s) => !s.filledBy).forEach((fs) => {
      const rm = fs.rooms[activeDharamshala];
      if (!rm || rm === '-') return;
      ensureRm(rm).freed.push(fs);
    });

    const sortedRooms = Array.from(roomMap.entries()).sort((a, b) =>
      String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true, sensitivity: 'base' })
    );

    const filtered = sortedRooms.filter(([rmNo, info]) => {
      const hasMale = info.occs.some((x) => isMale(x.gender)) || info.freed.some((x) => isMale(x.fromGender));
      const hasFemale = info.occs.some((x) => isFemale(x.gender)) || info.freed.some((x) => isFemale(x.fromGender));
      if (gFilter === 'male' && !hasMale) return false;
      if (gFilter === 'female' && !hasFemale) return false;
      if (gFilter === 'freed' && info.freed.length === 0) return false;
      if (q) {
        const hay = `${rmNo} ` + info.occs.map((x) => `${x.fullName} ${x.city} ${x.mobile} bus ${x.bus}`).join(' ')
          + ' ' + info.freed.map((f) => f.fromName).join(' ');
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const totalOccupants = filtered.reduce((acc, [, info]) => acc + info.occs.length, 0);
    const totalFreedBeds = filtered.reduce((acc, [, info]) => acc + info.freed.length, 0);
    document.getElementById('r-count-label').textContent =
      `${DATA.dharamshalas[activeDharamshala].short}: कुल ${filtered.length} कमरे (${totalOccupants} यात्री${totalFreedBeds ? `, ${totalFreedBeds} रिक्त स्थान` : ''})`;

    const grid = document.getElementById('rooms-grid');
    if (!filtered.length) {
      grid.innerHTML = '<div class="card muted">कोई कमरा नहीं मिला।</div>';
      return;
    }

    grid.innerHTML = filtered.map(([rmNo, info]) => {
      const hasM = info.occs.some((x) => isMale(x.gender)) || (info.occs.length === 0 && info.freed.some((x) => isMale(x.fromGender)));
      const hasF = info.occs.some((x) => isFemale(x.gender)) || (info.occs.length === 0 && info.freed.some((x) => isFemale(x.fromGender)));
      let gBadge = '';
      if (hasM && hasF) gBadge = '<span class="badge-gender" style="background:#fee2e2;color:#b91c1c;">⚠️ मिश्रित</span>';
      else if (hasM) gBadge = '<span class="badge-gender badge-male">👨 पुरुष</span>';
      else gBadge = '<span class="badge-gender badge-female">👩 स्त्री</span>';

      return `
        <div class="room-card">
          <div class="room-hdr">
            <span class="room-no">कमरा नं. ${esc(rmNo)}</span>
            <div style="display:flex;gap:5px;align-items:center;">
              ${gBadge}
              <span class="p-sr">${info.occs.length} यात्री</span>
            </div>
          </div>
          <ul class="room-occ-list">
            ${info.occs.map((o) => {
              const ph = phoneClean(o.mobile);
              return `
                <li class="room-occ-item" data-pid="${o.id}">
                  <div>
                    <strong>${esc(o.fullName)}</strong>
                    <div class="muted" style="font-size:11px;">बस ${esc(o.bus)} (सीट ${esc(o.seat)}) • ${esc(o.city)} • ${esc(o.age)} वर्ष</div>
                  </div>
                  ${ph ? `<a class="call-link" href="tel:${esc(ph)}" onclick="event.stopPropagation()">📞</a>` : ''}
                </li>
              `;
            }).join('')}
            ${info.freed.map((fs) => `
              <li class="freed-room-item">
                <div>
                  <strong>💺 रिक्त कमरा स्थान (Available)</strong>
                  <div style="font-size:11px;">रद्द: ${esc(fs.fromName)} • बस ${esc(fs.bus)}/सीट ${esc(fs.seat)}</div>
                </div>
                ${isAdmin ? `<button class="comm-find-btn assign-slot-btn" data-slot-id="${esc(fs.id)}">➕ भरें</button>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }).join('');
  }

  document.getElementById('dh-pills').addEventListener('click', (e) => {
    const btn = e.target.closest('.dh-pill');
    if (!btn) return;
    activeDharamshala = Number(btn.dataset.dh);
    document.querySelectorAll('.dh-pill').forEach((b) => b.classList.toggle('active', b === btn));
    renderRooms();
  });
  document.getElementById('r-search').addEventListener('input', renderRooms);
  document.getElementById('r-gender-filter').addEventListener('change', renderRooms);
  document.getElementById('rooms-grid').addEventListener('click', (e) => {
    const assignBtn = e.target.closest('.assign-slot-btn');
    if (assignBtn) {
      openEditModal(null, assignBtn.dataset.slotId);
      return;
    }
    const li = e.target.closest('.room-occ-item');
    if (li) openPassengerModal(Number(li.dataset.pid));
  });

  // TAB 4: FULL ROUTE & DISTANCE
  function renderRoute() {
    const container = document.getElementById('route-timeline');
    container.innerHTML = DATA.route.map((st) => `
      <div class="route-card">
        <div class="route-step-badge">${esc(st.step)}</div>
        <div>
          <div style="font-weight:800;font-size:1.02rem;color:var(--primary-dark);">${esc(st.name)}</div>
          <div class="muted" style="font-size:0.8rem;">📅 ${esc(st.date)} • ${esc(st.enName)}</div>
          <div style="font-size:0.85rem;margin-top:4px;color:var(--text);">🏛️ ${esc(st.stay)}</div>
          <div class="route-actions">
            <a class="comm-find-btn" style="text-decoration:none;" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.mapQuery)}" target="_blank" rel="noopener">🗺️ Google Maps</a>
            ${st.tirthContactId ? `<button class="comm-find-btn route-contact-btn" data-tirth="${esc(st.name.split('(')[0].trim())}">📞 संपर्क देखें</button>` : ''}
            ${st.dhId !== null && st.dhId !== undefined ? `<button class="comm-find-btn route-room-btn" data-dh="${esc(st.dhId)}">🏨 कमरे देखें</button>` : ''}
          </div>
        </div>
        <div class="route-km-box">
          <span class="km-leg">${st.legKm === 0 ? 'प्रारंभ (Start)' : `+${st.legKm} कि.मी.`}</span>
          <span class="km-total">कुल दूरी: ${st.totalKm} कि.मी.</span>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('route-timeline').addEventListener('click', (e) => {
    const cBtn = e.target.closest('.route-contact-btn');
    if (cBtn) {
      const keyword = cBtn.dataset.tirth.split(' ')[0];
      document.getElementById('c-search').value = keyword === 'श्री' ? '' : keyword;
      renderContacts();
      switchTab('contacts');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const rBtn = e.target.closest('.route-room-btn');
    if (rBtn) {
      activeDharamshala = Number(rBtn.dataset.dh);
      initDharamshalaPills();
      renderRooms();
      switchTab('rooms');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // TAB 5: TIRTH CONTACTS
  function renderContacts() {
    const q = document.getElementById('c-search').value.trim().toLowerCase();
    const svcRegex = activeServiceChip ? new RegExp(activeServiceChip, 'i') : null;

    const filteredTirths = DATA.tirthContacts.map((t) => {
      const tMatches = !q || t.tirth.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q);
      const matchedContacts = t.contacts.filter((c) => {
        if (svcRegex && !svcRegex.test(c.role)) return false;
        if (!q || tMatches) return true;
        return `${c.role} ${c.person} ${c.phone}`.toLowerCase().includes(q);
      });
      return { ...t, contacts: matchedContacts };
    }).filter((t) => t.contacts.length > 0);

    const grid = document.getElementById('contacts-grid');
    if (!filteredTirths.length) {
      grid.innerHTML = '<div class="card muted">कोई संपर्क नहीं मिला।</div>';
      return;
    }

    grid.innerHTML = filteredTirths.map((t) => `
      <div class="tirth-card">
        <div class="tirth-title">${esc(t.id)}. ${esc(t.tirth)}</div>
        <div class="tirth-sub">${esc(t.subtitle)}</div>
        <div class="contact-list">
          ${t.contacts.map((c) => `
            <div class="contact-row">
              <div>
                <div class="contact-role">${esc(c.role)}</div>
                ${c.person ? `<div class="contact-person">${esc(c.person)}</div>` : ''}
              </div>
              ${c.phone
                ? `<a class="call-link" href="tel:${esc(c.phone)}">📞 ${esc(c.phone)}</a>`
                : `<span class="no-phone">नंबर उपलब्ध नहीं</span>`}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  document.getElementById('c-search').addEventListener('input', renderContacts);
  document.getElementById('service-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    activeServiceChip = chip.dataset.service;
    document.querySelectorAll('#service-chips .chip').forEach((c) => c.classList.toggle('active', c === chip));
    renderContacts();
  });

  // TAB 6: COMMITTEES (with Mobile + PIN-based Add/Edit/Delete)
  function renderCommittees() {
    document.getElementById('nav-cnt-comm').textContent = DATA.committees.length;
    const commActions = document.getElementById('comm-admin-actions');
    commActions.hidden = !isAdmin;
    commActions.style.display = isAdmin ? 'flex' : 'none';

    document.getElementById('committees-grid').innerHTML = DATA.committees.map((cm, cIdx) => `
      <div class="comm-card">
        <div class="comm-title">${esc(cm.title)}</div>
        <div class="comm-en">${esc(cm.enTitle || '')}</div>
        <div class="comm-list">
          ${cm.members.map((m, mIdx) => {
            const ph = phoneClean(m.mobile);
            return `
              <div class="comm-member">
                <div>
                  <strong>${esc(m.name)}</strong>
                  <div class="muted" style="font-size:12px;">
                    ${m.city ? `📍 ${esc(m.city)}` : ''}
                    ${ph ? ` ${m.city ? '• ' : ''}<a class="call-link" style="padding:1px 7px;font-size:11px;" href="tel:${esc(ph)}">📞 ${esc(m.mobile)}</a>` : (isAdmin ? '<span style="color:#b45309;font-size:11px;"> (मोबाइल जोड़ें)</span>' : '')}
                  </div>
                </div>
                <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
                  ${m.search ? `<button class="comm-find-btn comm-roster-btn" data-search="${esc(m.search)}">🔍 सूची</button>` : ''}
                  ${isAdmin ? `
                    <button class="comm-find-btn comm-edit-btn" data-cidx="${cIdx}" data-midx="${mIdx}" title="संपादित करें">✏️</button>
                    <button class="comm-find-btn comm-del-btn" data-cidx="${cIdx}" data-midx="${mIdx}" style="border-color:#dc2626;color:#dc2626;" title="हटाएं">🗑️</button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  function openSamitiModal(cIdx = 0, mIdx = null) {
    if (!isAdmin) {
      document.getElementById('pin-modal').hidden = false;
      return;
    }
    const sel = document.getElementById('sf-comm-select');
    sel.innerHTML = DATA.committees.map((cm, idx) => `<option value="${idx}">${esc(cm.title)}</option>`).join('');
    sel.value = String(cIdx);
    document.getElementById('sf-comm-idx').value = String(cIdx);
    document.getElementById('sf-mem-idx').value = mIdx !== null ? String(mIdx) : '';

    if (mIdx !== null) {
      const m = DATA.committees[cIdx].members[mIdx];
      document.getElementById('sm-title').textContent = '✏️ समिति सदस्य संपादित करें';
      document.getElementById('sf-name').value = m.name || '';
      document.getElementById('sf-city').value = m.city || '';
      document.getElementById('sf-mobile').value = m.mobile || '';
      document.getElementById('sf-search').value = m.search || '';
    } else {
      document.getElementById('sm-title').textContent = '➕ नया समिति सदस्य जोड़ें';
      document.getElementById('samiti-form').reset();
      sel.value = String(cIdx);
    }
    document.getElementById('sf-yatri-pick-search').value = '';
    document.getElementById('sf-yatri-pick-list').hidden = true;
    document.getElementById('samiti-modal').hidden = false;
  }

  bindYatriPicker('sf-yatri-pick-search', 'sf-yatri-pick-list', (p) => {
    document.getElementById('sf-name').value = p.fullName;
    document.getElementById('sf-city').value = p.city || '';
    document.getElementById('sf-mobile').value = p.mobile || '';
    document.getElementById('sf-search').value = p.fullName;
  });

  document.getElementById('btn-add-samiti-member').addEventListener('click', () => openSamitiModal(0, null));
  document.getElementById('btn-add-samiti-group').addEventListener('click', () => {
    if (!isAdmin) return;
    const title = prompt('नई समिति का नाम लिखें (Hindi):');
    if (!title || !title.trim()) return;
    const enTitle = prompt('English Title (Optional):', '') || '';
    DATA.committees.push({ id: `comm-${Date.now()}`, title: title.trim(), enTitle: enTitle.trim(), members: [] });
    saveDraft();
    renderCommittees();
  });

  document.getElementById('samiti-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const targetCIdx = Number(document.getElementById('sf-comm-select').value);
    const origCIdx = document.getElementById('sf-comm-idx').value;
    const mIdxVal = document.getElementById('sf-mem-idx').value;
    const memberObj = {
      id: `cm-${Date.now()}`,
      name: document.getElementById('sf-name').value.trim(),
      city: document.getElementById('sf-city').value.trim(),
      mobile: document.getElementById('sf-mobile').value.trim(),
      search: document.getElementById('sf-search').value.trim() || document.getElementById('sf-name').value.trim()
    };

    if (mIdxVal !== '') {
      const oC = Number(origCIdx);
      const mI = Number(mIdxVal);
      if (oC === targetCIdx) {
        DATA.committees[targetCIdx].members[mI] = { ...DATA.committees[targetCIdx].members[mI], ...memberObj };
      } else {
        DATA.committees[oC].members.splice(mI, 1);
        DATA.committees[targetCIdx].members.push(memberObj);
      }
    } else {
      DATA.committees[targetCIdx].members.push(memberObj);
    }

    document.getElementById('samiti-modal').hidden = true;
    saveDraft();
    renderCommittees();
  });

  document.getElementById('committees-grid').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.comm-edit-btn');
    if (editBtn) {
      openSamitiModal(Number(editBtn.dataset.cidx), Number(editBtn.dataset.midx));
      return;
    }
    const delBtn = e.target.closest('.comm-del-btn');
    if (delBtn) {
      const cIdx = Number(delBtn.dataset.cidx);
      const mIdx = Number(delBtn.dataset.midx);
      const m = DATA.committees[cIdx].members[mIdx];
      if (confirm(`क्या आप "${m.name}" को इस समिति से हटाना चाहते हैं?`)) {
        DATA.committees[cIdx].members.splice(mIdx, 1);
        saveDraft();
        renderCommittees();
      }
      return;
    }
    const btn = e.target.closest('.comm-roster-btn');
    if (!btn) return;
    document.getElementById('p-search').value = btn.dataset.search;
    document.getElementById('p-bus-filter').value = '';
    document.getElementById('p-city-filter').value = '';
    document.getElementById('p-gender-filter').value = '';
    renderPassengers();
    switchTab('passengers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // TAB 7: BUS MANAGEMENT TEAM (Bus 1..9)
  function renderBusTeam() {
    document.getElementById('btn-add-busteam-global').hidden = !isAdmin;
    const totalTeamMembers = DATA.busTeam.reduce((acc, bt) => acc + bt.members.length, 0);
    document.getElementById('nav-cnt-busteam').textContent = totalTeamMembers > 0 ? totalTeamMembers : 9;

    document.getElementById('busteam-grid').innerHTML = DATA.busTeam.map((bt) => {
      const cap = Number(DATA.meta.busCapacities[bt.bus] || 0);
      const paxCount = DATA.passengers.filter((p) => Number(p.bus) === bt.bus).length;
      return `
        <div class="comm-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div class="comm-title">🚌 बस नंबर ${esc(bt.bus)} टीम</div>
            <span class="badge-bus">${paxCount} / ${cap} यात्री</span>
          </div>
          <div class="comm-en">Bus ${esc(bt.bus)} Management Team (${bt.members.length} सदस्य)</div>
          <div class="comm-list">
            ${bt.members.length ? bt.members.map((m, mIdx) => {
              const ph = phoneClean(m.mobile);
              return `
                <div class="comm-member">
                  <div>
                    <strong>${esc(m.name)}</strong>
                    ${m.role ? `<span class="freed-badge" style="margin-left:4px;font-size:11px;">${esc(m.role)}</span>` : ''}
                    <div class="muted" style="font-size:12px;">
                      ${m.city ? `📍 ${esc(m.city)}` : ''}
                      ${ph ? ` ${m.city ? '• ' : ''}<a class="call-link" style="padding:1px 7px;font-size:11px;" href="tel:${esc(ph)}">📞 ${esc(m.mobile)}</a>` : ''}
                    </div>
                  </div>
                  ${isAdmin ? `
                    <div style="display:flex;gap:4px;">
                      <button class="comm-find-btn bt-edit-btn" data-bus="${bt.bus}" data-midx="${mIdx}">✏️</button>
                      <button class="comm-find-btn bt-del-btn" data-bus="${bt.bus}" data-midx="${mIdx}" style="border-color:#dc2626;color:#dc2626;">🗑️</button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('') : '<div class="muted" style="font-size:12px;padding:6px 0;">अभी कोई बस प्रभारी नहीं जोड़ा गया है।</div>'}
          </div>
          ${isAdmin ? `<button class="btn-admin-light bt-add-bus-btn" data-bus="${bt.bus}" style="width:100%;margin-top:8px;">➕ Bus ${bt.bus} में सदस्य जोड़ें</button>` : ''}
        </div>
      `;
    }).join('');
  }

  function openBusTeamModal(busNo = 1, mIdx = null) {
    if (!isAdmin) {
      document.getElementById('pin-modal').hidden = false;
      return;
    }
    document.getElementById('bf-orig-bus').value = String(busNo);
    document.getElementById('bf-mem-idx').value = mIdx !== null ? String(mIdx) : '';
    document.getElementById('bf-bus').value = String(busNo);

    if (mIdx !== null) {
      const bt = DATA.busTeam.find((x) => Number(x.bus) === Number(busNo));
      const m = bt.members[mIdx];
      document.getElementById('bm-title').textContent = '✏️ बस टीम सदस्य संपादित करें';
      document.getElementById('bf-role').value = m.role || '';
      document.getElementById('bf-name').value = m.name || '';
      document.getElementById('bf-city').value = m.city || '';
      document.getElementById('bf-mobile').value = m.mobile || '';
    } else {
      document.getElementById('bm-title').textContent = `➕ Bus ${busNo} प्रबंधन टीम सदस्य जोड़ें`;
      document.getElementById('busteam-form').reset();
      document.getElementById('bf-bus').value = String(busNo);
    }
    document.getElementById('bf-yatri-pick-search').value = '';
    document.getElementById('bf-yatri-pick-list').hidden = true;
    document.getElementById('busteam-modal').hidden = false;
  }

  bindYatriPicker('bf-yatri-pick-search', 'bf-yatri-pick-list', (p) => {
    document.getElementById('bf-name').value = p.fullName;
    document.getElementById('bf-city').value = p.city || '';
    document.getElementById('bf-mobile').value = p.mobile || '';
    if (p.bus) document.getElementById('bf-bus').value = String(p.bus);
  });

  document.getElementById('btn-add-busteam-global').addEventListener('click', () => openBusTeamModal(1, null));
  document.getElementById('btn-dl-busteam-xlsx').addEventListener('click', () => handleExport('busteam'));

  document.getElementById('busteam-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const targetBus = Number(document.getElementById('bf-bus').value);
    const origBus = Number(document.getElementById('bf-orig-bus').value);
    const mIdxVal = document.getElementById('bf-mem-idx').value;
    const obj = {
      id: `bt-${Date.now()}`,
      name: document.getElementById('bf-name').value.trim(),
      role: document.getElementById('bf-role').value.trim() || 'बस प्रभारी',
      city: document.getElementById('bf-city').value.trim(),
      mobile: document.getElementById('bf-mobile').value.trim()
    };

    const targetTeam = DATA.busTeam.find((x) => Number(x.bus) === targetBus);
    if (mIdxVal !== '') {
      const mI = Number(mIdxVal);
      const origTeam = DATA.busTeam.find((x) => Number(x.bus) === origBus);
      if (origBus === targetBus) {
        targetTeam.members[mI] = { ...targetTeam.members[mI], ...obj };
      } else {
        origTeam.members.splice(mI, 1);
        targetTeam.members.push(obj);
      }
    } else {
      targetTeam.members.push(obj);
    }

    document.getElementById('busteam-modal').hidden = true;
    saveDraft();
    renderBusTeam();
  });

  document.getElementById('busteam-grid').addEventListener('click', (e) => {
    const addBtn = e.target.closest('.bt-add-bus-btn');
    if (addBtn) {
      openBusTeamModal(Number(addBtn.dataset.bus), null);
      return;
    }
    const editBtn = e.target.closest('.bt-edit-btn');
    if (editBtn) {
      openBusTeamModal(Number(editBtn.dataset.bus), Number(editBtn.dataset.midx));
      return;
    }
    const delBtn = e.target.closest('.bt-del-btn');
    if (delBtn) {
      const busNo = Number(delBtn.dataset.bus);
      const mIdx = Number(delBtn.dataset.midx);
      const bt = DATA.busTeam.find((x) => Number(x.bus) === busNo);
      const m = bt.members[mIdx];
      if (confirm(`क्या आप "${m.name}" को Bus ${busNo} टीम से हटाना चाहते हैं?`)) {
        bt.members.splice(mIdx, 1);
        saveDraft();
        renderBusTeam();
      }
    }
  });

  // TAB 7: CITIES, VACANT SLOTS & CANCELLED
  function renderCitiesVacantCancelled() {
    const cityMap = {};
    DATA.passengers.forEach((p) => {
      const c = p.city || 'अन्य';
      if (!cityMap[c]) cityMap[c] = { families: new Set(), count: 0, male: 0, female: 0 };
      cityMap[c].families.add(p.familyId);
      cityMap[c].count += 1;
      if (isMale(p.gender)) cityMap[c].male += 1;
      else cityMap[c].female += 1;
    });

    const total = DATA.passengers.length || 1;
    const sorted = Object.entries(cityMap).sort((a, b) => b[1].count - a[1].count);
    document.getElementById('city-table-body').innerHTML = sorted.map(([city, st], i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${esc(city)}</strong></td>
        <td>${st.families.size}</td>
        <td><strong>${st.count}</strong></td>
        <td>👨 ${st.male} / 👩 ${st.female}</td>
        <td>${((st.count / total) * 100).toFixed(1)}%</td>
        <td><button class="comm-find-btn city-jump-btn" data-city="${esc(city)}">यात्री देखें →</button></td>
      </tr>
    `).join('');

    // Vacant Slots Grid
    const { freed, emptySeats } = getAvailableSlots();
    const allSlots = [...freed, ...emptySeats];
    const vGrid = document.getElementById('vacant-slots-grid');
    if (!allSlots.length) {
      vGrid.innerHTML = '<div class="muted">कोई खाली सीट या रिक्त कमरा उपलब्ध नहीं है।</div>';
    } else {
      vGrid.innerHTML = allSlots.map((sl) => `
        <div class="room-card" style="border-left:4px solid #16a34a;">
          <div class="room-hdr">
            <span class="room-no">🚌 बस ${esc(sl.bus)} • सीट ${esc(sl.seat)}</span>
            <span class="freed-badge">${sl.type === 'freed' ? 'रद्द स्लॉट (कमरे सहित)' : 'खाली बस सीट'}</span>
          </div>
          ${sl.type === 'freed' ? `
            <p class="muted" style="font-size:12px;margin-bottom:8px;">
              पूर्व यात्री: <strong>${esc(sl.fromName)}</strong> (${esc(sl.fromGender)})
            </p>
            <div class="rooms-mini-grid" style="border-top:none;padding-top:0;margin-bottom:8px;">
              ${sl.rooms.map((rm, i) => `
                <div class="rm-chip ${rm === '-' ? 'empty' : ''}">
                  <span class="rm-lbl">${esc(DH_SHORT[i])}</span>
                  <span class="rm-val">${esc(rm)}</span>
                </div>
              `).join('')}
            </div>
          ` : '<p class="muted" style="font-size:12px;margin-bottom:8px;">इस सीट के साथ नए यात्री के लिए धर्मशाला कमरा अलग से चुनें।</p>'}
          ${isAdmin
            ? `<button class="btn-admin-primary assign-slot-btn" data-slot-id="${esc(sl.id)}" style="width:100%;">➕ इस सीट पर अंतिम यात्री जोड़ें</button>`
            : '<div class="muted" style="font-size:11px;">एडिट करने के लिए ऊपर 🔒 Admin अनलॉक करें</div>'}
        </div>
      `).join('');
    }

    // Cancelled Table
    document.getElementById('cancelled-table-body').innerHTML = DATA.cancelled.map((c) => `
      <tr>
        <td>${esc(c.srNo)}</td>
        <td><strong>${esc(c.fullName)}</strong></td>
        <td>${esc(c.age || '-')} / ${esc(c.gender)}</td>
        <td>${esc(c.city)}</td>
        <td>${esc(c.mobile || '-')}</td>
        <td>${esc(c.headOfFamily || '-')}</td>
        <td>${c.oldBus ? `<span class="freed-badge">B${esc(c.oldBus)} / S${esc(c.oldSeat)}</span> ${esc(c.reason || '')}` : 'पूर्व से रद्द'}</td>
      </tr>
    `).join('');
  }

  document.getElementById('city-table-body').addEventListener('click', (e) => {
    const btn = e.target.closest('.city-jump-btn');
    if (!btn) return;
    document.getElementById('p-search').value = '';
    document.getElementById('p-bus-filter').value = '';
    document.getElementById('p-city-filter').value = btn.dataset.city;
    document.getElementById('p-gender-filter').value = '';
    renderPassengers();
    switchTab('passengers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('vacant-slots-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.assign-slot-btn');
    if (btn) openEditModal(null, btn.dataset.slotId);
  });

  function switchSubTab(subName) {
    document.querySelectorAll('.sub-tab').forEach((b) => b.classList.toggle('active', b.dataset.sub === subName));
    document.querySelectorAll('.sub-panel').forEach((p) => {
      p.hidden = p.id !== 'sub-' + subName;
    });
  }

  document.querySelectorAll('.sub-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchSubTab(btn.dataset.sub));
  });

  // PASSENGER MODAL + CANCEL / EDIT ACTIONS
  function openPassengerModal(pid) {
    const p = DATA.passengers.find((x) => x.id === pid);
    if (!p) return;

    const ph = phoneClean(p.mobile);
    const wa = waNumber(p.mobile);
    const famMembers = DATA.passengers.filter((x) => x.familyId === p.familyId);

    const waModalBtns = !wa ? '' : isAdmin
      ? `
        <a class="call-link" style="background:#dcfce7;color:#166534;font-size:0.86rem;padding:5px 12px;" href="https://wa.me/${esc(wa)}?text=${encodeURIComponent(buildSingleWaMessage(p))}" target="_blank" rel="noopener">💬 यात्री विवरण भेजें</a>
        <a class="call-link" style="background:#15803d;color:#fff;font-size:0.86rem;padding:5px 12px;" href="https://wa.me/${esc(wa)}?text=${encodeURIComponent(buildFamilyWaMessage(p, famMembers))}" target="_blank" rel="noopener">👨‍👩‍👧‍👦 परिवार विवरण भेजें</a>
      `
      : `<a class="call-link" style="background:#dcfce7;color:#166534;font-size:0.88rem;padding:5px 12px;" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">💬 WhatsApp</a>`;

    document.getElementById('m-name').textContent = p.fullName;
    document.getElementById('m-sub').textContent = `Sr #${p.srNo} • ${p.gender} • ${p.age} वर्ष • ${p.city}, ${p.state}`;

    document.getElementById('m-body').innerHTML = `
      <div class="modal-section" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;">
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
          <span class="badge-bus" style="font-size:0.9rem;padding:5px 12px;">🚌 बस नंबर ${esc(p.bus)} • सीट नंबर ${esc(p.seat)}</span>
          ${ph ? `<a class="call-link" style="font-size:0.88rem;padding:5px 12px;" href="tel:${esc(ph)}">📞 कॉल: ${esc(p.mobile)}</a>` : ''}
          ${waModalBtns}
        </div>
        ${isAdmin ? `
          <div style="display:flex;gap:6px;">
            <button class="btn-admin-light" id="modal-edit-btn" data-pid="${p.id}">✏️ संपादित करें</button>
            <button class="btn-admin-danger" id="modal-cancel-btn" data-pid="${p.id}">❌ यात्री रद्द करें</button>
          </div>
        ` : ''}
      </div>

      <div class="modal-section">
        <h4>🏨 धर्मशाला एवं कमरा आवंटन विवरण</h4>
        <div class="rooms-mini-grid" style="grid-template-columns:repeat(auto-fit,minmax(175px,1fr));">
          ${DATA.dharamshalas.map((dh, idx) => `
            <div class="rm-chip ${p.rooms[idx] === '-' ? 'empty' : ''}" style="text-align:left;padding:7px 9px;">
              <span class="rm-lbl">${esc(dh.date)} • ${esc(dh.tirth)}</span>
              <span style="display:block;font-size:11px;color:#4b5563;">${esc(dh.name)}</span>
              <span class="rm-val" style="font-size:0.95rem;">कमरा: ${esc(p.rooms[idx])}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="modal-section">
        <h4>👨‍👩‍👧‍👦 परिवार के सभी सदस्य (${famMembers.length} सदस्य • मुखिया: ${esc(p.headOfFamily || '-')})</h4>
        ${famMembers.map((fm) => `
          <div class="family-member-card ${fm.id === p.id ? 'current' : ''}">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
              <strong>#${esc(fm.srNo)} ${esc(fm.fullName)} (${esc(fm.age)} वर्ष, ${isMale(fm.gender) ? 'पुरुष' : 'स्त्री'})</strong>
              <span class="badge-bus">B${esc(fm.bus)} • S${esc(fm.seat)}</span>
            </div>
            <div class="muted" style="font-size:12px;margin-top:4px;">
              कमरे: मांडोली <strong>${esc(fm.rooms[0])}</strong> | संकेश्वर <strong>${esc(fm.rooms[1] !== '-' ? fm.rooms[1] : fm.rooms[2])}</strong> | गिरनार <strong>${esc(fm.rooms[3])}</strong> | भीलड़ी <strong>${esc(fm.rooms[4] !== '-' ? fm.rooms[4] : fm.rooms[5])}</strong>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('detail-modal').hidden = false;
  }

  document.getElementById('m-body').addEventListener('click', (e) => {
    const editBtn = e.target.closest('#modal-edit-btn');
    if (editBtn) {
      document.getElementById('detail-modal').hidden = true;
      openEditModal(Number(editBtn.dataset.pid));
      return;
    }
    const cancelBtn = e.target.closest('#modal-cancel-btn');
    if (cancelBtn) {
      cancelPassenger(Number(cancelBtn.dataset.pid));
    }
  });

  function cancelPassenger(pid) {
    if (!isAdmin) return;
    const idx = DATA.passengers.findIndex((x) => x.id === pid);
    if (idx === -1) return;
    const p = DATA.passengers[idx];
    const reason = prompt(`क्या आप "${p.fullName}" (Bus ${p.bus}, Seat ${p.seat}) को रद्द करना चाहते हैं?\n\nइनकी सीट व कमरे 'रिक्त स्लॉट' में सुरक्षित रहेंगे ताकि अंतिम समय वाले यात्री को दिए जा सकें।\n\nरद्द करने का कारण (वैकल्पिक):`, 'व्यक्तिगत कारण');
    if (reason === null) return;

    // 1. Move to cancelled list
    DATA.cancelled.push({
      srNo: p.srNo,
      memberNo: p.memberNo,
      fullName: p.fullName,
      age: p.age,
      gender: p.gender,
      city: p.city,
      state: p.state,
      mobile: p.mobile,
      headOfFamily: p.headOfFamily,
      oldBus: p.bus,
      oldSeat: p.seat,
      oldRooms: [...p.rooms],
      reason: reason.trim() || 'रद्द',
      cancelledAt: new Date().toISOString()
    });

    // 2. Preserve their Bus Seat & all 6 Room numbers inside freedSlots!
    DATA.freedSlots.push({
      id: `freed-${Date.now()}-${p.id}`,
      fromName: p.fullName,
      fromGender: p.gender,
      bus: p.bus,
      seat: p.seat,
      rooms: [...p.rooms],
      freedAt: new Date().toISOString(),
      filledBy: null
    });

    // 3. Remove from active passengers & re-sequence Sr No cleanly
    DATA.passengers.splice(idx, 1);
    DATA.passengers.forEach((m, i) => { m.srNo = i + 1; });

    document.getElementById('detail-modal').hidden = true;
    saveDraft();
    renderAll();
    alert(`✅ "${p.fullName}" को रद्द सूची में ले जाया गया।\nबस ${p.bus} सीट ${p.seat} और उनके सभी कमरा नंबर अब "रिक्त सीट व कमरा स्लॉट" में उपलब्ध हैं!`);
  }

  // ADD LAST-ARRIVAL / EDIT PASSENGER MODAL
  function openEditModal(pid = null, preselectSlotId = null) {
    if (!isAdmin) {
      document.getElementById('pin-modal').hidden = false;
      return;
    }

    const isEdit = pid !== null;
    const existing = isEdit ? DATA.passengers.find((x) => x.id === pid) : null;
    document.getElementById('em-title').textContent = isEdit ? '✏️ यात्री विवरण संपादित करें' : '➕ अंतिम / नया यात्री जोड़ें';
    document.getElementById('ef-id').value = isEdit ? String(pid) : '';
    document.getElementById('ef-slot-warn').hidden = true;

    // Populate Available / Freed Slots Picker
    const slotWrap = document.getElementById('ef-slot-picker-wrap');
    const slotSel = document.getElementById('ef-slot-select');
    const { freed, emptySeats } = getAvailableSlots();
    const allSlots = [...freed, ...emptySeats];

    if (!isEdit && allSlots.length > 0) {
      slotWrap.hidden = false;
      slotSel.innerHTML = '<option value="">-- उपलब्ध सीट / रद्द कमरा स्लॉट चुनें --</option>' +
        allSlots.map((sl) => {
          if (sl.type === 'freed') {
            const rms = sl.rooms.filter((r) => r !== '-').join(', ');
            return `<option value="${esc(sl.id)}">🌟 रद्द स्लॉट: Bus ${sl.bus} Seat ${sl.seat} (${sl.fromGender}) | पूर्व: ${esc(sl.fromName)} | कमरे: ${esc(rms)}</option>`;
          }
          return `<option value="${esc(sl.id)}">💺 खाली सीट: Bus ${sl.bus} Seat ${sl.seat}</option>`;
        }).join('');
    } else {
      slotWrap.hidden = isEdit;
    }

    if (existing) {
      document.getElementById('ef-name').value = existing.fullName;
      document.getElementById('ef-hof').value = existing.headOfFamily || '';
      document.getElementById('ef-age').value = existing.age || '';
      document.getElementById('ef-gender').value = isFemale(existing.gender) ? 'स्त्री (Female)' : 'पुरुष (Male)';
      document.getElementById('ef-city').value = existing.city || '';
      document.getElementById('ef-state').value = existing.state || '';
      document.getElementById('ef-mobile').value = existing.mobile || '';
      document.getElementById('ef-bus').value = String(existing.bus);
      document.getElementById('ef-seat').value = existing.seat || '';
      for (let i = 0; i < 6; i++) {
        document.getElementById(`ef-r${i}`).value = existing.rooms[i] || '-';
      }
    } else {
      document.getElementById('edit-form').reset();
      for (let i = 0; i < 6; i++) document.getElementById(`ef-r${i}`).value = '-';
      if (preselectSlotId) {
        slotSel.value = preselectSlotId;
        applySelectedSlot(preselectSlotId);
      }
    }

    document.getElementById('edit-modal').hidden = false;
  }

  function applySelectedSlot(slotId) {
    const warnEl = document.getElementById('ef-slot-warn');
    warnEl.hidden = true;
    currentSlotGenderWarningRef = null;
    if (!slotId) return;

    const { freed, emptySeats } = getAvailableSlots();
    const sl = [...freed, ...emptySeats].find((x) => x.id === slotId);
    if (!sl) return;

    document.getElementById('ef-bus').value = String(sl.bus);
    document.getElementById('ef-seat').value = sl.seat;
    for (let i = 0; i < 6; i++) {
      document.getElementById(`ef-r${i}`).value = sl.rooms[i] || '-';
    }
    if (sl.type === 'freed') {
      currentSlotGenderWarningRef = sl.fromGender;
      checkSlotGenderMatch();
    }
  }

  function checkSlotGenderMatch() {
    const warnEl = document.getElementById('ef-slot-warn');
    if (!currentSlotGenderWarningRef) {
      warnEl.hidden = true;
      return;
    }
    const newG = document.getElementById('ef-gender').value;
    const same = (isMale(newG) && isMale(currentSlotGenderWarningRef)) || (isFemale(newG) && isFemale(currentSlotGenderWarningRef));
    if (!same) {
      warnEl.textContent = `⚠️ ध्यान दें: यह कमरा स्लॉट "${currentSlotGenderWarningRef}" के लिए था, जबकि नया यात्री "${newG}" है! कृपया नीचे धर्मशाला कमरे लिंग के अनुसार बदलें।`;
      warnEl.hidden = false;
    } else {
      warnEl.textContent = `✅ लिंग मेल खाता है (${newG}) — सभी 6 धर्मशाला कमरे स्वतः भर दिए गए हैं।`;
      warnEl.hidden = false;
    }
  }

  document.getElementById('ef-slot-select').addEventListener('change', (e) => applySelectedSlot(e.target.value));
  document.getElementById('ef-gender').addEventListener('change', checkSlotGenderMatch);

  document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pidVal = document.getElementById('ef-id').value;
    const fullName = document.getElementById('ef-name').value.trim();
    const hof = document.getElementById('ef-hof').value.trim();
    const age = Number(document.getElementById('ef-age').value);
    const gender = document.getElementById('ef-gender').value;
    const city = document.getElementById('ef-city').value.trim();
    const state = document.getElementById('ef-state').value.trim();
    const mobile = document.getElementById('ef-mobile').value.trim();
    const bus = Number(document.getElementById('ef-bus').value);
    const seat = Number(document.getElementById('ef-seat').value);
    const rooms = [0, 1, 2, 3, 4, 5].map((i) => {
      const v = document.getElementById(`ef-r${i}`).value.trim();
      return v || '-';
    });

    if (pidVal) {
      const p = DATA.passengers.find((x) => x.id === Number(pidVal));
      if (p) {
        p.fullName = fullName;
        p.headOfFamily = hof || fullName;
        p.age = age;
        p.gender = gender;
        p.city = city;
        p.state = state;
        p.mobile = mobile;
        p.bus = bus;
        p.seat = seat;
        p.rooms = rooms;
      }
    } else {
      const nextId = DATA.passengers.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
      const nextFam = DATA.passengers.reduce((m, x) => Math.max(m, Number(x.familyId) || 0), 0) + 1;
      DATA.passengers.push({
        id: nextId,
        srNo: DATA.passengers.length + 1,
        memberNo: 1,
        familyId: nextFam,
        firstName: fullName.split(' ')[0] || fullName,
        fatherHusbandName: '',
        gotra: '',
        fullName,
        age,
        gender,
        city,
        state,
        mobile,
        headOfFamily: hof || fullName,
        bus,
        seat,
        rooms
      });

      // Mark freedSlot as filled if chosen or matching same bus/seat
      const chosenSlotId = document.getElementById('ef-slot-select').value;
      const freedMatch = DATA.freedSlots.find((s) => !s.filledBy && (s.id === chosenSlotId || (Number(s.bus) === bus && Number(s.seat) === seat)));
      if (freedMatch) {
        freedMatch.filledBy = fullName;
        freedMatch.filledAt = new Date().toISOString();
      }
    }

    document.getElementById('edit-modal').hidden = true;
    saveDraft();
    renderAll();
  });

  // ADMIN PIN AUTH
  document.getElementById('btn-admin-auth').addEventListener('click', () => {
    if (isAdmin) {
      isAdmin = false;
      sessionStorage.removeItem(AUTH_KEY);
      renderAll();
    } else {
      document.getElementById('pin-input').value = '';
      document.getElementById('pin-error').hidden = true;
      document.getElementById('pin-modal').hidden = false;
      setTimeout(() => document.getElementById('pin-input').focus(), 50);
    }
  });

  document.getElementById('pin-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.getElementById('pin-input').value.trim() === ADMIN_PIN) {
      isAdmin = true;
      sessionStorage.setItem(AUTH_KEY, '1');
      document.getElementById('pin-modal').hidden = true;
      renderAll();
    } else {
      document.getElementById('pin-error').hidden = false;
    }
  });

  document.getElementById('btn-add-member').addEventListener('click', () => openEditModal(null, null));
  document.getElementById('btn-view-vacant').addEventListener('click', () => {
    switchTab('cities');
    switchSubTab('vacant-list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('btn-discard-draft').addEventListener('click', () => {
    if (confirm('क्या आप इस डिवाइस पर किए गए अप्रकाशित लोकल बदलाव हटाकर लाइव डेटा लोड करना चाहते हैं?')) {
      localStorage.removeItem(DRAFT_KEY);
      location.reload();
    }
  });

  // GITHUB SYNC (OPTION A)
  function getGitHubCfg() {
    let cfg = { owner: '', repo: '', branch: 'main', path: 'data/yatra-data.json', token: '' };
    try {
      const saved = JSON.parse(localStorage.getItem(GH_KEY) || '{}');
      cfg = { ...cfg, ...saved };
    } catch {}
    // Auto-detect owner/repo from *.github.io/<repo>/
    if (!cfg.owner && /\.github\.io$/i.test(window.location.hostname)) {
      cfg.owner = window.location.hostname.split('.')[0];
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length > 0 && !cfg.repo) cfg.repo = parts[0];
    }
    return cfg;
  }

  document.getElementById('btn-gh-settings').addEventListener('click', () => {
    const cfg = getGitHubCfg();
    document.getElementById('gh-owner').value = cfg.owner;
    document.getElementById('gh-repo').value = cfg.repo;
    document.getElementById('gh-branch').value = cfg.branch || 'main';
    document.getElementById('gh-path').value = cfg.path || 'data/yatra-data.json';
    document.getElementById('gh-token').value = cfg.token || '';
    document.getElementById('gh-msg').textContent = '';
    document.getElementById('gh-modal').hidden = false;
  });

  document.getElementById('gh-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const cfg = {
      owner: document.getElementById('gh-owner').value.trim(),
      repo: document.getElementById('gh-repo').value.trim(),
      branch: document.getElementById('gh-branch').value.trim() || 'main',
      path: document.getElementById('gh-path').value.trim() || 'data/yatra-data.json',
      token: document.getElementById('gh-token').value.trim()
    };
    localStorage.setItem(GH_KEY, JSON.stringify(cfg));
    document.getElementById('gh-modal').hidden = true;
    alert('✅ GitHub सिंक सेटिंग्स सहेजी गईं! अब आप "☁️ GitHub पर लाइव सेव" बटन दबा सकते हैं।');
  });

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  async function publishToGitHub() {
    if (!isAdmin) return;
    const cfg = getGitHubCfg();
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      document.getElementById('btn-gh-settings').click();
      return;
    }

    const btn = document.getElementById('btn-publish-github');
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ सेव हो रहा है...';

    try {
      const apiUrl = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${cfg.path}`;
      const headers = {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      };

      let sha = null;
      const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(cfg.branch)}`, { headers });
      if (getRes.ok) {
        const meta = await getRes.json();
        sha = meta.sha;
      }

      ensureDataIntegrity();
      const jsonStr = JSON.stringify(DATA, null, 2);
      const body = {
        message: `Update Yatra data via Committee Portal (${new Date().toLocaleString('en-IN')})`,
        content: utf8ToBase64(jsonStr),
        branch: cfg.branch
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${putRes.status}`);
      }

      localStorage.removeItem(DRAFT_KEY);
      hasDraft = false;
      updateAdminUI();
      alert('✅ बदलाव GitHub रिपॉजिटरी पर सफलतापूर्वक लाइव हो गए! 30–60 सेकंड में सभी सदस्यों को नया डेटा दिखेगा।');
    } catch (err) {
      alert(`❌ GitHub पर सेव नहीं हो सका: ${err.message}\n\nसुझाव: ⚙️ GitHub सेटिंग्स जांचें या "📥 Excel → JSON बैकअप" डाउनलोड करें।`);
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  }

  document.getElementById('btn-publish-github').addEventListener('click', publishToGitHub);

  // EXCEL EXPORT CENTER (SheetJS .xlsx with CSV fallback)
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportSheetsToXlsx(sheets, filename) {
    if (window.XLSX) {
      const wb = window.XLSX.utils.book_new();
      sheets.forEach(({ name, rows }) => {
        const ws = window.XLSX.utils.aoa_to_sheet(rows);
        window.XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
      });
      window.XLSX.writeFile(wb, filename);
    } else {
      // Fallback UTF-8 CSV of first sheet
      const csv = sheets[0].rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
      downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), filename.replace(/\.xlsx$/, '.csv'));
    }
  }

  function passengerHeaderRow() {
    return [
      'Sr No', 'Member No', 'Full Name', 'Age', 'Gender', 'City', 'State', 'Mobile',
      'Head of Family', 'Bus No', 'Seat No',
      'Mandoli (13/12)', 'Sankheshwar Paras (14/12)', 'Sankheshwar Rajendra (14/12)',
      'Girnar (15-16/12)', 'Bhiladi Sanghvi (17/12)', 'Bhiladi Bhuribai (17/12)'
    ];
  }

  function passengerToRow(p) {
    return [
      p.srNo, p.memberNo, p.fullName, p.age, p.gender, p.city, p.state, p.mobile,
      p.headOfFamily, p.bus, p.seat, ...p.rooms
    ];
  }

  function handleExport(kind, singleBusNo = null) {
    if (!isAdmin) {
      document.getElementById('pin-modal').hidden = false;
      return;
    }
    if (kind === 'json') {
      downloadBlob(new Blob([JSON.stringify(DATA, null, 2)], { type: 'application/json' }), 'yatra-data.json');
      return;
    }
    if (kind === 'single-bus' && singleBusNo) {
      const pax = DATA.passengers.filter((p) => Number(p.bus) === singleBusNo)
        .sort((a, z) => (Number(a.seat) || 999) - (Number(z.seat) || 999));
      exportSheetsToXlsx([{ name: `Bus ${singleBusNo}`, rows: [passengerHeaderRow(), ...pax.map(passengerToRow)] }], `Bus_${singleBusNo}_Yatra_2026.xlsx`);
      return;
    }
    if (kind === 'master') {
      // Exact match to: Google_Form_Census_All_Grouped_City_Wise with Bus and Room No.xlsx
      const allHeader = [
        'Sr No', 'Member No', 'यात्री का नाम (Passenger Name)', 'पिता / पति का नाम (Father / Husband Name)',
        'गोत्र (Gotra)', 'उम्र (Age)', 'लिंग (Gender)', 'City', 'States', 'मोबाइल नं. (Mobile Number)',
        'परिवार के मुखिया का नाम (Head of Family Name)', 'Status', 'Bus No.', 'Seat No.',
        '13/12/26 \nमांडोली तीर्थ\nशांति पुरम धर्मशाला',
        '14/12/26 \nसंकेश्वर तीर्थ\nपारस पद्मावती मंदिर ट्रस्ट धर्मशाला',
        '14/12/26 \nसंकेश्वर तीर्थ\nराजेंद्र सूरी नवकार मंदिर ट्रस्ट ',
        '15/12/26  And 16/12/26\nगिरनार  तीर्थ\nगिरनार दर्शन धर्मशाला',
        '17/12/26 \nभीलड़ीजी  तीर्थ\nश्री संघवी धर्मशाला',
        '17/12/26 \nभीलड़ीजी तीर्थ\nभूरी बाई धर्मशाला'
      ];
      const allRows = [allHeader];
      let lastFam = null;
      DATA.passengers.forEach((p) => {
        if (lastFam !== null && p.familyId !== lastFam) {
          allRows.push([]); // preserve 1 blank separator row after every family
        }
        lastFam = p.familyId;
        allRows.push([
          p.srNo,
          p.memberNo,
          p.firstName || p.fullName,
          p.fatherHusbandName || '',
          p.gotra || '',
          p.age,
          p.gender,
          p.city,
          p.state,
          p.mobile,
          p.headOfFamily,
          p.status !== undefined ? p.status : 1,
          p.bus,
          p.seat,
          ...p.rooms
        ]);
      });

      const cancHeader = [
        'Sr No', 'Member No', 'यात्री का नाम (Passenger Name)', 'पिता / पति का नाम (Father / Husband Name)',
        'गोत्र (Gotra)', 'उम्र (Age)', 'लिंग (Gender)', 'City', 'States', 'मोबाइल नं. (Mobile Number)',
        'परिवार के मुखिया का नाम (Head of Family Name)', 'Status'
      ];
      const cancRows = [cancHeader, ...DATA.cancelled.map((c) => [
        c.srNo, c.memberNo || 1, c.firstName || c.fullName, c.fatherHusbandName || '', c.gotra || '',
        c.age, c.gender, c.city, c.state || '', c.mobile, c.headOfFamily, c.status !== undefined ? c.status : 1
      ])];

      const citySummaryRows = [['Sr No', 'City / Cluster', 'Total Households', 'Total Members', '% of Total']];
      const cm = {};
      DATA.passengers.forEach((p) => {
        const rawCity = p.city || 'Other';
        const cKey = rawCity.startsWith('Mumbai') ? 'Mumbai' : rawCity;
        if (!cm[cKey]) cm[cKey] = { f: new Set(), n: 0 };
        cm[cKey].f.add(p.familyId);
        cm[cKey].n++;
      });
      const totalMem = DATA.passengers.length || 1;
      let totalHH = 0;
      Object.keys(cm).sort((a, b) => a.localeCompare(b)).forEach((c, idx) => {
        totalHH += cm[c].f.size;
        citySummaryRows.push([idx + 1, c, cm[c].f.size, cm[c].n, `${((cm[c].n / totalMem) * 100).toFixed(1)}%`]);
      });
      citySummaryRows.push([null, 'Grand Total', totalHH, totalMem, '100.0%']);

      exportSheetsToXlsx([
        { name: 'All_Members_Grouped', rows: allRows },
        { name: 'cancelled _Members', rows: cancRows },
        { name: 'City_Summary', rows: citySummaryRows }
      ], 'Google_Form_Census_All_Grouped_City_Wise with Bus and Room No.xlsx');
      return;
    }
    if (kind === 'busteam') {
      const commRows = [['समिति (Committee)', 'English Title', 'सदस्य का नाम (Name)', 'शहर (City)', 'मोबाइल (Mobile)']];
      DATA.committees.forEach((cm) => cm.members.forEach((m) => commRows.push([cm.title, cm.enTitle || '', m.name, m.city, m.mobile || ''])));
      const btRows = [['बस नं. (Bus No)', 'पद (Role)', 'सदस्य का नाम (Name)', 'शहर (City)', 'मोबाइल (Mobile)']];
      DATA.busTeam.forEach((bt) => {
        if (bt.members.length === 0) btRows.push([`Bus ${bt.bus}`, '-', '(कोई सदस्य दर्ज नहीं)', '', '']);
        else bt.members.forEach((m) => btRows.push([`Bus ${bt.bus}`, m.role, m.name, m.city, m.mobile]));
      });
      exportSheetsToXlsx([
        { name: 'Committees_Samiti', rows: commRows },
        { name: 'Bus_Management_Team', rows: btRows }
      ], 'Samdari_Girnar_Committees_And_Bus_Team.xlsx');
      return;
    }
    if (kind === 'buses') {
      const sumRows = [['Bus No', 'Capacity', 'Allotted', 'Vacant', 'Male', 'Female']];
      const sheets = [{ name: 'Summary', rows: sumRows }];
      for (let b = 1; b <= 9; b++) {
        const cap = Number(DATA.meta.busCapacities[b] || 0);
        const pax = DATA.passengers.filter((p) => Number(p.bus) === b).sort((a, z) => (Number(a.seat) || 999) - (Number(z.seat) || 999));
        const m = pax.filter((x) => isMale(x.gender)).length;
        const f = pax.filter((x) => isFemale(x.gender)).length;
        sumRows.push([`Bus ${b}`, cap, pax.length, cap - pax.length, m, f]);
        sheets.push({ name: `Bus ${b}`, rows: [passengerHeaderRow(), ...pax.map(passengerToRow)] });
      }
      exportSheetsToXlsx(sheets, 'Samdari_Girnar_Bus_Wise_All_9.xlsx');
      return;
    }
    if (kind === 'rooms') {
      const sheets = DATA.dharamshalas.map((dh, idx) => {
        const rows = [['Room No', 'Passenger Name', 'Gender', 'Age', 'Bus', 'Seat', 'City', 'Mobile']];
        DATA.passengers
          .filter((p) => p.rooms[idx] && p.rooms[idx] !== '-')
          .sort((a, z) => String(a.rooms[idx]).localeCompare(String(z.rooms[idx]), undefined, { numeric: true }))
          .forEach((p) => rows.push([p.rooms[idx], p.fullName, p.gender, p.age, p.bus, p.seat, p.city, p.mobile]));
        return { name: dh.short, rows };
      });
      exportSheetsToXlsx(sheets, 'Samdari_Girnar_Dharamshala_Rooms.xlsx');
      return;
    }
    if (kind === 'cities') {
      const { freed, emptySeats } = getAvailableSlots();
      const cRows = [['City', 'Households', 'Members']];
      const cm = {};
      DATA.passengers.forEach((p) => {
        const c = p.city || 'Other';
        if (!cm[c]) cm[c] = { f: new Set(), n: 0 };
        cm[c].f.add(p.familyId); cm[c].n++;
      });
      Object.entries(cm).sort((a, b) => a[0].localeCompare(b[0])).forEach(([c, s]) => cRows.push([c, s.f.size, s.n]));
      const vRows = [['Type', 'Bus', 'Seat', 'Previous Member', 'Gender', 'Mandoli', 'Sank_Paras', 'Sank_Raj', 'Girnar', 'Bhil_Sanghvi', 'Bhil_Bhuribai'],
        ...[...freed, ...emptySeats].map((sl) => [sl.type, sl.bus, sl.seat, sl.fromName, sl.fromGender, ...sl.rooms])];
      const cancRows = [['Sr No', 'Name', 'Age', 'Gender', 'City', 'Mobile', 'Old Bus', 'Old Seat', 'Reason'],
        ...DATA.cancelled.map((c) => [c.srNo, c.fullName, c.age, c.gender, c.city, c.mobile, c.oldBus || '', c.oldSeat || '', c.reason || ''])];
      exportSheetsToXlsx([
        { name: 'City_Wise', rows: cRows },
        { name: 'Vacant_And_Freed', rows: vRows },
        { name: 'Cancelled', rows: cancRows }
      ], 'Samdari_Girnar_Cities_Vacant_Cancelled.xlsx');
      return;
    }
    if (kind === 'route') {
      const rRows = [['Step', 'Place', 'Date', 'Segment KM', 'Total KM', 'Stay / Details'],
        ...DATA.route.map((st) => [st.step, st.name, st.date, st.legKm, st.totalKm, st.stay])];
      const tRows = [['Tirth', 'Subtitle', 'Role', 'Contact Person', 'Phone']];
      DATA.tirthContacts.forEach((t) => t.contacts.forEach((c) => tRows.push([t.tirth, t.subtitle, c.role, c.person, c.phone])));
      exportSheetsToXlsx([
        { name: 'Route_Distance', rows: rRows },
        { name: 'Tirth_Contacts', rows: tRows }
      ], 'Samdari_Girnar_Route_And_Contacts.xlsx');
    }
  }

  document.getElementById('btn-export-open').addEventListener('click', () => {
    if (!isAdmin) {
      document.getElementById('pin-modal').hidden = false;
      return;
    }
    document.getElementById('export-modal').hidden = false;
  });
  document.querySelectorAll('.export-card-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleExport(btn.dataset.export);
      document.getElementById('export-modal').hidden = true;
    });
  });
  document.getElementById('btn-dl-all-buses-xlsx').addEventListener('click', () => handleExport('buses'));
  document.getElementById('bd-dl-xlsx').addEventListener('click', () => handleExport('single-bus', selectedBusNo));

  // Modal Close Wiring
  document.addEventListener('click', (e) => {
    const closeId = e.target.dataset && e.target.dataset.close;
    if (closeId) document.getElementById(closeId).hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['detail-modal', 'pin-modal', 'edit-modal', 'gh-modal', 'export-modal', 'samiti-modal', 'busteam-modal'].forEach((id) => {
        document.getElementById(id).hidden = true;
      });
    }
  });
  document.getElementById('btn-print').addEventListener('click', () => window.print());

  // Boot: Render immediately from data.js / local draft, then check live data/yatra-data.json on http(s)
  loadDraftIfAny();
  initDharamshalaPills();
  renderAll();

  if (!hasDraft && /^https?:$/i.test(window.location.protocol)) {
    fetch(`./data/yatra-data.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((live) => {
        if (live && Array.isArray(live.passengers)) {
          DATA = live;
          renderAll();
        }
      })
      .catch(() => {});
  }
})();
