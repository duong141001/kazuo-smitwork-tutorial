---
name: gdd-analyzer
description: >
  Phân tích tài liệu thiết kế game (GDD, System/Technical Design Doc, Feature Spec)
  để bóc tách luồng logic hệ thống, quy tắc từng tính năng, Core Game Loop, và sinh
  danh sách Q&A cần làm rõ với Game Designer/Dev. Dùng skill này khi người dùng đưa
  tài liệu thiết kế game và muốn "phân tích GDD", "làm rõ logic tính năng", "đọc tài
  liệu hệ thống game", "chuẩn bị test scenario từ GDD", hoặc trước khi thiết kế kịch
  bản kiểm thử cho một game. Không bịa nội dung khi thiếu tài liệu — hỏi lại nguồn.
license: MIT
metadata:
  author: WWS-QA
  domain: game-qa
---

# GDD Analyzer — Phân tích tài liệu thiết kế game

Skill này biến tài liệu thiết kế game thô (GDD/TDD/Feature Spec) thành bản phân tích
có cấu trúc phục vụ QA: hiểu hệ thống, phát hiện lỗ hổng logic sớm, và chốt câu hỏi
với đội thiết kế trước khi viết test case.

## Nguyên tắc bắt buộc

1. **Không có tài liệu → không phân tích.** Nếu người dùng chưa cung cấp file, HỎI LẠI
   danh sách tài liệu cần (mục "Tài nguyên đầu vào"). Tuyệt đối không bịa Core Loop,
   con số cân bằng, hay quy tắc tính năng.
2. **Chỉ khẳng định điều đọc được trong tài liệu.** Mọi suy luận phải ghi rõ là "giả
   định" và đẩy vào danh sách Q&A.
3. **Trích nguồn.** Mỗi kết luận quan trọng ghi kèm vị trí trong tài liệu (mục/trang).

## Tài nguyên đầu vào cần có

**Bắt buộc:**
- GDD — Core Game Loop, Player Progression, danh sách tính năng.
- Feature Spec theo module của phase đang xét (chốt scope).

**Nên có:**
- System/Technical Design Doc (kiến trúc, luồng server–client, state machine).
- Bảng cân bằng số liệu / config (công thức chỉ số, drop rate) — cho Edge Cases & Performance.
- Sơ đồ luồng (flowchart / sequence). Ảnh sơ đồ đọc được qua OCR.

**Tham chiếu:**
- Bản game gốc / changelog nếu là port từ game khác.

## Quy trình phân tích (4 bước)

1. **Đọc & lập bản đồ hệ thống** — quét toàn bộ tài liệu, liệt kê module tính năng,
   xác định Core Game Loop và mối liên hệ giữa các hệ thống.
2. **Bóc logic từng tính năng** — với mỗi module: input → xử lý → output, điều kiện
   kích hoạt, ràng buộc, trạng thái (state), và điểm giao với module khác (integration point).
3. **Soi lỗ hổng** — tìm mâu thuẫn, thiếu định nghĩa, ràng buộc chưa rõ, edge case tiềm ẩn.
   Mỗi lỗ hổng → 1 dòng Q&A.
4. **Tổng hợp output** theo template dưới.

## Template output

```markdown
# Phân tích thiết kế — <Tên game> (<Phase>)

## 1. Tổng quan hệ thống
- Core Game Loop: <mô tả ngắn, kèm nguồn>
- Danh sách module Phase: <bảng>

## 2. Logic từng module
### <Tên module>
- Mục đích:
- Luồng chính (input → xử lý → output):
- Điều kiện / ràng buộc:
- Trạng thái (state):
- Điểm tích hợp với module khác:
- Nguồn: <mục/trang trong tài liệu>

## 3. Rủi ro & lỗ hổng logic phát hiện
| # | Module | Vấn đề | Mức độ | Ghi chú |

## 4. Danh sách Q&A gửi GD/Dev
| # | Câu hỏi | Đối tượng (GD/Dev) | Vì sao cần |

## 5. Giả định đang dùng (chờ xác nhận)
- <liệt kê>
```

## Đầu ra & nơi lưu

- Mặc định lưu bản phân tích vào `docs/` của dự án (vd `docs/gdd-analysis-<slug>.md`).
- Nếu skill sinh test case chạy tiếp, mục 2 (Logic module) + mục 3 (Rủi ro) là đầu vào
  trực tiếp cho `qa-testcase-gen`.

## Khi nào KHÔNG dùng skill này

- Chưa có bất kỳ tài liệu thiết kế nào → chỉ nên dựng template rỗng và hỏi lại nguồn.
- Yêu cầu là viết test case chi tiết → chuyển sang skill `qa-testcase-gen`.
