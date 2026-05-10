# Survey Service — веб-сервис для создания и управления опросами

Полноценный учебный проект с фронтендом и бэкендом в Docker.

## Стек

- Frontend: React, TypeScript, Vite, React Router, Nginx
- Backend: Python, FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL
- Cache/infra: Redis
- Containerization: Docker, Docker Compose
- Auth: JWT Bearer Token

## Быстрый запуск

```bash
cp .env.example .env
docker compose up --build
```

После запуска:

- Frontend: http://localhost
- Swagger/OpenAPI: http://localhost/docs
- Backend API напрямую: http://localhost:8000/api/v1
- Backend API через frontend-nginx: http://localhost/api/v1

## Основной сценарий

1. Откройте http://localhost.
2. Зарегистрируйте пользователя.
3. Создайте опрос.
4. Добавьте вопросы: текст, один вариант, несколько вариантов или оценка 1–5.
5. Опубликуйте опрос.
6. Откройте публичную форму из карточки опроса или скопируйте ссылку.
7. Отправьте ответы как респондент.

## Frontend-структура

```text
frontend/
  src/
    api/                 # fetch-клиент и API-функции
    components/          # общие UI-компоненты
    features/auth/       # контекст авторизации
    features/surveys/    # форма конструктора опросов
    pages/               # страницы приложения
    types/               # TypeScript-типы API
  nginx/default.conf     # отдача SPA и reverse proxy на backend
  Dockerfile             # production-сборка React + Nginx
```

## Backend API, который использует фронтенд

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me

GET    /api/v1/surveys
POST   /api/v1/surveys
GET    /api/v1/surveys/{survey_id}
PATCH  /api/v1/surveys/{survey_id}
POST   /api/v1/surveys/{survey_id}/publish
POST   /api/v1/surveys/{survey_id}/archive
DELETE /api/v1/surveys/{survey_id}

GET  /api/v1/public/surveys/{survey_id}
POST /api/v1/public/surveys/{survey_id}/responses
```

## Локальная разработка frontend без Docker

Backend должен быть запущен на `http://localhost:8000`.

```bash
cd frontend
npm install
npm run dev
```

Vite dev-server будет доступен по адресу http://localhost:5173 и проксирует `/api` на backend.

## Примечания

- Frontend хранит JWT в `localStorage` и отправляет его в заголовке `Authorization: Bearer ...`.
- Публичное прохождение опроса доступно без авторизации, но если пользователь уже авторизован, backend сохранит его как respondent.
- В текущей версии backend есть сохранение ответов, но нет отдельного административного API для просмотра статистики. Его можно добавить следующим этапом.


## Примечание по сборке Docker

Backend Dockerfile не использует `apt-get`: зависимости `gcc` и `libpq-dev` не нужны, потому что проект работает через `asyncpg`, а не через `psycopg2`. Это уменьшает риск ошибки `Unable to connect to deb.debian.org` при сборке образа.

## Примечание по сборке frontend

В этой версии frontend Dockerfile использует уже собранную папку `frontend/dist`, поэтому во время `docker compose up --build` не выполняется `npm install` внутри Docker. Это сделано, чтобы проект запускался даже при нестабильном доступе Docker к npm/debian-репозиториям.

Если нужно собирать frontend из исходников прямо в Docker, замени в `docker-compose.yml` у сервиса `frontend` Dockerfile на `Dockerfile.build`:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.build
```
