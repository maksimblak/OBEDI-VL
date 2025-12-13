from __future__ import annotations

import re
from pathlib import Path

_ENV_KEY_RE = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')


def upsert_env_var(file_path: Path, key: str, value: str) -> None:
    normalized_key = str(key or '').strip()
    if not normalized_key or not _ENV_KEY_RE.match(normalized_key):
        raise ValueError('Env var key is required')

    normalized_value = str(value if value is not None else '')
    if '\n' in normalized_value or '\r' in normalized_value:
        raise ValueError('Invalid env value: newlines are not supported')

    try:
        content = file_path.read_text(encoding='utf-8')
    except FileNotFoundError:
        content = ''

    lines = content.splitlines() if content else []
    replaced = False
    updated_lines: list[str] = []

    for line in lines:
        trimmed = line.lstrip()
        if trimmed.startswith('#'):
            updated_lines.append(line)
            continue

        match = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=', trimmed)
        if not match or match.group(1) != normalized_key:
            updated_lines.append(line)
            continue

        leading = line[: len(line) - len(trimmed)]
        updated_lines.append(f'{leading}{normalized_key}={normalized_value}')
        replaced = True

    if not replaced:
        updated_lines.append(f'{normalized_key}={normalized_value}')

    normalized_content = '\n'.join(updated_lines).rstrip('\n') + '\n'
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(normalized_content, encoding='utf-8')

