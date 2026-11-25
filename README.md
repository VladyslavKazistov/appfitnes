# FitPlan

Персональный план тренировок на массу. Веб-приложение (PWA) для iPhone, все данные хранятся на устройстве.

- `npm install` — установить зависимости
- `npm run dev` — локальный запуск
- `npm test` — тесты алгоритма плана и прогрессии
- `npm run build` — сборка в `dist/` (готово к GitHub Pages: пути относительные)

Структура: `src/data/exercises.ts` (база упражнений), `src/lib/generator.ts` (составление плана),
`src/lib/progression.ts` (автопрогрессия), `src/screens/*` (экраны).

Картинки упражнений (`public/ex/`) — [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), лицензия Unlicense (общественное достояние).
