const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyS04CFxA-98pigIeGQjnTCISZmx_hNFqVfZr_7Du4gc-8p90ROX4BQovyyoyD9qoc/exec";

const TEAM_GOAL = 20000;
const STORAGE_KEYS = {
  cachedLeaderboard: "sommarjaktenP2013.cachedLeaderboard",
  latestSessions: "sommarjaktenP2013.latestSessions",
  lastPlayer: "sommarjaktenP2013.lastPlayer"
};

const players = [
  "Albin Ericsson",
  "Alexander Leufstedt",
  "Alexander Ramberg",
  "Alvar Wetterstedt",
  "August Flodell",
  "Carl Lundin",
  "Carl Tiensuu",
  "Charlie Lundqvist",
  "Erik Andersson",
  "Erik Sigfrid",
  "Kasper Karlsson",
  "Love Slorafoss",
  "Lowe Segergren",
  "Nils Wångklev Jönsson",
  "Oscar Lind",
  "Oscar Siekermann",
  "Otto Petersson",
  "Pelle Wasseng",
  "Valter Jonasson",
  "Victor Bako",
  "Vidar Haraldsson",
  "Wilhelm Nelson"
];

const exercises = [
  {
    id: "skater",
    name: "Skridskohopp",
    icon: "↔",
    points: 25,
    category: "Sidled",
    reps: "3 x 8 per sida",
    description: "Långa sidledshopp med mjuk landning och stabil bål.",
    bonusTags: ["defense", "jump"]
  },
  {
    id: "line-jumps",
    name: "Linjehopp",
    icon: "▦",
    points: 20,
    category: "Fotarbete",
    reps: "3 x 20 sek",
    description: "Snabba hopp över linjen med kort markkontakt.",
    bonusTags: ["jump"]
  },
  {
    id: "vertical-jumps",
    name: "Upphopp",
    icon: "↑",
    points: 25,
    category: "Spänst",
    reps: "3 x 6",
    description: "Explosivt upp, kontrollerat ner, knän över tår.",
    bonusTags: ["jump"]
  },
  {
    id: "defense-steps",
    name: "Försvarssteg",
    icon: "▣",
    points: 20,
    category: "Handboll",
    reps: "4 x 20 sek",
    description: "Låg position, snabba fötter och blicken framåt.",
    bonusTags: ["defense"]
  },
  {
    id: "explosive-starts",
    name: "Explosiva starter",
    icon: "»",
    points: 20,
    category: "Snabbhet",
    reps: "6 x 10 m",
    description: "Full fart från första steget och vila ordentligt mellan.",
    bonusTags: ["speed"]
  },
  {
    id: "single-leg-jumps",
    name: "Enbenshopp",
    icon: "1",
    points: 30,
    category: "Balans",
    reps: "3 x 5 per ben",
    description: "Hoppa kontrollerat och frys landningen i två sekunder.",
    bonusTags: ["jump"]
  }
];

const levels = [
  { name: "Rookie", min: 0, next: 200 },
  { name: "Brons", min: 200, next: 500 },
  { name: "Silver", min: 500, next: 1000 },
  { name: "Guld", min: 1000, next: 2000 },
  { name: "Legend", min: 2000, next: null }
];

const state = {
  selectedExercises: new Set(),
  leaderboard: [],
  weeklyLeaderboard: [],
  dataSource: "Lokal data"
};

const el = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  populatePlayerSelects();
  renderDailyMission();
  renderExercises();
  wireEvents();
  restoreLastPlayer();
  updateSessionSummary();
  loadLeaderboard();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});

