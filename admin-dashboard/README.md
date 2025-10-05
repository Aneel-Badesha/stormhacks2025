# Company Admin Dashboard

## Quick Start

```bash
make run
```

This will:
1. Delete old database
2. Create schema
3. Insert seed data
4. Start server on http://127.0.0.1:5000

## Login

Open http://127.0.0.1:5000

**Test credentials:**
- Email: `coffee@login.local`
- Password: `password`

## Troubleshooting

If login fails, run:
```bash
python3 test_login.py
```
This will verify the database is set up correctly.
