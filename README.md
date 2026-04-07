# Адил & Диана — Опросник совместимости 💜

Личный сайт-опросник без бэкенда. Адил отвечает на 12 вопросов, получает ссылку с ответами в URL-хэше, Диана открывает ссылку, отвечает, и видит сравнение с индексом совместимости.

## Как пользоваться

1. **Адил** открывает сайт → отвечает на 12 вопросов → нажимает "Поделиться" → ссылка готова
2. **Диана** открывает ссылку → отвечает на те же 12 вопросов → видит экран сравнения

## Приватность

Ответы Адила хранятся **только в URL-хэше** (после `#`) — они **никогда не отправляются на сервер**. Хэш-фрагмент не включается в HTTP-запросы.

## Разработка

```bash
npm install
npm run dev
```

## Деплой (бесплатно, 1 минута)

### Netlify Drop (самый быстрый)

1. Собери проект: `npm run build`
2. Перейди на https://app.netlify.com/drop
3. Перетащи папку `dist/` в браузер
4. Готово! Получаешь ссылку вида `https://random-name.netlify.app`

### GitHub Pages

1. Создай репозиторий на GitHub
2. Сделай `git push`
3. Settings → Pages → Source: `gh-pages` branch
4. Установи пакет: `npm install -D gh-pages`
5. В `package.json` добавь в `scripts`: `"deploy": "gh-pages -d dist"`
6. `npm run build && npm run deploy`

### Vercel

```bash
npm install -g vercel
npm run build
vercel dist
```

## Технологии

- React + Vite
- Framer Motion — анимации переходов
- LZ-String — сжатие ответов в URL
- canvas-confetti — конфетти на экране результатов
- Google Fonts: Playfair Display + Lato
