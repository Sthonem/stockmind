#!/usr/bin/env python3
"""
Migration helper — run with:
  python scripts/migrate.py upgrade    # apply all pending migrations
  python scripts/migrate.py downgrade  # roll back one migration
  python scripts/migrate.py current    # show current migration
  python scripts/migrate.py history    # show migration history
  python scripts/migrate.py generate "description"  # create new migration
"""

import os
import subprocess
import sys

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def run(cmd: list):
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode


commands = {
    "upgrade": lambda: run(["alembic", "upgrade", "head"]),
    "downgrade": lambda: run(["alembic", "downgrade", "-1"]),
    "current": lambda: run(["alembic", "current"]),
    "history": lambda: run(["alembic", "history", "--verbose"]),
    "generate": lambda: run(
        ["alembic", "revision", "--autogenerate",
         "-m", sys.argv[2] if len(sys.argv) > 2 else "update"]
    ),
}

if len(sys.argv) < 2 or sys.argv[1] not in commands:
    print("Usage: python scripts/migrate.py [upgrade|downgrade|current|history|generate]")
    sys.exit(1)

sys.exit(commands[sys.argv[1]]())
