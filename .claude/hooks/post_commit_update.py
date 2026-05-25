"""
Claude Code PostToolUse hook — 在 git commit 後自動更新 progress.md 和 feature_list.json。
stdin: JSON { tool_name, tool_input: { command }, tool_response }
"""
import json
import re
import subprocess
import sys
import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent  # opencode-yc/


def get_latest_commit():
    r = subprocess.run(
        ["git", "log", "-1", "--pretty=format:%H\t%s", "--name-only"],
        capture_output=True, text=True, cwd=ROOT,
    )
    if r.returncode != 0 or not r.stdout.strip():
        return None, None, []
    lines = r.stdout.strip().split("\n")
    parts = lines[0].split("\t", 1)
    if len(parts) < 2:
        return None, None, []
    commit_hash, commit_msg = parts
    changed_files = [l for l in lines[2:] if l.strip()]
    return commit_hash[:7], commit_msg, changed_files


def update_progress_md(short_hash: str, commit_msg: str):
    path = ROOT / "progress.md"
    if not path.exists():
        return

    today = datetime.date.today().isoformat()
    new_line = f"- [{short_hash}] {commit_msg}\n"

    content = path.read_text(encoding="utf-8")

    content = re.sub(
        r"^## Last Updated\n.*$",
        f"## Last Updated\n{today} — auto-updated by post-commit hook",
        content,
        count=1,
        flags=re.MULTILINE,
    )

    marker = "## Completed (Recent)\n"
    if marker in content:
        idx = content.index(marker) + len(marker)
        content = content[:idx] + new_line + content[idx:]

    path.write_text(content, encoding="utf-8")


def update_feature_list(short_hash: str, commit_msg: str):
    path = ROOT / "feature_list.json"
    if not path.exists():
        return

    fids = re.findall(r"\bF(\d+)\b", commit_msg, flags=re.IGNORECASE)
    if not fids:
        return

    data = json.loads(path.read_text(encoding="utf-8"))
    changed = False

    for feature in data.get("features", []):
        fid_num = re.sub(r"^F0*", "", feature["id"])
        if fid_num not in fids:
            continue

        existing = feature.get("evidence") or ""
        tag = f"[{short_hash}]"
        if tag not in existing:
            sep = " | " if existing else ""
            feature["evidence"] = existing + sep + f"{tag} {commit_msg[:80]}"
            changed = True

    if changed:
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    if payload.get("tool_name") != "Bash":
        sys.exit(0)

    command = payload.get("tool_input", {}).get("command", "")
    if "git commit" not in command:
        sys.exit(0)

    short_hash, commit_msg, _ = get_latest_commit()
    if not short_hash:
        sys.exit(0)

    update_progress_md(short_hash, commit_msg)
    update_feature_list(short_hash, commit_msg)

    print(f"[hook] progress.md + feature_list.json updated → {short_hash}: {commit_msg[:60]}")


if __name__ == "__main__":
    main()
