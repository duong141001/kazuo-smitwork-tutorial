// Build a self-contained gallery.html from screens.json + a usage guide.
// Run this AFTER capture-screens.mjs has produced screens.json and shots/*.png.
import { readFile, writeFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('screens.json', 'utf8'));

// Short usage notes keyed by label/path fragment. Falls back to a generic note.
const GUIDE = [
  { match: 'chi tiết story', text: 'Chi tiết Story: chỉnh Trạng thái, Ưu tiên, Ngày bắt đầu, Estimate, người Thực hiện, Nhãn; viết mô tả; thêm/đánh dấu Subtask. Đây là màn làm việc chính hằng ngày.' },
  { match: 'story detail', text: 'Chi tiết Story: chỉnh trạng thái, người thực hiện, estimate; thêm subtask và mô tả.' },
  { match: 'summary', text: 'Summary: tổng quan dự án — tiến độ sprint, số story theo trạng thái, hoạt động gần đây.' },
  { match: 'backlog', text: 'Backlog: kho toàn bộ story chưa/đang làm, gom theo Epic. Nơi tạo story mới và kéo story vào sprint.' },
  { match: 'board', text: 'Board (Kanban): story của sprint đang chạy, xếp theo cột trạng thái. Kéo thả thẻ để đổi trạng thái.' },
  { match: 'list', text: 'List: xem story dạng bảng, tiện lọc và sắp xếp nhanh theo cột.' },
  { match: 'archived', text: 'Archived: các story đã lưu trữ (ẩn khỏi backlog nhưng vẫn tra cứu được).' },
  { match: 'sprint history', text: 'Sprint History: lịch sử các sprint đã chạy để nhìn lại tiến độ và velocity.' },
  { match: 'roadmap', text: 'Roadmap: lộ trình tính năng theo thời gian, nhìn tổng thể kế hoạch dài hạn của dự án.' },
  { match: 'tạo issue', text: 'Hộp thoại Tạo Issue: chọn loại (Cross Story / Story / Subtask / Epic), điền phòng ban, trạng thái, ưu tiên, ngày, estimate, người thực hiện rồi bấm Tạo.' },
  { match: 'hoàn thành sprint', text: 'Hộp thoại Hoàn thành Sprint: khi đóng sprint, các story chưa Done được chọn để "Chuyển về Backlog" hoặc "Chuyển sang Sprint khác" — không lo mất việc dang dở.' },
  { match: 'my work', text: 'My Work (Công việc của tôi): xem việc của chính bạn (Hôm nay / Quá hạn / Tuần này / Đang làm) và tải công việc của từng đồng đội.' },
  { match: 'epic', text: 'Epic: nhóm nhiều story lớn theo tính năng, để tổ chức backlog rõ ràng.' },
  { match: 'projects', text: 'Danh sách dự án: chọn dự án để vào backlog, board, sprint bên trong.' },
  { match: 'báo cáo', text: 'Báo cáo công việc: viết daily report (hôm qua / hôm nay / vướng mắc); xem ai nộp trễ/chưa nộp.' },
  { match: 'thành viên', text: 'Thành viên: danh sách người trong workspace và tải công việc từng người.' },
  { match: 'phòng ban', text: 'Phòng ban: nhóm thành viên theo bộ phận; story và sprint được lọc theo phòng ban.' },
  { match: 'hồ sơ', text: 'Hồ sơ cá nhân: đổi thông tin tài khoản, mật khẩu, tùy chọn cá nhân.' },
  { match: 'mcp', text: 'Mã kết nối MCP: token để kết nối công cụ AI (như Claude) vào Kazuo qua giao thức MCP.' },
];
const guideFor = (s) => {
  const key = (s.path + ' ' + s.label).toLowerCase();
  return GUIDE.find((g) => key.includes(g.match))?.text
    || 'Màn chức năng của Kazuo — mở từ thanh điều hướng bên trái.';
};

