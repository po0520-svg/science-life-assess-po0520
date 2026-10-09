# 專案規則

使用繁體中文。使用者是國中自然科教師李祥菁。

網站以純靜態檔案發布至 GitHub Pages，學生回應只送至 GAS 與私人 Google 試算表。不得引入 Firebase。

原始教材、教師版答案、草圖與學生紀錄不得提交至公開儲存庫。發布檔案由 Pages 工作流程明確列出。

修改 data.js 後，執行 `node tools/build-keys.cjs` 與 `node tests/core.cjs`，同步 GAS 答案表。部署 GAS 更新時須建立新的部署版本。

學生必須依序完成各關才能解鎖下一關；教師模式可解鎖供檢查。
