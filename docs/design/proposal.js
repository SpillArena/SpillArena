/* Standalone design study: no account calls, cookies, or persistent storage. */
const copy = {
  no: {
    skip: 'Hopp til spillene', navGames: 'Finn et spill', signIn: 'Logg inn', settings: 'Innstillinger',
    eyebrow: 'Små spill. Store utfordringer.', titleFirst: 'Alt står', titleSecond: 'på spill.',
    intro: 'Utfordre en bot. Test det du kan. Eller finn en ny favoritt. Neste runde er bare et klikk unna.',
    explore: 'Finn ditt neste spill', surprise: 'Overrask meg', guestNote: 'Gratis å spille. Ingen konto nødvendig.',
    featured: 'I rampelyset', featuredDescription: 'Verden ligger for dine føtter. Hvor godt kjenner du den?',
    play: 'Spill nå', collection: 'Din neste «bare én runde til»', allGames: 'Finn din favoritt.',
    filterLabel: 'Filtrer spill', filterAll: 'Alle spill', strategy: 'Taktikk', words: 'Ord & bilder', knowledge: 'Kunnskap', music: 'Musikk',
    accountTitle: 'Én konto. Hele arenaen.', accountDescription: 'Ta med deg fremgangen mellom spillene. Eller spill som gjest — du velger.',
    accountMore: 'Om SpillArena-kontoen', footerTagline: 'Laget for spillegleden.', storage: 'Lagring & personvern', prototype: 'Designforslag',
    versionLabel: 'Versjon', changelogIntro: 'Endringshistorikk for SpillArena. Nyeste utgave først.',
    close: 'Lukk', language: 'Språk', appearance: 'Utseende', light: 'Lyst', system: 'System', dark: 'Mørkt',
    systemHelp: 'System følger enhetens valg av lyst eller mørkt tema.',
    preferencesNote: 'Valgene i dette designforslaget gjelder bare mens siden er åpen.',
    accountPreview: 'I den ferdige løsningen åpner denne knappen dagens innlogging, med brukernavn og PIN. Dette er en visuell forhåndsvisning.',
    guestPlay: 'Spill som gjest', storagePreview: 'Dette designforslaget lagrer ingen innstillinger eller kontodata. I den ferdige løsningen åpnes SpillArenas eksisterende dialog for lagring og samtykke her.',
    pickAgain: 'Prøv et annet', pickedLabel: 'Ditt neste spill?', betaLabel: 'Under utvikling',
    betaNote: 'Dette spillet er i beta og kan ha feil eller uferdige funksjoner. Vil du fortsette?',
    count: n => `${n} spill å utforske`,
  },
  en: {
    skip: 'Skip to games', navGames: 'Find a game', signIn: 'Sign in', settings: 'Settings',
    eyebrow: 'Small games. Big challenges.', titleFirst: 'Everything’s', titleSecond: 'at stake.',
    intro: 'Challenge a bot. Put your knowledge to the test. Or find a new favorite. Your next round is just a click away.',
    explore: 'Find your next game', surprise: 'Surprise me', guestNote: 'Free to play. No account needed.',
    featured: 'In the spotlight', featuredDescription: 'The world is at your feet. How well do you know it?',
    play: 'Play now', collection: 'Your next “just one more round”', allGames: 'Find your favorite.',
    filterLabel: 'Filter games', filterAll: 'All games', strategy: 'Strategy', words: 'Words & pictures', knowledge: 'Knowledge', music: 'Music',
    accountTitle: 'One account. The whole arena.', accountDescription: 'Take your progress from game to game. Or play as a guest — your choice.',
    accountMore: 'About your SpillArena account', footerTagline: 'Made for the joy of playing.', storage: 'Storage & privacy', prototype: 'Design proposal',
    versionLabel: 'Version', changelogIntro: 'SpillArena release history. Latest release first.',
    close: 'Close', language: 'Language', appearance: 'Appearance', light: 'Light', system: 'System', dark: 'Dark',
    systemHelp: 'System follows your device’s light or dark theme preference.',
    preferencesNote: 'Preferences in this design proposal last only while this page is open.',
    accountPreview: 'In the finished design, this button opens the existing username and PIN sign-in. This is a visual preview.',
    guestPlay: 'Play as a guest', storagePreview: 'This design proposal saves no preferences or account data. The finished design opens SpillArena’s existing storage and consent dialog here.',
    pickAgain: 'Try another', pickedLabel: 'Your next game?', betaLabel: 'In development',
    betaNote: 'This game is in beta and may have bugs or unfinished features. Would you like to continue?',
    count: n => `${n} ${n === 1 ? 'game' : 'games'} to explore`,
  },
};
const games = [
  { title: 'FleetBot', asset: 'FleetBot', path: 'fleetbot', category: 'strategy', no: 'Plasser skipene dine. Les motstanderen. Senk hele flåten.', en: 'Place your ships. Read your opponent. Sink the entire fleet.' },
  { title: 'HangBot', asset: 'HangBot', path: 'hangbot', category: 'words', no: 'Ett ord. Noen få sjanser. Klarer du å gjette før det er for sent?', en: 'One word. A few chances. Can you guess it before it’s too late?' },
  { title: 'ScribbleBot', asset: 'ScribbleBot', path: 'scribblebot', category: 'words', no: 'Boten tegner, du gjetter. Se hva som skjuler seg i strekene.', en: 'The bot draws, you guess. Find the word hiding in the lines.' },
  { title: 'AtlasMaster', asset: 'AtlasMaster', path: 'atlasmaster', category: 'knowledge', no: 'Fra Norge til resten av verden. Sett geografikunnskapene på prøve.', en: 'From Norway to the rest of the world. Put your geography to the test.' },
  { title: 'Proportion Panic', asset: 'ProportionPanic', path: 'proportionpanic', category: 'knowledge', no: 'Hvor stort er det egentlig? Stol på øyemålet og slå klokka.', en: 'How big is it, really? Trust your eye and beat the clock.' },
  { title: 'Pixel Panic', asset: 'PixelPanic', path: 'pixelpanic', category: 'words', no: 'Bildet blir skarpere. Ser du svaret før resten av pikslene?', en: 'The picture gets sharper. Can you see the answer before the pixels reveal it?' },
  { title: 'EraShuffle', asset: 'EraShuffle', path: 'erashuffle', category: 'knowledge', beta: true, no: 'Fem historiske øyeblikk. Én riktig rekkefølge. Sett tiden på plass.', en: 'Five moments in history. One right order. Put time in its place.' },
  { title: 'MelodyRush', asset: 'MelodyRush', path: 'melodyrush/', category: 'music', beta: true, no: 'Finn din neste musikalske utfordring.', en: 'Find your next musical challenge.' },
];
let language = 'no';
let filter = 'all';
let pickedGame = null;
let pickerMode = false;
let themePreference = 'light';
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const grid = document.getElementById('game-grid');
const gameDialog = document.getElementById('game-dialog');
const assetUrl = game => `../../src/assets/games/${game.asset}.svg`;
const playUrl = game => `https://spillarena.no/${game.path}`;