function cacheElements() {
  [
    "activePlayersCount",
    "coachRecentSessions",
    "coachTeamScore",
    "dailyMission",
    "exerciseGrid",
    "exportCsv",
    "heroTeamScore",
    "leaderboardList",
    "leaderboardSource",
    "passMission",
    "passRecentSessions",
    "passTeamGoalProgress",
    "passTeamGoalText",
    "passTeamScoreLine",
    "passWeeklySpotlight",
    "profilePlayer",
    "playerRecentSessions",
    "playerSummary",
    "quickRegistration",
    "refreshLeaderboard",
    "saveStatus",
    "selectedExerciseCount",
    "sessionBadges",
    "sessionExerciseSummary",
    "sessionForm",
    "sessionNotes",
    "sessionPlayer",
    "sessionBonusSummary",
    "sessionScore",
    "sideBadgeStrip",
    "sideProfileCard",
    "sideTeamGoalProgress",
    "sideTeamGoalText",
    "sideTeamScore",
    "developmentChart",
    "teamGoalProgress",
    "teamGoalText",
    "weeklySpotlight",
    "zeroScorePlayers"
  ].forEach((id) => {
    el[id] = document.getElementById(id);
  });
}

function wireEvents() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  el.sessionForm.addEventListener("submit", saveSession);
  el.refreshLeaderboard.addEventListener("click", loadLeaderboard);
  el.exportCsv.addEventListener("click", exportVisibleCsv);
  el.quickRegistration.addEventListener("click", () => {
    showView("passView");
    el.sessionPlayer.focus();
  });
  el.profilePlayer.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEYS.lastPlayer, el.profilePlayer.value);
    renderPlayerView();
  });
  el.sessionPlayer.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEYS.lastPlayer, el.sessionPlayer.value);
    el.profilePlayer.value = el.sessionPlayer.value;
    renderPlayerView();
  });
}

function populatePlayerSelects() {
  [el.sessionPlayer, el.profilePlayer].forEach((select) => {
    players.forEach((player) => {
      const option = document.createElement("option");
      option.value = player;
      option.textContent = player;
      select.append(option);
    });
  });
}

function restoreLastPlayer() {
  const lastPlayer = localStorage.getItem(STORAGE_KEYS.lastPlayer);
  if (players.includes(lastPlayer)) {
    el.sessionPlayer.value = lastPlayer;
    el.profilePlayer.value = lastPlayer;
  }
}

function renderDailyMission() {
  const missions = [
    "Välj minst tre övningar och jaga bonusen Bra pass.",
    "Kombinera Skridskohopp och Försvarssteg för att bli Försvarsgeneral.",
    "Satsa på hoppstyrka: två hoppövningar låter dig låsa upp Jump Master.",
    "Kör alla sex övningar för Full pott och ett rejält kliv på topplistan.",
    "Kort och smart slår långt och aldrig: välj en övning och håll rutinen."
  ];
  const seed = new Date().toISOString().slice(0, 10).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const mission = missions[seed % missions.length];
  if (el.dailyMission) el.dailyMission.textContent = mission;
  if (el.passMission) el.passMission.textContent = mission;
}

function renderExercises() {
  el.exerciseGrid.innerHTML = "";
  exercises.forEach((exercise) => {
    const button = document.createElement("button");
    button.className = "exercise-card";
    button.type = "button";
    button.dataset.exerciseId = exercise.id;
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `
      <div class="exercise-card__top">
        <span class="exercise-icon" aria-hidden="true">${exercise.icon}</span>
        <div>
          <h3>${exercise.name}</h3>
          <p>${exercise.description}</p>
        </div>
        <span class="exercise-card__points">${exercise.points} p</span>
      </div>
      <div class="exercise-card__meta">
        <span class="tag">${exercise.category}</span>
        <span class="tag">${exercise.reps}</span>
      </div>
    `;
    button.addEventListener("click", () => toggleExercise(exercise.id));
    el.exerciseGrid.append(button);
  });
}

function showView(viewId) {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewId);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === viewId);
  });

  if (viewId === "playerView") renderPlayerView();
  if (viewId === "coachView") renderCoachView();
}

function toggleExercise(exerciseId) {
  if (state.selectedExercises.has(exerciseId)) {
    state.selectedExercises.delete(exerciseId);
  } else {
    state.selectedExercises.add(exerciseId);
  }
  updateSessionSummary();
}

