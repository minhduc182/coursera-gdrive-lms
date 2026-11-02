# Coursera Google Drive LMS

Một nền tảng học tập giao diện chuẩn **Coursera Design System (CDS)** kết nối trực tiếp với thư mục khóa học trên Google Drive (`coursera-dl` format).

## Tính năng chính
- **Giao diện chuẩn Coursera (`Course Home` & `Lecture View`):**
  - Quản lý lộ trình đa khóa học (Specialization), theo dõi tiến độ chi tiết từng Module và từng bài học.
  - Tự động xen kẽ các bài giảng Video (`.mp4`) và Tài liệu đọc (`_instructions.html`, `.pdf`).
- **Stream trực tiếp từ Google Drive (`HTTP 206 Partial Content`):**
  - Hỗ trợ tua video tức thì, tự động tải trước bài kế tiếp ở chế độ nền hoặc chuyển sang Google Drive Embed Player.
- **Interactive Transcript & Phụ đề Song ngữ (`.en.srt` / `.vi.srt`):**
  - Hiển thị lời thoại dạng đoạn văn (Paragraph) chuẩn Coursera, tô sáng câu đang đọc theo thời gian thực và click vào bất kỳ câu nào để tua video.
- **Sổ tay ghi chú (Notes) & Tìm kiếm toàn văn (`Ctrl + K`):**
  - Lưu ghi chú gắn kèm mốc thời gian video; tìm kiếm từ khóa xuyên suốt tiêu đề, nội dung bài đọc HTML và toàn bộ lời thoại phụ đề `.srt`.

## Cài đặt & Chạy ứng dụng

1. Sao chép file cấu hình mẫu sang file cấu hình cá nhân (file này đã được `.gitignore` để bảo mật đường dẫn Google Drive của bạn):
   ```bash
   cp config.example.json config.local.json
   ```
2. Cập nhật `rootFolderId` và `rootFolderUrl` trong `config.local.json` trỏ tới thư mục Google Drive của bạn.
3. Đồng bộ danh mục khóa học từ Google Drive:
   ```bash
   npm run sync
   ```
4. Khởi chạy server (mặc định tại `http://localhost:3456`):
   ```bash
   npm start
   ```
   *(Hoặc chạy trực tiếp file `start.bat` trên Windows).*
