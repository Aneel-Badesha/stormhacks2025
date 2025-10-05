PY   := python3
DB   := rewards.db
SEED := seed.sql

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