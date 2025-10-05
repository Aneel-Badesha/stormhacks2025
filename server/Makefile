PY   := python3
DB   := data/rewards.db
SEED := data/seed.sql

.DEFAULT_GOAL := run

run: clean init seed serve

clean:
	@rm -f $(DB)

init:
	@$(PY) -c "from server import init_db; init_db()"

seed:
	@sqlite3 $(DB) < $(SEED)

serve:
	@$(PY) server.py