function calculateSession() {
  const selected = exercises.filter((exercise) => state.selectedExercises.has(exercise.id));
  const exercisePoints = selected.reduce((sum, exercise) => sum + exercise.points, 0);
  const defenseCount = selected.filter((exercise) => exercise.bonusTags.includes("defense")).length;
  const jumpCount = selected.filter((exercise) => exercise.bonusTags.includes("jump")).length;
  const badges = [];
  let bonus = 0;

  if (selected.length >= 3) {
    bonus += 10;
    badges.push("Bra pass");
  }
  if (selected.length >= 5) {
    bonus += 20;
    badges.push("Stort pass");
  }
  if (defenseCount >= 2) {
    bonus += 15;
    badges.push("Försvarsgeneral");
  }
  if (jumpCount >= 2) {
    bonus += 15;
    badges.push("Jump Master");
  }
  if (selected.length === 6) {
    bonus += 25;
    badges.push("Full pott");
  }

  return {
    badges,
    bonus,
    exerciseCount: selected.length,
    exercises: selected.map((exercise) => exercise.name),
    score: exercisePoints + bonus
  };
}

function updateSessionSummary() {
  const result = calculateSession();

  document.querySelectorAll(".exercise-card").forEach((card) => {
    const selected = state.selectedExercises.has(card.dataset.exerciseId);
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });

  el.selectedExerciseCount.textContent = `${result.exerciseCount} valda`;
  el.sessionScore.textContent = result.score;
  el.sessionExerciseSummary.textContent = result.exerciseCount
    ? `${result.exerciseCount} övningar`
    : "Inga övningar valda";
  el.sessionBonusSummary.textContent = result.badges.length
    ? `Bonus: ${result.badges.join(", ")}`
    : "Bonusbadges visas här.";
  el.sessionBadges.innerHTML = result.badges.length
    ? result.badges.map((badge) => `<span class="badge">${badge}</span>`).join("")
    : '<span class="compact-pill">Inga bonusbadges ännu</span>';
}

async function saveSession(event) {
  event.preventDefault();
  const playerName = el.sessionPlayer.value;
  const notes = el.sessionNotes.value.trim();
  const result = calculateSession();

  if (!playerName) {
    el.saveStatus.textContent = "Välj spelare innan du sparar.";
    el.sessionPlayer.focus();
    return;
  }
  if (result.exerciseCount < 1) {
    el.saveStatus.textContent = "Välj minst en övning.";
    return;
  }

  const estimatedTotal = getPlayerScore(playerName) + result.score;
  const payload = {
    playerName,
    score: result.score,
    exerciseCount: result.exerciseCount,
    exercises: result.exercises,
    badges: uniqueList([...result.badges, ...getMilestoneBadges(estimatedTotal)]),
    notes,
    clientTimestamp: new Date().toISOString()
  };

  setSaving(true);
  saveLocalSession(payload);

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });
    el.saveStatus.textContent = "Passet är sparat. Topplistan uppdateras när Google Sheets har tagit emot det.";
  } catch (error) {
    el.saveStatus.textContent = "Kunde inte nå Google Sheets. Passet finns sparat lokalt på den här enheten.";
  } finally {
    setSaving(false);
  }

  state.selectedExercises.clear();
  el.sessionNotes.value = "";
  updateSessionSummary();
  burstConfetti();
  renderAllViews();
  loadLeaderboard();
}

function setSaving(isSaving) {
  const button = el.sessionForm.querySelector(".primary-action");
  button.disabled = isSaving;
  button.textContent = isSaving ? "Sparar..." : "Spara pass";
}

function saveLocalSession(session) {
  const sessions = getLocalSessions();
  sessions.unshift(session);
  localStorage.setItem(STORAGE_KEYS.latestSessions, JSON.stringify(sessions.slice(0, 80)));
}

function getLocalSessions() {
  return readJson(STORAGE_KEYS.latestSessions, []);
}

