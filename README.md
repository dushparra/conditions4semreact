# conditions4semreact

Семинар 20.10: Messenger Mini — учебный мессенджер на React и TypeScript.

Реализованы авторизация, просмотр и редактирование профиля, общий чат, история сообщений и обмен сообщениями через WebSocket. GET-запросы выполняются через Fetch, POST и PUT — через Axios.

## Структура

- [task_condition.md](task_condition.md) — условие задания.
- [messenger/frontend](messenger/frontend) — React-клиент и браузерные тесты.
- [messenger/server](messenger/server) — готовый бэкенд из задания.
- [messenger/README.md](messenger/README.md) — подробная инструкция, тестовые аккаунты и пояснения к коду.
- [messenger/docs](messenger/docs) — снимки экранов приложения.

## Запуск

Первый терминал, из корня репозитория:

```bash
cd messenger/server
npm ci
npm start
```

Второй терминал, из корня репозитория:

```bash
cd messenger/frontend
npm ci
npm run dev
```

Приложение: <http://127.0.0.1:5173>. Swagger: <http://localhost:3001/docs>.

Тестовый вход: `+79990000000`, пароль `123456`.

## Проверка

Из папки `messenger/frontend`:

```bash
npm run build
npx playwright install chromium
npm test
```

В проекте 18 браузерных тестов. Если установлен Google Chrome, их можно запустить командой `PLAYWRIGHT_CHANNEL=chrome npm test`.
