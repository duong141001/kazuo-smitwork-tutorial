---
name: qa-testcase-gen
description: >
  Sinh test case và phân loại kiểm thử cho tính năng game từ bản phân tích thiết kế
  hoặc Feature Spec. Phân loại theo Functional, Integration, Performance, Edge Cases;
  gán EST (giờ) cho từng hạng mục; xác định Test Scope (In/Out-of-scope). Dùng skill
  này khi người dùng nói "sinh test case", "viết test case cho tính năng X", "phân loại
  hình kiểm thử", "làm Test Plan / Test Scope", "cập nhật EST cho test", hoặc sau khi
  đã phân tích GDD và cần chuyển thành kịch bản kiểm thử cụ thể. Không sinh test case
  cho tính năng chưa rõ logic — yêu cầu phân tích thiết kế trước (xem skill gdd-analyzer).
license: MIT
metadata:
  author: WWS-QA
  domain: game-qa
---

# QA Test Case Generator — Sinh & phân loại test case game

Skill này biến logic tính năng đã hiểu rõ thành bộ test case có phân loại, EST, và
phạm vi kiểm thử, sẵn sàng đưa vào Test Plan.

## Nguyên tắc bắt buộc

1. **Chỉ sinh test case cho logic đã rõ.** Nếu tính năng chưa được phân tích/chưa rõ
   quy tắc, DỪNG và yêu cầu chạy `gdd-analyzer` hoặc hỏi lại. Không đoán quy tắc game.
2. **Mỗi test case phải kiểm chứng được** — có bước, dữ liệu, kết quả kỳ vọng cụ thể.
   Không viết test case mơ hồ kiểu "kiểm tra tính năng hoạt động đúng".
3. **EST là ước tính giờ công thực thi test**, không phải story point. Ghi rõ đơn vị.

## Đầu vào

- Bản phân tích thiết kế từ `gdd-analyzer` (mục Logic module + Rủi ro), HOẶC
- Feature Spec + mô tả logic tính năng do người dùng cung cấp.

## Phân loại hình kiểm thử (bắt buộc gán đúng loại)

| Loại | Kiểm cái gì | Ví dụ trong game |
|---|---|---|
| **Functional** | Tính năng chạy đúng đặc tả | Skill gây đúng sát thương theo công thức |
| **Integration** | Giao tiếp giữa các hệ thống | Nhận quà quest → cập nhật túi đồ + log |
| **Performance** | Tải, độ trễ, FPS, đồng thời | 100 người cùng boss, server không lag |
| **Edge Cases** | Biên, giá trị bất thường, lỗi | HP = 0, túi đầy, mất mạng giữa giao dịch |

## Quy trình (4 bước)

1. **Xác định Test Scope** — liệt kê In-scope / Out-of-scope theo module; ghi lý do loại trừ.
2. **Sinh test case** — với mỗi luồng logic + rủi ro: viết case theo template, gán loại.
3. **Bổ sung Edge Cases** — chủ động sinh biên từ ràng buộc (min/max, null, race condition,
   mất kết nối, thao tác đồng thời).
4. **Gán EST & tổng hợp** — mỗi case/nhóm case gán EST (giờ), tổng hợp theo module.

## Template test case

```markdown
## Test Scope — <Module>
- In-scope: <...>
- Out-of-scope: <...> (lý do)

## Test Cases — <Module>
| ID | Tiêu đề | Loại | Tiền điều kiện | Các bước | Dữ liệu | Kết quả kỳ vọng | EST(h) | Ưu tiên |
|----|---------|------|----------------|----------|---------|-----------------|--------|---------|
| TC-<mod>-001 | ... | Functional | ... | 1.../2... | ... | ... | 0.5 | High |

## Tổng hợp EST theo module
| Module | Số case | Tổng EST(h) |
```

## Đầu ra & nơi lưu

- Lưu vào `docs/` của dự án (vd `docs/test-cases-<module>.md`).
- Bảng "Tổng hợp EST theo module" là dữ liệu cập nhật EST cho Test Plan.

## Khi nào KHÔNG dùng skill này

- Logic tính năng chưa rõ → chạy `gdd-analyzer` trước.
- Chỉ cần tiêu chí nghiệm thu/DoD cấp story → dùng skill `acceptance-criteria`.