async function loadLeaderboard() {
  el.refreshLeaderboard.disabled = true;
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || data.ok !== true || !Array.isArray(data.leaderboard)) {
      throw new Error("Unexpected leaderboard response");
    }

    state.leaderboard = normalizeLeaderboard(data.leaderboard);
    state.weeklyLeaderboard = normalizeLeaderboard(data.weeklyLeaderboard || data.leaderboard);
    state.dataSource = "Google Sheets";
    localStorage.setItem(STORAGE_KEYS.cachedLeaderboard, JSON.stringify({
      leaderboard: state.leaderboard,
      weeklyLeaderboard: state.weeklyLeaderboard,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    const fallback = getFallbackLeaderboard();
    state.leaderboard = fallback.leaderboard;
    state.weeklyLeaderboard = fallback.weeklyLeaderboard.length ? fallback.weeklyLeaderboard : fallback.leaderboard;
    state.dataSource = fallback.source;
  } finally {
    el.refreshLeaderboard.disabled = false;
    renderAllViews();
  }
}

function normalizeLeaderboard(rows) {
  return rows
    .map((row) => ({
      name: String(row.name || "").trim(),
      score: Number(row.score) || 0
    }))
    .filter((row) => players.includes(row.name))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "sv"));
}

function getFallbackLeaderboard() {
  const cached = readJson(STORAGE_KEYS.cachedLeaderboard, null);
  if (cached && Array.isArray(cached.leaderboard) && cached.leaderboard.length) {
    return {
      leaderboard: normalizeLeaderboard(cached.leaderboard),
      weeklyLeaderboard: normalizeLeaderboard(cached.weeklyLeaderboard || cached.leaderboard),
      source: "Senast sparad lokal data"
    };
  }

  const fromSessions = buildLeaderboardFromSessions(getLocalSessions());
  return {
    leaderboard: fromSessions,
    weeklyLeaderboard: fromSessions,
    source: "Lokala pass"
  };
}

function buildLeaderboardFromSessions(sessions) {
  const totals = new Map(players.map((player) => [player, 0]));
  sessions.forEach((session) => {
    if (totals.has(session.playerName)) {
      totals.set(session.playerName, totals.get(session.playerName) + (Number(session.score) || 0));
    }
  });
  return [...totals.entries()]
    .filter(([, score]) => score > 0)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "sv"));
}

function renderAllViews() {
  renderPassDashboard();
  renderLeaderboardView();
  renderPlayerView();
  renderCoachView();
}

function renderPassDashboard() {
  const teamScore = getTeamScore();
  const progress = Math.min(100, Math.round((teamScore / TEAM_GOAL) * 100));
  const weeklyWinner = state.weeklyLeaderboard[0] || state.leaderboard[0];

  if (el.passTeamGoalText) el.passTeamGoalText.textContent = `${progress}%`;
  if (el.passTeamGoalProgress) el.passTeamGoalProgress.style.width = `${progress}%`;
  if (el.passTeamScoreLine) {
    el.passTeamScoreLine.innerHTML = `<strong>${formatNumber(teamScore)}</strong> / ${formatNumber(TEAM_GOAL)} poäng`;
  }
  if (el.sideTeamScore) el.sideTeamScore.textContent = `${formatNumber(teamScore)} / ${formatNumber(TEAM_GOAL)} poäng`;
  if (el.sideTeamGoalText) el.sideTeamGoalText.textContent = `${progress}%`;
  if (el.sideTeamGoalProgress) el.sideTeamGoalProgress.style.width = `${progress}%`;

  if (el.passWeeklySpotlight) {
    el.passWeeklySpotlight.innerHTML = weeklyWinner
      ? `
        <div class="weekly-card__inner">
          <div class="avatar-bubble">${getInitials(weeklyWinner.name)}</div>
          <div>
            <p class="section-kicker">Veckans spelare</p>
            <h2>${weeklyWinner.name}</h2>
            <p>${weeklyWinner.score} poäng den här veckan</p>
          </div>
          <div class="rank-medal">1</div>
        </div>
      `
      : `
        <div class="weekly-card__inner">
          <div class="avatar-bubble">HK</div>
          <div>
            <p class="section-kicker">Veckans spelare</p>
            <h2>Första passet väntar</h2>
            <p>Registrera ett pass och ta ledningen.</p>
          </div>
          <div class="rank-medal">1</div>
        </div>
      `;
  }

  if (el.passRecentSessions) {
    el.passRecentSessions.innerHTML = renderSessionRows(getLocalSessions().slice(0, 3));
  }
}

