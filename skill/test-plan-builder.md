---
name: test-plan-builder
description: >
  Xây dựng và đóng bản thảo Test Plan / Test Strategy cho một phase dự án game.
  Tổng hợp Scope/Out-of-scope, phân bổ tài nguyên QA, lịch trình theo Milestone,
  đánh giá rủi ro + kế hoạch dự phòng, và Deliverables, hướng tới sign-off từ PM/Tech Lead.
  Dùng skill này khi người dùng nói "làm Test Plan", "chốt Test Strategy", "kế hoạch
  kiểm thử phase X", "chuẩn bị sign-off test plan", hoặc sau khi đã có phân tích thiết
  kế và bộ test case cần gom thành kế hoạch tổng. Cần EST từ test case và milestone dự
  án làm đầu vào — thiếu thì hỏi lại, không bịa timeline.
license: MIT
metadata:
  author: WWS-QA
  domain: game-qa
---

# Test Plan Builder — Dựng kế hoạch & chiến lược kiểm thử

Skill này gom kết quả phân tích thiết kế và test case thành một Test Plan hoàn chỉnh,
sẵn sàng trình sign-off.

## Nguyên tắc bắt buộc

1. **Không bịa timeline / tài nguyên.** Cần milestone dự án + số người QA thực tế +
   tổng EST test case. Thiếu dữ liệu nào → hỏi lại, ghi vào mục "Giả định".
2. **Scope phải khớp Feature Spec của phase.** Không đưa tính năng ngoài phase vào In-scope.
3. **Mỗi rủi ro phải có phương án dự phòng** cụ thể, không chỉ liệt kê.

## Đầu vào

- Bản phân tích thiết kế (từ `gdd-analyzer`) — scope tính năng, rủi ro logic.
- Bảng tổng hợp EST theo module (từ `qa-testcase-gen`).
- Milestone dự án + nhân sự QA khả dụng.

## Cấu trúc Test Plan (bản thảo sign-off)

```markdown
# Test Plan — <Tên game> Phase <N>

## 1. Mục tiêu & phạm vi
- Mục tiêu kiểm thử phase:
- In-scope (module): <bảng>
- Out-of-scope: <bảng + lý do>

## 2. Chiến lược kiểm thử
- Các loại test áp dụng: Functional / Integration / Performance / Edge Cases
- Tiêu chí vào (Entry) / ra (Exit) cho mỗi vòng test
- Tiêu chí pass/fail & mức chấp nhận lỗi (severity)

## 3. Phân bổ tài nguyên & lịch trình
- Nhân sự QA & phân công module:
- Lịch trình bám Milestone: <bảng: mốc | ngày | deliverable>
- Tổng EST & năng lực (capacity) → cảnh báo nếu vượt tải

## 4. Đánh giá rủi ro & dự phòng
| # | Rủi ro | Xác suất | Ảnh hưởng | Phương án dự phòng |

## 5. Deliverables
- <danh sách sản phẩm bàn giao: test cases, báo cáo, bug log...>

## 6. Sign-off
- [ ] PM duyệt
- [ ] Technical Lead duyệt

## 7. Giả định đang chờ xác nhận
- <liệt kê>
```

## Kiểm tra năng lực (capacity check)

Luôn so sánh **Tổng EST** với **năng lực QA khả dụng** (số người × giờ công trong khung
thời gian phase). Nếu EST > capacity → cảnh báo rõ và đề xuất: cắt scope, thêm người,
hoặc giãn timeline. KHÔNG âm thầm giả định làm kịp.

## Đầu ra & nơi lưu

- Lưu vào `docs/` (vd `docs/test-plan-phase-1.md`).

## Khi nào KHÔNG dùng skill này

- Chưa có test case/EST → chạy `qa-testcase-gen` trước.
- Chỉ cần phân tích tài liệu → dùng `gdd-analyzer`.
