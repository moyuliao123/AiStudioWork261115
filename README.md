# 晨光咖啡讀書室 — 專注計時與心情便條牆

純前端靜態網頁應用，無需後端伺服器或登入帳號。支援 **GitHub Pages 直接開啟使用**，亦可打包成與 CyberChef 相同的**單一 HTML 離線檔**。

## 功能特色

- **專注計時器**：15 / 25 / 45 / 60 分鐘快速切換、±5 分鐘微調與自訂分鐘數。
- **即時合成咖啡館音效**：使用 Web Audio API 即時合成雨天窗畔、義式吧檯、壁爐翻書、晨間琴聲與靜音模式，無外部音檔失效問題。
- **心情便條牆**：倒數結束後可選擇心情與紙張顏色寫下一句話貼上牆面，資料保存於瀏覽器 `localStorage`，並支援篩選與一鍵清空。
- **全螢幕專注模式**：支援全螢幕沉浸計時與結束後直接紀錄心情。

---

## 方式一：部署到 GitHub Pages（像網站一樣直接開來用）

1. 將本專案推送到你的 GitHub Repository（`main` 或 `master` 分支）：
   ```bash
   git init
   git add .
   git commit -m "feat: cafe focus timer and mood wall"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/<你的專案名稱>.git
   git push -u origin main
   ```
2. 前往 GitHub 專案頁面的 **Settings → Pages**。
3. 在 **Build and deployment → Source** 務必選擇 **GitHub Actions**（不可選 `Deploy from a branch`，否則 GitHub 會直接載入未編譯的 `index.html` 導致畫面一片空白）。
4. 到專案上方的 **Actions** 分頁確認 `Deploy to GitHub Pages` 顯示綠色勾勾，完成後即可透過 `https://<你的帳號>.github.io/<你的專案名稱>/` 開啟使用！
   - 同時在網站網址後方加上 `/cafe-focus-standalone.html` 也能直接下載單一離線 HTML 檔。

## 方式二：打包成 CyberChef 風格單一 HTML 檔

在本機執行：

```bash
npm install
npm run build:single
```

產出的 `dist-single/index.html` 已將所有樣式、程式與圖片內嵌為單一檔案，直接雙擊用瀏覽器開啟即可使用。