function renderLeaderboardView() {
  const teamScore = getTeamScore();
  const progress = Math.min(100, Math.round((teamScore / TEAM_GOAL) * 100));
  const weeklyWinner = state.weeklyLeaderboard[0] || state.leaderboard[0];

  el.heroTeamScore.textContent = formatNumber(teamScore);
  el.teamGoalText.textContent = `${progress}%`;
  el.teamGoalProgress.style.width = `${progress}%`;
  el.leaderboardSource.textContent = state.dataSource;

  el.weeklySpotlight.innerHTML = weeklyWinner
    ? `<div><p class="section-kicker">Veckans spelare</p><strong>${weeklyWinner.name}</strong><p class="row-subtitle">${getLevel(weeklyWinner.score).name}</p></div><span>${weeklyWinner.score} p</span>`
    : '<div><p class="section-kicker">Veckans spelare</p><strong>Ingen poäng ännu</strong><p class="row-subtitle">Första passet tar ledningen.</p></div><span>0 p</span>';

  el.leaderboardList.innerHTML = state.leaderboard.length
    ? state.leaderboard.map((row, index) => `
      <div class="leaderboard-row">
        <span class="rank ${index < 3 ? "is-top" : ""}">${index + 1}</span>
        <div>
          <div class="row-title">${row.name}</div>
          <p class="row-subtitle">${getLevel(row.score).name}</p>
        </div>
        <div class="row-points">${row.score} p</div>
      </div>
    `).join("")
    : '<p class="empty-state">Ingen registrerad poäng ännu.</p>';
}

function renderPlayerView() {
  const selectedPlayer = el.profilePlayer.value || el.sessionPlayer.value || players[0];
  el.profilePlayer.value = selectedPlayer;
  const score = getPlayerScore(selectedPlayer);
  const level = getLevel(score);
  const nextText = level.next
    ? `${Math.max(0, level.next - score)} p till ${getLevel(level.next).name}`
    : "Maxnivå uppnådd";
  const progress = getLevelProgress(score, level);
  const badges = getPlayerBadges(selectedPlayer, score);

  el.playerSummary.innerHTML = `
    <div class="player-score">
      <div>
        <strong>${score}</strong>
        <span>totalpoäng</span>
      </div>
      <div class="level-chip">${level.name}</div>
    </div>
    <div>
      <div class="progress-track" aria-label="Progress till nästa nivå">
        <span style="width:${progress}%"></span>
      </div>
      <p class="row-subtitle">${nextText}</p>
    </div>
    <div class="badge-strip">
      ${badges.length ? badges.map((badge) => `<span class="badge">${badge}</span>`).join("") : '<span class="compact-pill">Inga badges ännu</span>'}
    </div>
  `;

  const sessions = getLocalSessions().filter((session) => session.playerName === selectedPlayer).slice(0, 5);
  el.playerRecentSessions.innerHTML = renderSessionRows(sessions);

  renderSideProfile(selectedPlayer, score, level, progress, badges);
}