function renderGames() {
  const visibleGames = games.filter(game => filter === 'all' || game.category === filter);
  grid.replaceChildren(...visibleGames.map(game => {
    const card = document.createElement('a');
    card.className = 'game-card';
    card.href = playUrl(game);
    card.setAttribute('aria-label', `${copy[language].play}: ${game.title}${game.beta ? ' · Beta' : ''}`);
    card.innerHTML = `<div class="card-art"><img src="${assetUrl(game)}" alt="" width="1200" height="675" loading="lazy">${game.beta ? '<span class="beta-badge">BETA</span>' : ''}</div><div class="card-copy"><p class="category-label">${copy[language][game.category]}</p><h3>${game.title}</h3><p class="card-description">${game[language]}</p></div><div class="card-footer"><span>${copy[language].play}</span><span class="card-arrow" aria-hidden="true">↗</span></div>`;
    if (game.beta) card.addEventListener('click', event => { event.preventDefault(); showGame(game, false); });
    return card;
  }));
  document.getElementById('game-count').textContent = copy[language].count(visibleGames.length);
}

function renderPickedGame() {
  if (!pickedGame) return;
  document.getElementById('picked-label').textContent = copy[language][pickerMode ? 'pickedLabel' : 'betaLabel'];
  document.getElementById('picked-title').textContent = pickedGame.title;
  document.getElementById('picked-description').textContent = pickedGame[language];
  document.getElementById('picked-art').src = assetUrl(pickedGame);
  document.getElementById('picked-play').href = playUrl(pickedGame);
  document.getElementById('beta-note').hidden = !pickedGame.beta;
  document.getElementById('beta-note').textContent = copy[language].betaNote;
  document.getElementById('pick-again').hidden = !pickerMode;
}

