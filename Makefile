up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f backend

migrate:
	docker compose exec backend alembic upgrade head

shell:
	docker compose exec backend bash
