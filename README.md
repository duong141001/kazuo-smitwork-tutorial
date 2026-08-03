# Kazuo (SMIT Work) — Tài liệu hướng dẫn sử dụng cho team

Tài liệu hướng dẫn sử dụng công cụ quản lý dự án **Kazuo / SMIT Work**, kèm ảnh chụp từng màn hình và hướng dẫn thao tác + quy trình Scrum cho team.

## Xem tài liệu

Mở file [`index.html`](index.html) bằng trình duyệt — trang tự chứa, không cần cài gì thêm.

Nội dung gồm:
- Cách sử dụng nhanh
- Hướng dẫn làm việc theo Scrum
- 17 màn hình, mỗi màn kèm mô tả + các bước thao tác cụ thể

## Cấu trúc

| File | Vai trò |
|------|---------|
| `index.html` | Trang tài liệu tự chứa (mở bằng trình duyệt) |
| `shots/` | Ảnh chụp các màn hình |
| `capture-screens.mjs` | Script Playwright tự đăng nhập và chụp màn hình |
| `build-gallery.mjs` | Script dựng `index.html` từ ảnh + nội dung hướng dẫn |
| `screens.json` | Metadata các màn đã chụp |

## Chạy lại (cập nhật ảnh mới)

Cần Node.js 20+.

```bash
npm install
npx playwright install chromium

# Tạo file .env từ mẫu, điền tài khoản đăng nhập Kazuo
cp .env.example .env

node capture-screens.mjs   # đăng nhập + chụp toàn bộ màn
node build-gallery.mjs     # dựng lại index.html
```

> **Lưu ý bảo mật:** file `.env` chứa tài khoản đăng nhập, đã được `.gitignore` bỏ qua — không commit lên repo.