function setLanguage(nextLanguage) {
  language = nextLanguage;
  document.documentElement.lang = language === 'no' ? 'nb' : 'en';
  document.querySelectorAll('[data-copy]').forEach(element => { element.textContent = copy[language][element.dataset.copy]; });
  document.querySelectorAll('[data-label]').forEach(element => { element.setAttribute('aria-label', copy[language][element.dataset.label]); });
  document.querySelectorAll('[data-language]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.language === language)); });
  renderGames();
  renderPickedGame();
}

function showGame(game, isPicker) {
  pickedGame = game;
  pickerMode = isPicker;
  renderPickedGame();
  if (!gameDialog.open) gameDialog.showModal();
}

function pickRandomGame() {
  const pool = games.filter(game => game !== pickedGame);
  showGame(pool[Math.floor(Math.random() * pool.length)], true);
}

function applyTheme() {
  document.documentElement.dataset.theme = themePreference === 'system'
    ? (systemTheme.matches ? 'dark' : 'light')
    : themePreference;
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === themePreference));
  });
}

function renderChangelog() {
  const version = `v${spillArenaRelease.version}`;
  document.getElementById('site-version').textContent = version;
  document.getElementById('changelog-version').textContent = version;
  document.getElementById('release-list').replaceChildren(...spillArenaRelease.changelog.map(entry => {
    const release = document.createElement('li');
    const metadata = document.createElement('div');
    metadata.className = 'release-meta';
    const label = document.createElement('strong');
    label.textContent = `v${entry.release}`;
    const date = document.createElement('time');
    const [day, month, year] = entry.date.split('-');
    date.dateTime = `${year}-${month}-${day}`;
    date.textContent = `${day}.${month}.${year}`;
    metadata.append(label, date);
    const title = document.createElement('h3');
    title.textContent = entry.title;
    const changes = document.createElement('ul');
    changes.append(...entry.changes.map(change => {
      const item = document.createElement('li');
      item.textContent = change;
      return item;
    }));
    release.append(metadata, title, changes);
    return release;
  }));
}

systemTheme.addEventListener('change', () => {
  if (themePreference === 'system') applyTheme();
});

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => { item.setAttribute('aria-pressed', String(item === button)); });
  renderGames();
}));
document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
  themePreference = button.dataset.themeChoice;
  applyTheme();
}));
for (const [trigger, target] of [['settings-open', 'settings-dialog'], ['account-open', 'account-dialog'], ['account-more', 'account-dialog'], ['storage-open', 'storage-dialog'], ['changelog-open', 'changelog-dialog']]) {
  document.getElementById(trigger).addEventListener('click', () => document.getElementById(target).showModal());
}
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
}));
document.getElementById('surprise').addEventListener('click', pickRandomGame);
document.getElementById('pick-again').addEventListener('click', pickRandomGame);
setLanguage(language);
applyTheme();
renderChangelog();
