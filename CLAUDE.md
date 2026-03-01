## Edit Tool Fallback

The Edit tool fails on files combining tab indentation with backtick template literals (`.js`, `.ts`, `.latte` files). When Edit fails on these files: Do not retry Edit — fall back to `Bash` with `sed`
