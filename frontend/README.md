# Survey Frontend

React + TypeScript интерфейс для backend-сервиса опросов.

## Запуск отдельно для разработки

```bash
npm install
npm run dev
```

По умолчанию `VITE_API_BASE_URL=/api/v1`, а Vite проксирует `/api` на `http://localhost:8000`.

## Запуск в Docker

Из корня полного проекта:

```bash
docker compose up --build frontend
```

Frontend обслуживается Nginx и доступен на http://localhost.
