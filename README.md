# Điều hành xóm · Nhóm 8

Game quẹt thẻ mô phỏng vai trò điều tiết của Nhà nước tại một xóm lúa ven sông Đồng bằng sông Cửu Long (**Chương 5, tiết 21–22**: *Kinh tế thị trường định hướng xã hội chủ nghĩa ở Việt Nam*).

## Cách chơi
- **Thời lượng:** 10 thẻ tình huống (~3–4 phút/ván).
- **Thao tác:** Quẹt thẻ sang **Trái / Phải** (kéo ngang `>= 60 px`), bấm trực tiếp hai nút lựa chọn, hoặc dùng phím `←` / `→` (`A` / `D`).
- **Bốn chỉ số mô phỏng (`0–100`):** Tăng trưởng, Công bằng, Ngân sách, Đồng thuận (khởi điểm `50/100`, không gộp thành một điểm thắng chung).
- **Tổng kết & Ôn nhanh:** Mở đủ **5 ô đặc trưng** gắn với quyết định riêng của từng ván, kèm mục đối chiếu chốt bài 1 phút ở **Thẻ 07**.

## Đường dẫn nhanh khi thuyết trình
- **Chơi từ đầu:** `./`
- **Chiếu nhanh Thẻ 07 (Chốt bài 1 phút):** `./?card=7`
- **Đối chiếu mốc toàn Trái (`82 / 53 / 30 / 50`):** `./?preset=all-left`
- **Đối chiếu mốc toàn Phải (`57 / 60 / 43 / 68`):** `./?preset=all-right`

## Kiểm thử kỹ thuật
```bash
node verify_game.mjs
```
Duyệt đủ $2^{10} = 1.024$ chuỗi lựa chọn Trái/Phải, kiểm tra điểm nằm trong `0–100`, mở đủ 5 ô đặc trưng và đối chiếu hai mốc chuẩn.