function renderSideProfile(playerName, score, level, progress, badges) {
  const sessions = getLocalSessions().filter((session) => session.playerName === playerName);
  const passCount = sessions.length;
  const minutesPerPass = passCount ? 30 : 0;
  const streak = getLocalStreak(sessions);

  if (el.sideProfileCard) {
    el.sideProfileCard.innerHTML = `
      <div class="profile-card__top">
        <div class="avatar-bubble">${getInitials(playerName)}</div>
        <div>
          <h2>${playerName}</h2>
          <p class="row-subtitle">${level.name} · ${level.next ? `${score} / ${level.next} XP` : `${score} XP`}</p>
          <div class="progress-track" aria-label="Profilprogress">
            <span style="width:${progress}%"></span>
          </div>
        </div>
        <div class="level-badge">${level.name === "Legend" ? "L" : Math.max(1, levels.findIndex((item) => item.name === level.name) + 1)}</div>
      </div>
      <div class="profile-stats">
        <div class="profile-stat"><strong>${passCount}</strong><span>Pass</span></div>
        <div class="profile-stat"><strong>${formatNumber(score)}</strong><span>Poäng</span></div>
        <div class="profile-stat"><strong>${minutesPerPass}</strong><span>Min/pass</span></div>
        <div class="profile-stat"><strong>${streak}</strong><span>Streak</span></div>
      </div>
    `;
  }

  if (el.sideBadgeStrip) {
    const badgeCatalog = ["Jump Master", "Speedster", "Full pott", "Försvarsgeneral", "Summer Hero"];
    el.sideBadgeStrip.innerHTML = badgeCatalog.map((badge, index) => `
      <div class="shield-badge ${badges.includes(badge) ? "" : "is-locked"}">
        <span class="shield" style="--shield-color:${getBadgeColor(badge, index)}">${getBadgeSymbol(badge)}</span>
        <span>${badge}</span>
      </div>
    `).join("");
  }

  if (el.developmentChart) {
    el.developmentChart.innerHTML = renderDevelopmentChart(playerName);
  }
}

function renderCoachView() {
  const teamScore = getTeamScore();
  const playersWithScore = new Set(state.leaderboard.filter((row) => row.score > 0).map((row) => row.name));
  const zeroScore = players.filter((player) => !playersWithScore.has(player));

  el.activePlayersCount.textContent = playersWithScore.size;
  el.coachTeamScore.textContent = formatNumber(teamScore);
  el.zeroScorePlayers.innerHTML = zeroScore.length
    ? zeroScore.map((player) => `<span class="compact-pill">${player}</span>`).join("")
    : '<p class="empty-state">Alla spelare har registrerad poäng.</p>';
  el.coachRecentSessions.innerHTML = renderSessionRows(getLocalSessions().slice(0, 8));
}

function renderSessionRows(sessions) {
  if (!sessions.length) {
    return '<p class="empty-state">Inga lokala pass på den här enheten.</p>';
  }
  return sessions.map((session) => `
    <div class="session-row">
      <div>
        <div class="row-title">${session.playerName}</div>
        <p class="row-subtitle">${formatDate(session.clientTimestamp)} · ${session.exerciseCount} övningar · ${session.exercises.join(", ")}</p>
        ${session.notes ? `<p class="row-subtitle">${session.notes}</p>` : ""}
      </div>
      <div class="row-points">${session.score} p</div>
    </div>
  `).join("");
}

function getTeamScore() {
  return state.leaderboard.reduce((sum, row) => sum + row.score, 0);
}

function getPlayerScore(playerName) {
  const row = state.leaderboard.find((entry) => entry.name === playerName);
  return row ? row.score : 0;
}

function getLevel(score) {
  return [...levels].reverse().find((level) => score >= level.min) || levels[0];
}

function getLevelProgress(score, level) {
  if (!level.next) return 100;
  const span = level.next - level.min;
  return Math.max(0, Math.min(100, Math.round(((score - level.min) / span) * 100)));
}

function getMilestoneBadges(score) {
  const badges = [];
  if (score >= 100) badges.push("Speedster");
  if (score >= 250) badges.push("Jump Master");
  if (score >= 500) badges.push("Summer Hero");
  if (score >= 1000) badges.push("Legend");
  return badges;
}

