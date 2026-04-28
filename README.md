# SpillArena

SpillArena is a lightweight game hub that presents game cards with live links, beta gating, language switching (Norwegian/English), and theme switching (dark/light).

## Features

- Modern card-based game overview
- Beta flow with confirmation modal before entering beta games
- Dark and light mode with persisted user preference
- Language selector with persisted user preference
- Automatic default language:
  - Norwegian system language -> Norwegian (no)
  - Any other system language -> English (en)
- Footer links for repository and portfolio
- App version displayed from package metadata

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- i18next + react-i18next
- lucide-react icons
- ESLint 9

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

## Available Scripts

- npm run dev: Run Vite in development mode
- npm run build: Type-check and build production bundle
- npm run lint: Run ESLint
- npm run preview: Preview production build locally

## Project Structure

```text
src/
  App.tsx
  i18n.ts
  index.css
  assets/
    games/
    icons/
  components/
    HeaderSection.tsx
    GamesSection.tsx
    GameCard.tsx
    BetaWarningModal.tsx
    FooterSection.tsx
  data/
    games.ts
```

## Game Configuration

Games are defined in src/data/games.ts.

Each game supports:

- id: number
- title: string
- descriptionKey: i18n key for description
- icon: lucide icon key
- showcase: optional image
- color: badge color class
- githubUrl: repository URL
- liveUrl: game URL
- disabled: optional, marks a non-clickable game
- beta: optional, shows beta badge and requires modal confirmation

## Localization

Translations are configured in src/i18n.ts.

- Supported languages: no, en
- User language is stored in localStorage key language
- On first visit, language falls back to system language rules described above

## Theme Behavior

- Theme is toggled in the header
- Current theme is stored in localStorage key theme
- Dark mode class is applied to html and body

## Notes

- Footer version label is pulled from package.json version
- Portfolio icon automatically switches between light/dark variants based on current theme

## Contributing

1. Create a branch from development
2. Make your changes
3. Run lint and build locally
4. Open a pull request
