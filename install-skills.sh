#!/usr/bin/env bash
# Cài skill Logidata cho Codex IDE extension (VS Code / JetBrains) trên macOS/Linux.
#
# VÌ SAO CÓ FILE NÀY: Codex IDE extension KHÔNG nạp plugin — chỉ ChatGPT
# web/desktop/mobile và Codex CLI mới nạp. Nhưng nó CÓ đọc skill ở phạm vi USER
# (`~/.agents/skills/`). Script này trỏ 11 skill của plugin vào đó, nên khách VS
# Code có đủ skill mà không cần plugin.
#
# ĐỪNG cài cùng lúc với plugin (`codex plugin add logidata@logidata`) — mỗi skill
# sẽ hiện HAI lần. Chọn một: CLI/desktop dùng plugin, VS Code dùng script này.
#
#   Cài:  ./install-skills.sh
#   Gỡ:   ./install-skills.sh --uninstall
#
# Skill hiện ra với tên `logidata:<tên>` — tiền tố thư mục `logidata-` chính là
# namespace, giống hệt khi cài bằng plugin.
#
# Skill mới chỉ dạy trợ lý cách hỏi. Muốn có DỮ LIỆU thì cần thêm MCP server:
#   codex mcp add logidata --url https://mcp.logidata.vn/mcp \
#        --bearer-token-env-var LOGIDATA_API_KEY

set -euo pipefail

repo=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source_dir="$repo/plugins/logidata/skills"
dest="$HOME/.agents/skills"

[ -d "$source_dir" ] || { echo "Khong thay $source_dir — chay tu goc repo agent-plugins." >&2; exit 1; }

if [ "${1:-}" = "--uninstall" ]; then
  n=0
  for link in "$dest"/logidata-*; do
    # -L: chỉ xoá symlink, không đụng thư mục thật nếu ai đó lỡ chép đè.
    [ -L "$link" ] && rm "$link" && n=$((n + 1))
  done
  echo "Da go $n skill khoi $dest"
  exit 0
fi

mkdir -p "$dest"

n=0
for dir in "$source_dir"/*/; do
  name=$(basename "$dir")
  ln -sfn "${dir%/}" "$dest/logidata-$name"
  n=$((n + 1))
done

echo "Da cai $n skill vao $dest"
echo "Mo lai VS Code, go \$ trong khung chat de thay skill logidata:*"
