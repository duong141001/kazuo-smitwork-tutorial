# [DRAFT] Quy trình Kiểm thử & Template Test Case — Phòng QA

> Trạng thái: **BẢN THẢO (draft)** — soạn khi chưa có Game Design Document cụ thể.
> Mục đích: chuẩn hóa **template test case**, **các luồng test**, và **quy trình test** dùng chung cho phòng QA. Độc lập nội dung game — áp dụng lại cho mọi tính năng khi có tài liệu.
> Khi có GDD/Feature Spec: điền nội dung game cụ thể vào template này, không phải dựng lại từ đầu.

---

## Phần 1 — Template Test Case (dùng chung)

### 1.1. Cấu trúc 1 test case

| Trường | Bắt buộc | Mô tả |
|--------|:---:|-------|
| **Test Case ID** | ✅ | Mã duy nhất: `TC-<MODULE>-<số>` (vd `TC-LOGIN-001`) |
| **Tính năng / Module** | ✅ | Tên tính năng đang test |
| **Tiêu đề** | ✅ | Mục tiêu kiểm — 1 câu ngắn |
| **Loại test** | ✅ | Functional / Integration / Performance / Edge Cases |
| **Độ ưu tiên** | ✅ | High / Medium / Low |
| **Tiền điều kiện** | ✅ | Trạng thái cần có trước khi chạy (tài khoản, cấp, build...) |
| **Dữ liệu test** | | Input cụ thể (nếu có) |
| **Các bước thực hiện** | ✅ | 1. ... 2. ... 3. ... (đánh số, thao tác rõ) |
| **Kết quả kỳ vọng** | ✅ | Điều phải xảy ra nếu đúng |
| **Kết quả thực tế** | | Điền khi chạy |
| **Trạng thái** | | Pass / Fail / Blocked / Chưa chạy |
| **EST (h)** | | Giờ công thực thi |
| **Môi trường** | | PC / Mobile (model + OS) · số build |
| **Ghi chú / Bug link** | | Link bug, ảnh chụp, clip |

### 1.2. Quy tắc viết test case

- **1 case = 1 mục tiêu kiểm.** Không gộp nhiều mục tiêu.
- **Bước phải tái lập được:** người khác đọc làm lại y hệt.
- **Kết quả kỳ vọng đo được:** tránh mơ hồ ("chạy ổn"); ghi cụ thể cái nhìn thấy.
- **Không đoán khi thiếu spec:** thiếu luật/số → ghi vào cột "Q&A gửi GD/Dev", không tự bịa.
- **Đặt ID theo module** để dễ lọc, dễ regression.

### 1.3. Bảng ID module (quy ước đặt mã — điền khi có tính năng)

| Tiền tố | Nhóm tính năng |
|---------|----------------|
| `TC-CHAR-*` | Nhân vật (tạo, thuộc tính, cấp/EXP...) |
| `TC-SECT-*` | Môn phái |
| `TC-CBT-*` | Chiến đấu / kỹ năng |
| `TC-BAG-*` | Túi đồ / trang bị |
| `TC-QST-*` | Nhiệm vụ |
| `TC-...` | (bổ sung khi có module mới) |

---

## Phần 2 — Các luồng test (Test Flows)

> "Luồng test" = nhóm test case chạy theo một mạch để kiểm một hành trình, thay vì test rời từng điểm.

### 2.1. Bốn loại test và khi nào dùng

| Loại | Kiểm cái gì | Ví dụ tình huống |
|------|-------------|------------------|
| **Functional** | 1 chức năng chạy đúng theo đặc tả | Bấm nút X → ra kết quả Y |
| **Integration** | Nhiều tính năng ghép nối đúng | Hoàn thành A mở khóa B; dữ liệu truyền giữa 2 module |
| **Edge Cases** | Trường hợp biên, input bất thường | Túi đầy, mất mạng giữa chừng, nhập giá trị tối đa/tối thiểu |
| **Performance** | Tốc độ, tải, độ mượt | Nhiều đối tượng cùng lúc, thời gian tải màn |

### 2.2. Ba luồng test chuẩn của phòng

| Luồng | Phạm vi | Khi nào chạy |
|-------|---------|--------------|
| **A. Smoke** | Chỉ case High mỗi module | Ngay khi nhận build (fail → trả build) |
| **B. Functional đầy đủ** | Toàn bộ Functional + Edge Cases | Sau khi smoke pass |
| **C. Regression** | Checklist cố định + case liên quan bug | Sau mỗi bản vá / build mới |

