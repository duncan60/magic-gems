# Magic Gems ✨

一款像素風瀏覽器 Match-3 消除遊戲，純原生 HTML / CSS / JavaScript，無任何外部依賴。

🎮 **線上遊玩：[https://duncan60.github.io/magic-gems/](https://duncan60.github.io/magic-gems/)**

---

## 遊戲畫面

![Magic Gems 遊戲截圖](https://duncan60.github.io/magic-gems/preview.png)

---

## 遊戲規則

1. 點擊一顆寶石，再點擊**相鄰**的寶石進行交換
2. 交換後若形成 **3 顆以上同色相連**即可消除
3. 消除後寶石自動下落，可觸發多次**連鎖反應（COMBO）**
4. 無效交換計為**失誤**，累計 3 次遊戲結束
5. 限時 **90 秒**，時間歸零遊戲結束
6. 棋盤無法移動時自動**重排**（不扣分、不計失誤）

---

## 特殊寶石

| 觸發條件 | 特殊寶石 | 效果 |
|---------|---------|------|
| 橫向 4 連消除 | 橫向炸彈（白色橫條紋） | 清除整列 |
| 縱向 4 連消除 | 縱向炸彈（白色縱條紋） | 清除整欄 |
| 5 連以上消除 | 彩虹寶石（彩虹光暈） | 清除棋盤上所有同色寶石 |

---

## 計分方式

- 每消除 1 顆寶石：**+10 分**
- 特殊寶石觸發的連帶消除同樣計分
- 連鎖反應（COMBO）分數依消除數量累加
- 最高分數自動記錄為**最佳紀錄**，儲存於本機瀏覽器

---

## 技術架構

```
magic-gems/
├── index.html   # DOM 結構與 UI（繁體中文）
├── game.js      # 所有遊戲邏輯與狀態管理
└── styles.css   # 版面配置、寶石顏色、動畫、RWD
```

- **零依賴**：純 Vanilla JS / HTML5 / CSS3，直接開啟 `index.html` 即可遊玩
- **RWD 多裝置支援**：桌機、平板、手機直向、手機橫向均最佳化
- **自動存檔**：每步動作後寫入 `localStorage`

## 本地開發

```bash
# 直接開啟（macOS）
open index.html

# 或透過本地 HTTP server
python3 -m http.server 8080
# 接著開啟 http://localhost:8080
```

---

## License

MIT