function getPlayerBadges(playerName, score) {
  const localBadges = getLocalSessions()
    .filter((session) => session.playerName === playerName)
    .flatMap((session) => session.badges || []);
  return uniqueList([...getMilestoneBadges(score), ...localBadges])
    .filter((badge) => ["Speedster", "Jump Master", "Summer Hero", "Legend", "Försvarsgeneral", "Full pott", "Bra pass", "Stort pass"].includes(badge));
}

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getBadgeColor(badge, index) {
  const colors = {
    "Jump Master": "#6d35d8",
    Speedster: "#0573d8",
    "Försvarsgeneral": "#0b7b2a",
    "Full pott": "#f25216",
    "Summer Hero": "#7b818a",
    Legend: "#151515",
    "Bra pass": "#e30613",
    "Stort pass": "#f7b731"
  };
  return colors[badge] || ["#6d35d8", "#0573d8", "#f25216", "#0b7b2a", "#7b818a"][index % 5];
}

function getBadgeSymbol(badge) {
  if (badge === "Speedster") return "»";
  if (badge === "Försvarsgeneral") return "▣";
  if (badge === "Full pott") return "6";
  if (badge === "Legend") return "L";
  if (badge === "Summer Hero") return "★";
  if (badge === "Stort pass") return "5";
  if (badge === "Bra pass") return "3";
  return "↗";
}

function getLocalStreak(sessions) {
  if (!sessions.length) return 0;
  const days = new Set(sessions
    .filter((session) => session.clientTimestamp)
    .map((session) => new Date(session.clientTimestamp).toISOString().slice(0, 10)));
  if (!days.size) return 0;
  let streak = 0;
  const cursor = new Date();

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function renderDevelopmentChart(playerName) {
  const days = [];
  const now = new Date();
  const sessions = getLocalSessions().filter((session) => session.playerName === playerName);

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const score = sessions
      .filter((session) => session.clientTimestamp && session.clientTimestamp.slice(0, 10) === key)
      .reduce((sum, session) => sum + (Number(session.score) || 0), 0);
    days.push({
      label: new Intl.DateTimeFormat("sv-SE", { weekday: "short" }).format(date),
      score
    });
  }

  const maxScore = Math.max(100, ...days.map((day) => day.score));
  const points = days.map((day, index) => {
    const x = 16 + index * 46;
    const y = 118 - (day.score / maxScore) * 92;
    return `${x},${y}`;
  }).join(" ");

  return `
    <svg viewBox="0 0 310 150" role="img" aria-label="Poäng senaste veckan">
      <g stroke="#e8e8ec" stroke-width="1">
        <line x1="16" y1="26" x2="292" y2="26"></line>
        <line x1="16" y1="72" x2="292" y2="72"></line>
        <line x1="16" y1="118" x2="292" y2="118"></line>
      </g>
      <polyline points="${points}" fill="none" stroke="#e30613" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></polyline>
      ${days.map((day, index) => {
        const x = 16 + index * 46;
        const y = 118 - (day.score / maxScore) * 92;
        return `<circle cx="${x}" cy="${y}" r="5" fill="#e30613"></circle><text x="${x}" y="144" text-anchor="middle" font-size="11" fill="#676a72">${day.label}</text>`;
      }).join("")}
    </svg>
  `;
}

function burstConfetti() {
  const layer = document.getElementById("confettiLayer");
  const colors = ["#e30613", "#ffffff", "#f7b731", "#151515"];
  layer.innerHTML = "";

  for (let i = 0; i < 34; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 130}px`);
    piece.style.animationDelay = `${Math.random() * 140}ms`;
    layer.append(piece);
  }

  window.setTimeout(() => {
    layer.innerHTML = "";
  }, 1200);
}

function exportVisibleCsv() {
  const rows = [
    ["Sektion", "Namn", "Poang", "Detalj"],
    ...state.leaderboard.map((row) => ["Total topplista", row.name, row.score, getLevel(row.score).name]),
    ...players
      .filter((player) => getPlayerScore(player) === 0)
      .map((player) => ["Utan poäng", player, 0, ""]),
    ...getLocalSessions().slice(0, 20).map((session) => [
      "Lokalt pass",
      session.playerName,
      session.score,
      `${formatDate(session.clientTimestamp)} | ${session.exercises.join(" + ")}`
    ])
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sommarjakten-p2013-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function uniqueList(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatNumber(number) {
  return new Intl.NumberFormat("sv-SE").format(number);
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