**A. Luồng Smoke (kiểm nhanh sau mỗi build)**
- Mục tiêu: build có "sống" không, chạy được các chức năng lõi không.
- Phạm vi: chỉ case ưu tiên **High** của mỗi module.
- Khi nào: ngay khi nhận build mới, trước khi test sâu.
- Kết quả: nếu smoke fail → trả build, không test tiếp.

**B. Luồng Functional đầy đủ (test chính)**
- Mục tiêu: kiểm hết test case của tính năng theo đặc tả.
- Phạm vi: toàn bộ case Functional + Edge Cases của module.
- Khi nào: sau khi smoke pass.

**C. Luồng Regression (kiểm hồi quy)**
- Mục tiêu: build mới/bản vá không làm hỏng cái đang chạy đúng.
- Phạm vi: checklist regression cố định mỗi module + các case liên quan bug vừa fix.
- Khi nào: sau mỗi lần Dev fix hoặc có build mới.

### 2.3. Sơ đồ luồng tổng

```
Nhận build → Smoke test → (fail: trả build)
                        → (pass) → Functional đầy đủ → Log bug
                                                     → Dev fix → Re-test + Regression
                                                                → Đạt Exit Criteria → Đóng vòng test
```

---

## Phần 3 — Quy trình test của phòng QA

### 3.1. Vòng đời 1 lần kiểm thử (6 bước)

| Bước | Việc | Đầu ra |
|:---:|------|--------|
| 1 | **Đọc đặc tả** — bóc input / luật xử lý / output kỳ vọng | Danh sách điểm cần kiểm + Q&A gửi GD |
| 2 | **Viết test case** theo template Phần 1 | Bộ test case |
| 3 | **Chuẩn bị môi trường** — build đúng phiên bản, tài khoản đúng tiền điều kiện, thiết bị | Môi trường sẵn sàng |
| 4 | **Thực thi** — chạy đúng bước, chụp ảnh/clip mốc quan trọng | Kết quả thực tế mỗi case |
| 5 | **Ghi nhận** — Pass/Fail/Blocked; Fail → log bug đầy đủ | Báo cáo kết quả + bug log |
| 6 | **Regression** — sau bản vá, chạy lại theo checklist | Xác nhận không hồi quy |

### 3.2. Phân loại mức độ lỗi (Severity)

| Mức | Định nghĩa | Xử lý |
|-----|-----------|-------|
| **Blocker** | Chặn luồng chính, không chơi tiếp được | Phải fix trước release |
| **Critical** | Sai logic nghiêm trọng | Fix trong phase |
| **Major** | Ảnh hưởng trải nghiệm rõ rệt | Cân nhắc theo timeline |
| **Minor** | Lỗi nhỏ, cosmetic | Backlog |

### 3.3. Nội dung 1 bug report chuẩn

- **Tiêu đề:** ngắn, gọn hiện tượng.
- **Môi trường:** build số, thiết bị (PC/mobile + OS).
- **Các bước tái hiện:** đánh số, làm lại được.
- **Kết quả thực tế** vs **Kết quả kỳ vọng.**
- **Mức độ (severity)** + ảnh/clip đính kèm.
- **Tần suất:** luôn xảy ra / thỉnh thoảng.

### 3.4. Tiêu chí Vào / Ra (Entry / Exit)

**Entry (được bắt đầu test khi):**
- Có build chạy được (đã pass smoke).
- Tính năng đã dev xong theo thông báo.
- Đã có test case cho tính năng.

**Exit (được coi là xong vòng test khi):**
- 100% case ưu tiên **High** đã chạy và Pass.
- Không còn bug **Blocker / Critical** mở.
- Bug còn lại đã log và được PM/Lead chấp nhận hoãn.

### 3.5. Trạng thái test case (vòng đời)

```
Chưa chạy → Đang chạy → Pass
                      → Fail → (Dev fix) → Re-test → Pass
                      → Blocked (thiếu điều kiện / chặn bởi bug khác)
```

---

## Ghi chú & việc còn treo

- Đây là **bản thảo quy trình + template**, chưa gắn nội dung game — chờ **GDD/Feature Spec** để điền test case cụ thể.
- Định mức EST theo loại test: dùng bảng ở kế hoạch manual Phase 1 (nhóm A+B) — có thể chỉnh sau vòng test đầu.
- Cần **PM / QA Lead duyệt** template + quy trình này trước khi áp dụng toàn phòng.

### Q&A cần làm rõ (khi có tài liệu / họp phòng)
1. Bộ công cụ quản lý test case + bug dùng gì (KazuoTask, Excel, TestRail...)? → quyết định cách lưu template.
2. Định mức EST/loại test của phòng có chuẩn riêng chưa, hay dùng bảng đề xuất?
3. Checklist regression cố định cho mỗi module do ai chốt?