// Per-screen action steps: what you can DO on each specific screen.
const ACTIONS = [
  { match: 'chi tiết story', steps: [
    'Bấm từng ô (Trạng thái, Ưu tiên, Ngày bắt đầu, Estimate, Thực hiện) để đổi giá trị — lưu tự động.',
    'Viết mô tả + tiêu chí hoàn thành ở ô soạn thảo (có thể chuyển Markdown).',
    'Bấm "+ Thêm subtask" để chia việc nhỏ; tick ô để đánh dấu hoàn thành.',
    'Bấm "Đóng" khi xong.' ] },
  { match: 'tạo issue', steps: [
    'Chọn loại: Cross Story / Story / Subtask / Epic.',
    'Chọn Phòng ban, đặt tên việc.',
    'Chọn Trạng thái, Ưu tiên, Ngày bắt đầu, Estimate, Người thực hiện.',
    'Gắn Story vào Epic bằng ô "Epic" trong hộp thoại (chọn epic có sẵn).',
    'Viết mô tả rồi bấm "Tạo" (hoặc "Hủy" để bỏ).' ] },
  { match: 'hoàn thành sprint', steps: [
    'Ở tab Backlog, bấm "Hoàn thành" trên thẻ sprint đang chạy.',
    'Hộp thoại báo số issue chưa Done và cho 2 lựa chọn:',
    '• "Chuyển về Backlog" — story chưa xong quay về backlog để lên kế hoạch lại.',
    '• "Chuyển sang Sprint khác" — story chưa xong dồn sang sprint đã tạo.',
    'Chọn 1 phương án rồi bấm "Hoàn thành Sprint".' ] },
  { match: 'backlog', steps: [
    'Bấm "Tạo Issue" (góc phải) → chọn Story/Epic... để tạo việc mới.',
    'Bấm "Create epic" (cột trái) để tạo nhóm tính năng lớn.',
    'Bấm "Tạo Sprint", điền tên + ngày + mục tiêu; kéo story vào sprint.',
    'Bấm "Bắt đầu" ở thẻ sprint để chạy; bấm tên story để mở chi tiết.' ] },
  { match: 'board', steps: [
    'Kéo thả thẻ story giữa các cột: Cần làm → Đang làm → Hoàn thành.',
    'Bấm vào thẻ để mở màn Chi tiết Story.',
    'Lưu ý: Board chỉ hiện khi có sprint đang chạy.' ] },
  { match: 'list', steps: [
    'Xem toàn bộ story dạng bảng.',
    'Lọc / sắp xếp theo cột (trạng thái, người, ngày...).',
    'Bấm một dòng để mở chi tiết story.' ] },
  { match: 'epic', steps: [
    'Bấm "Create epic" để tạo epic mới.',
    'Bấm vào một epic để xem các story bên trong.',
    'Gắn Story vào Epic: mở Story → chọn Epic ở ô "Epic"; hoặc khi tạo Story mới thì chọn Epic ngay trong hộp thoại.',
    'Ở Backlog, cột trái liệt kê các Epic — bấm để lọc story theo từng Epic.' ] },
  { match: 'summary', steps: [
    'Xem tiến độ sprint và số story theo trạng thái.',
    'Theo dõi hoạt động gần đây của dự án.' ] },
  { match: 'roadmap', steps: [
    'Xem lộ trình theo năm; lọc theo quý (Q1–Q4), phòng ban, trạng thái.',
    'Bấm "Tạo Roadmap" để thêm mốc/kế hoạch mới.',
    'Dùng để nhìn tổng thể kế hoạch dài hạn của dự án.' ] },
  { match: 'archived', steps: [
    'Xem các story đã lưu trữ (ẩn khỏi backlog).',
    'Khôi phục story khi cần dùng lại.' ] },
  { match: 'sprint history', steps: [
    'Xem lại các sprint đã chạy.',
    'Đánh giá tốc độ (velocity) của đội qua từng kỳ.' ] },
  { match: 'my work', steps: [
    'Xem nhanh 4 ô: Hôm nay / Quá hạn / Tuần này / Đang làm.',
    'Chuyển tab: Việc trong sprint / ngoài sprint / lịch sử.',
    'Bấm tên đồng đội để xem tải công việc của họ.',
    'Bấm "+ Tạo việc mới" để tạo task cá nhân.' ] },
  { match: 'projects', steps: [
    'Bấm một dự án để mở vào bên trong (backlog, board, sprint).',
    'Bấm "+ New Project" để tạo dự án mới.',
    'Xem nhanh tiến độ, sprint, số task, deadline ở mỗi thẻ.' ] },
  { match: 'thành viên', steps: [
    'Xem danh sách thành viên workspace và vai trò.',
    'Tìm thành viên theo tên.' ] },
  { match: 'phòng ban', steps: [
    'Xem các phòng ban (Product Team, Vận Hành, Marketing).',
    'Chọn đúng phòng ban để lọc story/sprint tương ứng.' ] },
  { match: 'báo cáo', steps: [
    'Điền 3 mục: Hôm qua làm gì · Hôm nay làm gì · Vướng mắc.',
    'Đánh dấu nếu có task trễ, rồi bấm lưu.',
    'Xem ai đã nộp / nộp trễ / chưa nộp báo cáo.' ] },
  { match: 'hồ sơ', steps: [
    'Đổi tên, ảnh đại diện, thông tin cá nhân.',
    'Đổi mật khẩu và tùy chọn tài khoản.' ] },
  { match: 'mcp', steps: [
    'Copy token MCP.',
    'Dán vào công cụ AI (như Claude) để kết nối với Kazuo.',
    'Giữ token bí mật — không chia sẻ, không commit.' ] },
];
const actionsFor = (s) => {
  const key = (s.path + ' ' + s.label).toLowerCase();
  return ACTIONS.find((a) => key.includes(a.match))?.steps || [];
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const anchor = (s) => esc(s.path.replace(/[^a-z0-9]+/gi, '-'));

// Group each screen into a category so the gallery reads as sections, not a flat list.
const categoryOf = (s) => {
  const l = s.label.toLowerCase();
  if (l.startsWith('thao tác')) return { key: 'action', name: 'Thao tác' };
  if (l.startsWith('personal')) return { key: 'personal', name: 'Cá nhân' };
  if (l.startsWith('dự án')) return { key: 'project', name: 'Trong dự án' };
  return { key: 'workspace', name: 'Workspace' };
};
// Strip the "Dự án · " / "Thao tác · " prefix for a cleaner card title.
const shortTitle = (label) => label.replace(/^[^·]+·\s*/, '');

// Order categories, then build one <section> per category with its cards.
const CAT_ORDER = ['workspace', 'project', 'action', 'personal'];
const grouped = data.screens.reduce((acc, s) => {
  const c = categoryOf(s); (acc[c.key] ||= { name: c.name, items: [] }).items.push(s); return acc;
}, {});

const cardFor = (s) => {
  const steps = actionsFor(s);
  const stepsHtml = steps.length
    ? `<div class="steps"><h4>Thao tác</h4><ol>${steps.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></div>`
    : '';
  return `
      <article class="card" id="${anchor(s)}">
        <div class="card-info">
          <h3>${esc(shortTitle(s.label))}</h3>
          <p class="guide">${esc(guideFor(s))}</p>
          ${stepsHtml}
        </div>
        <div class="shot">
          <img loading="lazy" src="shots/${esc(s.file)}" alt="Ảnh màn ${esc(shortTitle(s.label))}">
        </div>
      </article>`;
};

const galleryHtml = CAT_ORDER.filter((k) => grouped[k]).map((k) => `
    <section class="cat" id="cat-${k}" data-cat>
      <h2 class="section-title">${esc(grouped[k].name)} <span class="count">${grouped[k].items.length}</span></h2>
      <div class="grid">${grouped[k].items.map(cardFor).join('')}</div>
    </section>`).join('\n');

// Sidebar nav grouped the same way.
const navScreens = CAT_ORDER.filter((k) => grouped[k]).map((k) => `
      <span class="nav-group">${esc(grouped[k].name)}</span>
      ${grouped[k].items.map((s) => `<a href="#${anchor(s)}" data-link>${esc(shortTitle(s.label))}</a>`).join('\n      ')}`).join('\n');

// Scrum how-to guide for the team. Plain Vietnamese, step-by-step.
const scrumGuide = `
    <section class="intro" id="scrum">
      <h2><span class="ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.5"/><path d="M21 3v6h-6"/></svg></span> Hướng dẫn làm việc theo Scrum trên Kazuo</h2>
      <p class="lead">Scrum là cách làm việc chia theo từng chu kỳ ngắn (gọi là <b>Sprint</b>, thường 1–2 tuần).
      Mỗi sprint đội cam kết làm xong một số việc, cuối kỳ nhìn lại và cải thiện. Dưới đây là quy trình chuẩn ánh xạ vào Kazuo.</p>

      <h3>0. Khái niệm cần nắm (5 từ khóa)</h3>
      <ul class="terms">
        <li><b>Epic</b> — tính năng lớn (vd: "Hệ thống Môn phái"). Chứa nhiều Story.</li>
        <li><b>Story</b> — một việc mang lại giá trị, làm xong trong 1 sprint (vd: "Luồng đăng nhập").</li>
        <li><b>Subtask</b> — việc nhỏ chia ra từ Story để dễ làm/dễ chia người.</li>
        <li><b>Sprint</b> — chu kỳ làm việc cố định (vd 2 tuần) với danh sách việc đã cam kết.</li>
        <li><b>Estimate</b> — ước lượng thời gian hoàn thành mỗi Story (theo giờ hoặc ngày), để biết sprint có "gánh" nổi không.</li>
      </ul>

      <h3>1. Chuẩn bị Backlog (trước sprint)</h3>
      <ol>
        <li>Vào dự án → tab <b>Backlog</b>.</li>
        <li>Tạo <b>Epic</b> cho từng nhóm tính năng lớn (nút <b>Create epic</b> ở cột trái).</li>
        <li>Bấm <b>Tạo Issue</b> / <b>Thêm Story</b> để tạo Story trong Epic. Đặt tên theo mẫu: <i>"Là [vai trò], tôi cần [việc] để [mục đích]"</i> hoặc ngắn gọn rõ ràng.</li>
        <li>Mở Story, điền <b>Mô tả</b> và <b>tiêu chí hoàn thành</b> (Definition of Done) để ai đọc cũng hiểu thế nào là xong.</li>
      </ol>

      <h3>2. Lên một Story chuẩn (quan trọng nhất)</h3>
      <ol>
        <li>Ở Backlog, bấm vào một Story để mở màn <b>Chi tiết Story</b>.</li>
        <li>Đặt <b>Ưu tiên</b> (Critical / High / Medium / Low).</li>
        <li>Gán <b>người Thực hiện</b> (mỗi Story nên có đúng 1 người chịu trách nhiệm chính).</li>
        <li>Điền <b>Estimate</b> (vd 8h hoặc "8d"). <b>Không để trống</b> — thiếu estimate thì không đo được tải sprint.</li>
        <li>Đặt <b>Ngày bắt đầu</b> / hạn nếu cần.</li>
        <li>Chia <b>Subtask</b> nếu Story lớn; mỗi subtask cũng gán người + estimate.</li>
        <li>Dùng <b>Nhãn</b> để phân loại (vd: backend, UI, bug...).</li>
      </ol>

      <h3>3. Sprint Planning (đầu sprint)</h3>
      <ol>
        <li>Tab <b>Backlog</b> → bấm <b>Tạo Sprint</b>, đặt tên + ngày bắt đầu/kết thúc + <b>mục tiêu sprint</b> (Sprint Goal).</li>
        <li>Kéo các Story ưu tiên cao nhất từ Backlog vào Sprint.</li>
        <li>Cộng tổng <b>Estimate</b> — đừng nhận quá sức đội. Nếu quá tải, bỏ bớt Story ra.</li>
        <li>Chốt: mọi Story trong sprint đều có người thực hiện + estimate.</li>
      </ol>

      <h3>4. Trong sprint (mỗi ngày)</h3>
      <ol>
        <li>Mở tab <b>Board</b>: kéo thẻ Story qua các cột <b>TODO → Đang làm → Hoàn thành</b> theo tiến độ thật.</li>
        <li>Chỉ nên nhận <b>1–2 việc "Đang làm"</b> cùng lúc để tập trung.</li>
        <li>Cập nhật trạng thái subtask khi làm xong từng phần.</li>
        <li><b>Daily report</b>: vào <b>Báo cáo công việc</b>, ghi <i>Hôm qua làm gì · Hôm nay làm gì · Vướng mắc gì</i>. Nộp đúng giờ.</li>
      </ol>

      <div class="callout">
        <b>Daily Meeting — họp đứng 15 phút mỗi ngày</b>
        <p class="lead" style="margin:8px 0 12px">Đầu ngày cả đội họp nhanh (đứng, đúng 15 phút, cùng giờ cố định) để đồng bộ tiến độ và gỡ vướng mắc sớm. Mỗi người lần lượt trả lời <b>3 câu hỏi</b>:</p>
        <ol>
          <li><b>Hôm qua tôi đã làm gì?</b> (đã đẩy được việc nào gần Done)</li>
          <li><b>Hôm nay tôi sẽ làm gì?</b> (tập trung vào việc nào)</li>
          <li><b>Tôi đang vướng gì?</b> (ai/cái gì đang cản, cần hỗ trợ gì)</li>
        </ol>
        <p class="lead" style="margin:12px 0 6px"><b>Quy tắc giữ họp gọn trong 15 phút:</b></p>
        <ul>
          <li>Đúng giờ, đúng 15 phút — ai cũng đứng để không lan man.</li>
          <li>Mở tab <b>Board</b> làm nền: nhìn thẻ story để nói cho sát thực tế.</li>
          <li>Chỉ <b>đồng bộ + nêu vướng mắc</b>, KHÔNG giải quyết vấn đề chi tiết tại chỗ.</li>
          <li>Vấn đề cần bàn sâu → hẹn "họp sau" (parking lot) với đúng người liên quan.</li>
          <li>Nội dung 3 câu hỏi trùng với <b>daily report</b> — họp xong ghi luôn vào Báo cáo công việc.</li>
        </ul>
      </div>

      <h3>5. Cuối sprint</h3>
      <ol>
        <li><b>Review</b>: xem lại các Story đã <b>Hoàn thành</b> so với Sprint Goal (dùng tab <b>Summary</b>).</li>
        <li>Story chưa xong: kéo trả về Backlog hoặc sang sprint kế tiếp.</li>
        <li><b>Retrospective</b>: đội bàn nhau <i>cái gì tốt / cái gì cần cải thiện / hành động lần sau</i>.</li>
        <li>Xem lại <b>Sprint History</b> để theo dõi tốc độ (velocity) qua các kỳ.</li>
      </ol>

      <div class="callout">
        <b>Quy tắc vàng cho cả đội:</b>
        <ol>
          <li>Mọi Story vào sprint <b>phải có người thực hiện + estimate</b>.</li>
          <li>Trạng thái trên Board phải <b>khớp thực tế</b> — cập nhật ngay khi có thay đổi.</li>
          <li>Nộp <b>daily report</b> mỗi ngày, nêu rõ vướng mắc để được hỗ trợ sớm.</li>
          <li>Story chưa xong trong sprint <b>được phép cross (chuyển tiếp) sang sprint sau</b> — cứ kéo sang sprint kế để làm tiếp.</li>
        </ol>
      </div>
    </section>`;

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kazuo — Tài liệu hướng dẫn sử dụng cho team</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* Design system: Minimalism / Swiss style, dark mode, Inter, 8px spacing, blue accent */
  :root {
    --bg:#0f1419; --surface:#171c23; --surface-2:#1e242d; --line:#2a323d;
    --text:#e8eaed; --muted:#9aa4b2; --faint:#6b7480;
    --accent:#3b82f6; --accent-soft:#1d3355;
    --ok:#22c55e; --warn:#f59e0b;
    --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-6:24px; --sp-8:32px; --sp-12:48px;
    --radius:12px; --radius-sm:8px;
    --nav-w:264px; --header-h:76px;
    --dur:200ms;
  }
  * { box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body {
    margin:0; background:var(--bg); color:var(--text);
    font-family:'Inter',system-ui,"Segoe UI",Roboto,sans-serif;
    font-size:16px; line-height:1.65; -webkit-font-smoothing:antialiased;
  }
  a { color:inherit; }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.85em;
    background:var(--bg); border:1px solid var(--line); padding:1px 6px; border-radius:5px; color:#a9c7ff; }

  /* Header */
  header { position:sticky; top:0; z-index:20; height:var(--header-h);
    display:flex; align-items:center; gap:var(--sp-4);
    padding:0 var(--sp-6); background:rgba(15,20,25,.88); backdrop-filter:blur(10px);
    border-bottom:1px solid var(--line); }
  .brand { display:flex; align-items:center; gap:var(--sp-3); }
  .logo { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,#3b82f6,#8b5cf6);
    display:grid; place-items:center; color:#fff; flex-shrink:0; }
  .brand h1 { margin:0; font-size:17px; font-weight:600; letter-spacing:-.01em; }
  .brand p { margin:0; font-size:12.5px; color:var(--muted); }
  .header-meta { margin-left:auto; font-size:12.5px; color:var(--faint); display:flex; gap:var(--sp-4); }
  .header-meta b { color:var(--muted); font-weight:600; }

  /* Layout */
  .layout { display:grid; grid-template-columns:var(--nav-w) 1fr; max-width:1560px; margin:0 auto; }

  /* Sidebar nav */
  nav { position:sticky; top:var(--header-h); align-self:start;
    height:calc(100dvh - var(--header-h)); overflow-y:auto;
    padding:var(--sp-6) var(--sp-3); border-right:1px solid var(--line); }
  .nav-search { width:100%; margin-bottom:var(--sp-4); padding:9px 12px;
    background:var(--surface); border:1px solid var(--line); border-radius:var(--radius-sm);
    color:var(--text); font-size:13.5px; font-family:inherit; }
  .nav-search::placeholder { color:var(--faint); }
  .nav-search:focus { outline:2px solid var(--accent); outline-offset:1px; border-color:transparent; }
  .nav-group, nav > strong { display:block; margin:var(--sp-4) 0 var(--sp-2); padding:0 8px;
    font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.07em; color:var(--faint); }
  nav > strong:first-of-type { margin-top:0; }
  nav a { display:block; padding:7px 10px; margin:1px 0; border-radius:7px;
    font-size:13.5px; color:var(--muted); text-decoration:none;
    border-left:2px solid transparent; transition:background var(--dur),color var(--dur); }
  nav a:hover { background:var(--surface); color:var(--text); }
  nav a.active { background:var(--accent-soft); color:#cdddfd; border-left-color:var(--accent); font-weight:500; }
  nav a[hidden] { display:none; }

  /* Main */
  main { padding:var(--sp-8) var(--sp-8); min-width:0; }

  /* Guide sections (intro cards) */
  .intro { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius);
    padding:var(--sp-6) var(--sp-8); margin-bottom:var(--sp-6); scroll-margin-top:calc(var(--header-h) + 16px); }
  .intro > h2 { margin:0 0 var(--sp-2); font-size:22px; font-weight:700; letter-spacing:-.02em;
    display:flex; align-items:center; gap:var(--sp-3); }
  .intro > h2 .ic { color:var(--accent); }
  .intro h3 { margin:var(--sp-6) 0 var(--sp-2); font-size:15px; font-weight:600; color:#a9c7ff;
    padding-left:10px; border-left:3px solid var(--accent); }
  .intro ol, .intro ul { margin:0; padding-left:22px; }
  .intro li { margin:5px 0; }
  .intro .lead { color:var(--muted); }
  .terms { list-style:none; padding-left:0 !important; }
  .terms li { padding:9px 0; margin:0; border-bottom:1px solid var(--line); }
  .terms li:last-child { border-bottom:0; }
  .callout { margin-top:var(--sp-6); padding:var(--sp-4) var(--sp-6);
    background:var(--accent-soft); border:1px solid #2c4a78; border-left:3px solid var(--accent);
    border-radius:var(--radius-sm); }
  .callout ol { margin:var(--sp-2) 0 0; }

  /* Gallery */
  .section-title { margin:var(--sp-12) 0 var(--sp-4); font-size:16px; font-weight:600;
    text-transform:uppercase; letter-spacing:.06em; color:var(--muted);
    display:flex; align-items:center; gap:var(--sp-3); scroll-margin-top:calc(var(--header-h) + 16px); }
  .section-title .count { font-size:12px; font-weight:600; color:var(--faint);
    background:var(--surface-2); border:1px solid var(--line); border-radius:20px; padding:2px 9px;
    text-transform:none; letter-spacing:0; }
  /* One card per row: info block on top, large uncropped screenshot below. */
  .grid { display:flex; flex-direction:column; gap:var(--sp-6); }
  .card { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius);
    overflow:hidden; scroll-margin-top:calc(var(--header-h) + 16px);
    transition:border-color var(--dur); }
  .card:hover { border-color:#3a4756; }
  .card-info { padding:var(--sp-6) var(--sp-6) var(--sp-4); }
  .card-info h3 { margin:0 0 var(--sp-2); font-size:19px; font-weight:600; letter-spacing:-.01em; }
  .guide { margin:0; font-size:14.5px; line-height:1.6; color:var(--muted); }
  .steps { margin-top:var(--sp-4); padding:var(--sp-4) var(--sp-6);
    background:var(--surface-2); border:1px solid var(--line); border-radius:var(--radius-sm); }
  .steps h4 { margin:0 0 var(--sp-2); font-size:12px; font-weight:600; text-transform:uppercase;
    letter-spacing:.06em; color:#a9c7ff; }
  .steps ol { margin:0; padding-left:20px; }
  .steps li { margin:5px 0; font-size:14px; line-height:1.55; }
  .shot { display:block; background:var(--bg); border-top:1px solid var(--line);
    padding:var(--sp-4); }
  .shot img { width:100%; height:auto; display:block; border-radius:var(--radius-sm);
    border:1px solid var(--line); }

  /* Responsive */
  @media (max-width:1024px) {
    .layout { grid-template-columns:1fr; }
    nav { position:static; height:auto; border-right:0; border-bottom:1px solid var(--line);
      display:flex; flex-wrap:wrap; gap:6px; }
    nav .nav-search { flex-basis:100%; }
    .nav-group, nav > strong { width:100%; margin:var(--sp-2) 0 0; }
    main { padding:var(--sp-6) var(--sp-4); }
    .intro { padding:var(--sp-4) var(--sp-4); }
  }
  @media (max-width:600px) {
    .header-meta { display:none; }
    .card-info { padding:var(--sp-4); }
  }
  @media (prefers-reduced-motion:reduce) {
    * { transition:none !important; scroll-behavior:auto !important; }
  }
</style>
</head>
<body>
<header>
  <div class="brand">
    <span class="logo" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    </span>
    <div>
      <h1>Kazuo — Hướng dẫn sử dụng</h1>
      <p>Tài liệu hướng dẫn · SMIT Work</p>
    </div>
  </div>
  <div class="header-meta">
    <span><b>${data.screens.length}</b> màn hình</span>
    <span>Nguồn: <b>${esc(data.baseUrl.replace('https://', ''))}</b></span>
  </div>
</header>
<div class="layout">
  <nav aria-label="Mục lục">
    <input class="nav-search" type="search" placeholder="Lọc màn hình..." aria-label="Lọc màn hình" oninput="filterNav(this.value)">
    <strong>Bắt đầu</strong>
      <a href="#quickstart" data-link>Cách sử dụng nhanh</a>
      <a href="#scrum" data-link>Hướng dẫn Scrum</a>
${navScreens}
  </nav>
  <main>
    <section class="intro" id="quickstart">
      <h2><span class="ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></span> Cách sử dụng nhanh</h2>
      <ol>
        <li>Đăng nhập tại <code>${esc(data.baseUrl)}/login</code>.</li>
        <li>Chọn <b>workspace</b>, <b>phòng ban</b> và <b>dự án</b> muốn làm việc.</li>
        <li>Vào tab <b>Board</b> để theo dõi story theo trạng thái; kéo thả để cập nhật.</li>
        <li>Mở một <b>Story</b> để xem mô tả, subtask, người thực hiện và estimate.</li>
        <li>Cuối ngày, vào <b>Báo cáo công việc</b> để nộp daily report.</li>
      </ol>
    </section>
${scrumGuide}
    <h2 class="section-title" id="screens">Chi tiết từng màn hình &amp; thao tác</h2>
${galleryHtml}
  </main>
</div>
<script>
  // Scroll-spy: highlight the nav link of the section currently in view.
  const links = [...document.querySelectorAll('nav a[data-link]')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        map.get(e.target.id)?.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('[id]').forEach(el => { if (map.has(el.id)) spy.observe(el); });

  // Sidebar filter: hide nav links that don't match the query.
  function filterNav(q) {
    const s = q.trim().toLowerCase();
    links.forEach(a => { a.hidden = s && !a.textContent.toLowerCase().includes(s); });
  }
</script>
</body>
</html>`;

// Output as index.html so GitHub Pages serves it at the site root.
await writeFile('index.html', html);
console.log(`✓ index.html built with ${data.screens.length} screens.`);
