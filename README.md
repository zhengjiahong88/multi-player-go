1. 研究目標
做一個多人圍棋 AI，參考 AlphaZero 架構，讓 AI 透過自我對弈產生訓練資料。
2. 棋盤規則實作
先完成 `Board`：落子、Pass、提子、合法步、終局判斷、計分。
3. MCTS 搜尋流程
每一回合進行多次 simulation：
`selection → expansion → backPropagation`
4. Selection
從目前節點開始，根據 UCB 選擇最值得探索的 child，一路走到 leaf。
5. Expansion
對 leaf 呼叫神經網路，取得 `policy` 和 `value`，再根據合法步建立 children。
6. BackPropagation
把 value 從 leaf 沿著 parent 回傳到 root，更新 `visits` 和 `valueSum`。
7. 產生 π
MCTS 結束後，用每個 child 的 visit 次數計算 π：
`π = child.visits / totalVisits`
8. 選下一手
根據 π 隨機抽樣選擇下一個節點，進入下一回合。
9. 終局與訓練資料
棋局結束後，回溯每個歷史節點，產生：
`state、π、z`
10. 目前進度
已完成 Java 版棋盤規則、MCTS 主流程，以及 Java 呼叫 Python PyTorch Net 進行推論。
目前 Net 尚未訓練，因此行為仍接近隨機。
