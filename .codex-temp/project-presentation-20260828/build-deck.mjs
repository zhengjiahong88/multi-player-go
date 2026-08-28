import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const WIDTH = 1280;
const HEIGHT = 720;
const OUTPUT_DIR = "D:\\IntelliJ IDEA\\multi-player go\\.codex-temp\\project-presentation-20260828\\output";
const FINAL_PPTX = "D:\\IntelliJ IDEA\\multi-player go\\多人圍棋AI專案講解.pptx";

const C = {
  canvas: "#FFFFFF",
  ink: "#000000",
  muted: "#5F6773",
  panel: "#EDEDED",
  panel2: "#F6F7F8",
  rule: "#B8BCC4",
  accent: "#6DCBF4",
  accentStrong: "#3D8DFF",
  accentPale: "#D0EDFA",
  danger: "#D94A4A",
};

const presentation = Presentation.create({ slideSize: { width: WIDTH, height: HEIGHT } });

function addText(slide, text, position, style = {}, name = undefined) {
  const box = slide.shapes.add({
    geometry: "textbox",
    name,
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    fontSize: 22,
    color: C.ink,
    alignment: "left",
    verticalAlignment: "top",
    ...style,
  };
  return box;
}

function addPanel(slide, position, fill = C.panel2, line = C.rule, name = undefined) {
  return slide.shapes.add({
    geometry: "rect",
    name,
    position,
    fill,
    line: { style: "solid", fill: line, width: 1 },
  });
}

function addRule(slide, position, color = C.rule, width = 1) {
  return slide.shapes.add({
    geometry: "line",
    position,
    fill: "none",
    line: { style: "solid", fill: color, width },
  });
}

function addTitle(slide, title, number) {
  addText(slide, title, { left: 42, top: 34, width: 1120, height: 66 }, { fontSize: 46, bold: true }, `slide-${number}-title`);
  addRule(slide, { left: 42, top: 118, width: 1196, height: 0 }, C.ink, 1.5);
  addText(slide, String(number).padStart(2, "0"), { left: 1178, top: 655, width: 60, height: 24 }, { fontSize: 14, color: C.muted, alignment: "right" });
}

function setNotes(slide, talkTrack, sources) {
  const sourceLines = sources.map(source => `- ${source}`).join("\n");
  slide.speakerNotes.textFrame.setText(`${talkTrack}\n\n[Sources]\n${sourceLines}`);
  slide.speakerNotes.setVisible(true);
}

function addLabel(slide, label, position, fill = C.accentPale) {
  const box = slide.shapes.add({
    geometry: "rect",
    position,
    fill,
    line: { style: "solid", fill, width: 0 },
  });
  box.text = label;
  box.text.style = { fontSize: 18, bold: true, color: C.ink, alignment: "center", verticalAlignment: "middle" };
  return box;
}

function addFlowBox(slide, title, body, position, fill = C.panel2) {
  addPanel(slide, position, fill, C.rule);
  addText(slide, title, { left: position.left + 18, top: position.top + 18, width: position.width - 36, height: 42 }, { fontSize: 28, bold: true });
  addText(slide, body, { left: position.left + 18, top: position.top + 68, width: position.width - 36, height: position.height - 82 }, { fontSize: 20, color: C.muted });
}

function addArrow(slide, text, position) {
  addText(slide, text, position, { fontSize: 34, bold: true, color: C.accentStrong, alignment: "center", verticalAlignment: "middle" });
}

function drawBoard(slide, position, stones = [], highlights = []) {
  addPanel(slide, position, "#E8C98E", "#A67836");
  const margin = 42;
  const step = (position.width - margin * 2) / 3;
  for (let i = 0; i < 4; ++i) {
    addRule(slide, { left: position.left + margin, top: position.top + margin + i * step, width: step * 3, height: 0 }, "#543B20", 2);
    addRule(slide, { left: position.left + margin + i * step, top: position.top + margin, width: 0, height: step * 3 }, "#543B20", 2);
  }
  for (const highlight of highlights) {
    const center = {
      x: position.left + margin + highlight.col * step,
      y: position.top + margin + highlight.row * step,
    };
    slide.shapes.add({
      geometry: "ellipse",
      position: { left: center.x - 15, top: center.y - 15, width: 30, height: 30 },
      fill: C.accent,
      line: { style: "solid", fill: C.accentStrong, width: 2 },
    });
  }
  for (const stone of stones) {
    const center = {
      x: position.left + margin + stone.col * step,
      y: position.top + margin + stone.row * step,
    };
    slide.shapes.add({
      geometry: "ellipse",
      position: { left: center.x - 25, top: center.y - 25, width: 50, height: 50 },
      fill: stone.player === 1 ? C.ink : C.canvas,
      line: { style: "solid", fill: C.ink, width: 2 },
    });
  }
}

// 1 — Cover
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addText(slide, "JAVA × PYTORCH × MCTS", { left: 42, top: 42, width: 600, height: 36 }, { fontSize: 22, bold: true, color: C.accentStrong });
  addText(slide, "多人圍棋 AI\n專案解析", { left: 42, top: 170, width: 820, height: 220 }, { fontSize: 72, bold: true }, "cover-title");
  addText(slide, "從棋盤規則、蒙地卡羅樹搜尋，到自我對弈訓練資料", { left: 42, top: 500, width: 800, height: 76 }, { fontSize: 28, color: C.muted });
  addPanel(slide, { left: 1010, top: 0, width: 270, height: 720 }, C.panel, C.panel);
  addText(slide, "4×4", { left: 1040, top: 194, width: 210, height: 84 }, { fontSize: 64, bold: true, alignment: "center" });
  addText(slide, "目前棋盤大小", { left: 1040, top: 286, width: 210, height: 34 }, { fontSize: 20, color: C.muted, alignment: "center" });
  addText(slide, "2", { left: 1040, top: 392, width: 210, height: 84 }, { fontSize: 64, bold: true, alignment: "center" });
  addText(slide, "目前玩家數", { left: 1040, top: 484, width: 210, height: 34 }, { fontSize: 20, color: C.muted, alignment: "center" });
  setNotes(slide,
    "開場先說明：這是一個以 AlphaZero 思路為參考的圍棋 AI 原型。簡報會沿著一次落子的資料流，拆解規則、搜尋、神經網路與訓練資料。提醒聽眾：專案目標描述為多人圍棋，但目前 Main.java 的執行設定是兩位玩家。",
    ["README.md", "src/Main.java"]);
}

// 2 — Scope
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "這個原型已串起完整決策鏈，但尚未完成學習迴圈", 2);
  const items = [
    ["規則層", "落子、Pass、提子、合法步、終局與計分"],
    ["搜尋層", "Selection、Expansion、Backpropagation 與 π"],
    ["推論層", "Java 呼叫 Python／PyTorch 取得 policy 與 value"],
    ["資料層", "棋局結束後輸出 state、π、z 的樣本物件"],
  ];
  const positions = [
    { left: 42, top: 180, width: 560, height: 180 },
    { left: 636, top: 180, width: 602, height: 180 },
    { left: 42, top: 398, width: 560, height: 180 },
    { left: 636, top: 398, width: 602, height: 180 },
  ];
  items.forEach(([title, body], index) => addFlowBox(slide, title, body, positions[index], index === 2 ? C.accentPale : C.panel2));
  addText(slide, "關鍵限制：Net 尚未訓練，因此目前行為接近隨機。", { left: 42, top: 610, width: 950, height: 36 }, { fontSize: 22, bold: true, color: C.danger });
  setNotes(slide,
    "這頁先建立全貌。專案已經讓一局棋跑完，也能產生訓練樣本；真正缺少的是把樣本送進最佳化器、更新模型，再讓新模型回到自我對弈的反覆訓練流程。",
    ["README.md", "src/Board.java", "src/Node.java", "src/PythonNet.java", "src/TrainingData.java"]);
}

// 3 — Architecture
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "一次落子會在 Java 搜尋樹與 Python 神經網路之間往返", 3);
  addFlowBox(slide, "Board", "保存棋盤與輪到的玩家\n產生合法步與 state", { left: 42, top: 214, width: 230, height: 230 });
  addArrow(slide, "→", { left: 278, top: 292, width: 70, height: 70 });
  addFlowBox(slide, "Node / MCTS", "選節點、展開子節點\n累積 visits 與 value", { left: 350, top: 214, width: 250, height: 230 }, C.accentPale);
  addArrow(slide, "⇄", { left: 608, top: 292, width: 84, height: 70 });
  addFlowBox(slide, "PythonNet", "序列化 state\n透過 stdin / stdout 溝通", { left: 700, top: 214, width: 240, height: 230 });
  addArrow(slide, "→", { left: 946, top: 292, width: 70, height: 70 });
  addFlowBox(slide, "PyTorch Net", "輸出 policy logits\n與每位玩家的 value", { left: 1022, top: 214, width: 216, height: 230 });
  addRule(slide, { left: 42, top: 514, width: 1196, height: 0 }, C.rule, 1);
  addText(slide, "設計意義", { left: 42, top: 548, width: 180, height: 40 }, { fontSize: 28, bold: true });
  addText(slide, "Java 專注遊戲狀態與搜尋；Python 保留深度學習生態。兩者以長駐子程序降低每次推論的啟動成本。", { left: 232, top: 546, width: 930, height: 62 }, { fontSize: 22, color: C.muted });
  setNotes(slide,
    "沿著箭頭說明每個責任邊界。Main 建立 PythonNet 後才啟動根節點；MCTS 展開 leaf 時才呼叫網路。Python 程序持續讀取每一行 state，不是每次 evaluate 都重新啟動。",
    ["src/Main.java", "src/Node.java", "src/PythonNet.java", "net.py"]);
}

// 4 — Board representation
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Board 同時負責規則狀態與神經網路輸入表示", 4);
  drawBoard(slide, { left: 42, top: 172, width: 430, height: 430 }, [
    { row: 0, col: 1, player: 1 },
    { row: 1, col: 1, player: 2 },
    { row: 2, col: 2, player: 1 },
    { row: 3, col: 0, player: 2 },
  ]);
  addText(slide, "int[SIZE][SIZE]", { left: 530, top: 182, width: 320, height: 48 }, { fontSize: 32, bold: true });
  addText(slide, "0 = 空點\n1…PLAYER_COUNT = 玩家棋子", { left: 530, top: 244, width: 370, height: 96 }, { fontSize: 22, color: C.muted });
  addText(slide, "getState()", { left: 530, top: 382, width: 320, height: 48 }, { fontSize: 32, bold: true });
  addText(slide, "輸出 double[player][row][col]\n每位玩家各占一個二值 channel", { left: 530, top: 444, width: 470, height: 96 }, { fontSize: 22, color: C.muted });
  addPanel(slide, { left: 1008, top: 184, width: 230, height: 356 }, C.panel, C.panel);
  addText(slide, "目前張量", { left: 1030, top: 216, width: 186, height: 40 }, { fontSize: 24, bold: true, alignment: "center" });
  addText(slide, "2 × 4 × 4", { left: 1030, top: 302, width: 186, height: 64 }, { fontSize: 42, bold: true, color: C.accentStrong, alignment: "center" });
  addText(slide, "channels × rows × cols", { left: 1024, top: 380, width: 198, height: 54 }, { fontSize: 18, color: C.muted, alignment: "center" });
  setNotes(slide,
    "棋盤不是直接把玩家編號當作一張影像送入網路，而是展開為多個二值通道。這讓卷積層能分別辨認不同玩家的棋子。Board 是 record，但內部陣列在產生子狀態時會逐列 clone。",
    ["src/Board.java", "src/Main.java", "net.py"]);
}

// 5 — Rules and graph search
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "棋群與「氣」被轉換成格點圖上的搜尋問題", 5);
  drawBoard(slide, { left: 42, top: 172, width: 430, height: 430 }, [
    { row: 1, col: 1, player: 1 },
    { row: 1, col: 2, player: 1 },
    { row: 0, col: 1, player: 2 },
    { row: 2, col: 1, player: 2 },
    { row: 1, col: 0, player: 2 },
  ], [
    { row: 0, col: 2 },
    { row: 2, col: 2 },
    { row: 1, col: 3 },
  ]);
  addLabel(slide, "藍點＝棋群的氣", { left: 138, top: 622, width: 240, height: 34 });
  const steps = [
    ["1", "Pos 提供上下左右鄰居", "iterator() 只回傳棋盤範圍內的位置。"],
    ["2", "search() 執行 DFS", "同色棋子加入 pieces；空點加入 liberties。"],
    ["3", "liberties 為空就提子", "move() 檢查相鄰敵方棋群並清除棋子。"],
  ];
  steps.forEach(([n, title, body], index) => {
    const top = 174 + index * 142;
    addText(slide, n, { left: 530, top, width: 52, height: 52 }, { fontSize: 34, bold: true, color: C.accentStrong, alignment: "center" });
    addText(slide, title, { left: 602, top, width: 560, height: 40 }, { fontSize: 28, bold: true });
    addText(slide, body, { left: 602, top: top + 48, width: 590, height: 58 }, { fontSize: 20, color: C.muted });
  });
  addText(slide, "合法步還會排除自殺與立即回到 parent 棋盤的情況。", { left: 530, top: 602, width: 670, height: 40 }, { fontSize: 21, bold: true });
  setNotes(slide,
    "把棋盤想成無向圖：每一格是頂點，上下左右是邊。Pos.search 使用 ArrayList 當 stack 進行深度優先搜尋。Group 同時保存棋子集合與氣集合；沒有氣就是被吃。合法步另外檢查自殺與簡化的劫爭條件。",
    ["src/Pos.java", "src/Group.java", "src/Board.java"]);
}

// 6 — MCTS overview
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "每回合重複 10,000 次 simulation，再依 visits 選下一手", 6);
  addRule(slide, { left: 72, top: 330, width: 1136, height: 0 }, C.ink, 2);
  const items = [
    ["01", "Selection", "沿 UCB 最大的 child\n一路走到 leaf"],
    ["02", "Expansion", "網路評估 leaf\n建立所有合法 children"],
    ["03", "Backpropagation", "將 value 回傳至 root\n累加 visits 與 valueSum"],
  ];
  const lefts = [74, 454, 840];
  items.forEach(([label, title, body], index) => {
    const left = lefts[index];
    slide.shapes.add({ geometry: "ellipse", position: { left: left - 7, top: 320, width: 20, height: 20 }, fill: C.accentStrong, line: { style: "solid", fill: C.accentStrong, width: 0 } });
    addText(slide, label, { left, top: 250, width: 80, height: 36 }, { fontSize: 20, bold: true, color: C.accentStrong });
    addText(slide, title, { left, top: 380, width: 310, height: 48 }, { fontSize: 30, bold: true });
    addText(slide, body, { left, top: 440, width: 310, height: 90 }, { fontSize: 21, color: C.muted });
  });
  addText(slide, "simulation 不是直接落真實的一手；它是在樹中累積統計證據。", { left: 72, top: 582, width: 920, height: 44 }, { fontSize: 24, bold: true });
  setNotes(slide,
    "這三步會在同一回合重複 Node.SIMULATIONS 次，目前常數為 10000。simulation 的結果不會直接改變目前棋盤，而是增加樹節點統計量。完成所有 simulation 後，才根據 child visits 算出 π 並抽樣下一手。",
    ["README.md", "src/Node.java"]);
}

// 7 — Selection
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Selection 用 exploitation 與 exploration 平衡已知價值和先驗機率", 7);
  addPanel(slide, { left: 42, top: 188, width: 610, height: 300 }, C.panel, C.panel);
  addText(slide, "UCB = Q + 1.4 × P × √N / (1 + n)", { left: 70, top: 286, width: 556, height: 86 }, { fontSize: 38, bold: true, alignment: "center", verticalAlignment: "middle" });
  addText(slide, "程式中 Q 使用 parent 當前玩家對應的 valueSum / visits", { left: 70, top: 394, width: 556, height: 54 }, { fontSize: 20, color: C.muted, alignment: "center" });
  const explanations = [
    ["Q", "平均價值", "走過的結果是否好"],
    ["P", "網路 prior", "模型起初偏好哪一步"],
    ["N / n", "父子 visits", "鼓勵探索較少造訪的分支"],
  ];
  explanations.forEach(([symbol, title, body], index) => {
    const top = 188 + index * 132;
    addText(slide, symbol, { left: 720, top, width: 74, height: 62 }, { fontSize: 40, bold: true, color: C.accentStrong, alignment: "center" });
    addText(slide, title, { left: 820, top: top + 2, width: 300, height: 34 }, { fontSize: 26, bold: true });
    addText(slide, body, { left: 820, top: top + 44, width: 360, height: 42 }, { fontSize: 20, color: C.muted });
  });
  addText(slide, "visits = 0 時，Q 先視為 0；探索項仍可讓新節點被選中。", { left: 42, top: 558, width: 930, height: 54 }, { fontSize: 22, bold: true });
  setNotes(slide,
    "把公式拆成兩半：Q 是 exploitation，偏向已知表現好的步；其餘項是 exploration，利用神經網路 prior 與 visit 比例讓搜尋保持廣度。這裡 value 是每位玩家一個分量，因此 Q 會取 parent.board.player 對應的值。",
    ["src/Node.java"]);
}

// 8 — Expansion
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Expansion 先遮罩非法動作，再把 logits 正規化成 children prior", 8);
  const items = [
    ["① 網路推論", "evaluate(state) 回傳 policy logits 與 value"],
    ["② 合法步遮罩", "非法位置設為 −∞；Pass 永遠加入候選"],
    ["③ 穩定 softmax", "先減去最大 logit，再 exp 與除以總和"],
    ["④ 建立 children", "每個合法步建立 Node，prior 寫入 P"],
  ];
  const positions = [
    { left: 42, top: 180, width: 560, height: 176 },
    { left: 636, top: 180, width: 602, height: 176 },
    { left: 42, top: 400, width: 560, height: 176 },
    { left: 636, top: 400, width: 602, height: 176 },
  ];
  items.forEach(([title, body], index) => addFlowBox(slide, title, body, positions[index], index === 2 ? C.accentPale : C.panel2));
  addText(slide, "動作空間 = SIZE² + 1；最後一個 index 專門代表 Pass。", { left: 42, top: 612, width: 820, height: 38 }, { fontSize: 22, bold: true });
  setNotes(slide,
    "policy head 輸出的是 logits，不是機率。Java 端使用 mask 排除非法步，再自行做 softmax。用最大值平移是典型的數值穩定技巧。moveIndex(null) 回傳 POINTS，因此 Pass 落在最後一格。",
    ["src/Node.java", "src/Board.java", "src/Main.java", "net.py"]);
}

// 9 — Backprop and pi
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Backpropagation 累積向量 value；根節點再把 visits 轉成 π", 9);
  const nodes = [
    { left: 80, label: "root", visits: "+1 visit" },
    { left: 340, label: "…", visits: "+1 visit" },
    { left: 600, label: "parent", visits: "+1 visit" },
    { left: 860, label: "leaf", visits: "+1 visit" },
  ];
  nodes.forEach((node, index) => {
    addPanel(slide, { left: node.left, top: 238, width: 170, height: 138 }, index === 3 ? C.accentPale : C.panel2, C.rule);
    addText(slide, node.label, { left: node.left + 16, top: 262, width: 138, height: 36 }, { fontSize: 28, bold: true, alignment: "center" });
    addText(slide, node.visits, { left: node.left + 16, top: 314, width: 138, height: 30 }, { fontSize: 18, color: C.muted, alignment: "center" });
    if (index < nodes.length - 1) addArrow(slide, "←", { left: node.left + 178, top: 272, width: 74, height: 60 });
  });
  addText(slide, "每個節點：valueSum[player] += value[player]", { left: 80, top: 432, width: 950, height: 52 }, { fontSize: 30, bold: true });
  addPanel(slide, { left: 80, top: 524, width: 1100, height: 82 }, C.panel, C.panel);
  addText(slide, "π(action) = child.visits / Σ children.visits", { left: 110, top: 545, width: 620, height: 42 }, { fontSize: 28, bold: true });
  addText(slide, "依 π 隨機抽樣下一手", { left: 800, top: 546, width: 330, height: 38 }, { fontSize: 24, color: C.accentStrong, bold: true, alignment: "right" });
  setNotes(slide,
    "leaf 得到的 value 是每位玩家一個分數，因此沿 parent chain 回傳時會把整個向量都累加。完成 simulation 後，根節點的 child visit 分布就是 π；目前程式以 Math.random 依 π 抽樣，而不是固定選最高 visits。",
    ["src/Node.java", "src/NetResult.java"]);
}

// 10 — Java/Python IPC
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Java 與 Python 以兩行文字協定交換一次推論結果", 10);
  addText(slide, "Java → Python", { left: 42, top: 174, width: 500, height: 44 }, { fontSize: 30, bold: true });
  addPanel(slide, { left: 42, top: 232, width: 560, height: 238 }, C.panel2, C.rule);
  addText(slide, "1. 將 state 攤平成空白分隔數字\n2. 寫入 stdin 並 flush\n3. 等待 Python 回傳兩行", { left: 72, top: 272, width: 500, height: 160 }, { fontSize: 23 });
  addText(slide, "Python → Java", { left: 680, top: 174, width: 500, height: 44 }, { fontSize: 30, bold: true });
  addPanel(slide, { left: 680, top: 232, width: 558, height: 238 }, C.accentPale, C.accent);
  addText(slide, "第 1 行：ACTION_SIZE 個 policy logits\n第 2 行：PLAYER_COUNT 個 value\n每次 print(..., flush=True)", { left: 710, top: 272, width: 498, height: 160 }, { fontSize: 23 });
  addRule(slide, { left: 42, top: 526, width: 1196, height: 0 }, C.rule, 1);
  addText(slide, "優點", { left: 42, top: 562, width: 90, height: 34 }, { fontSize: 24, bold: true });
  addText(slide, "簡單、可觀察、Python 程序長駐", { left: 138, top: 560, width: 380, height: 38 }, { fontSize: 22, color: C.muted });
  addText(slide, "風險", { left: 650, top: 562, width: 90, height: 34 }, { fontSize: 24, bold: true });
  addText(slide, "文字解析成本、協定脆弱、錯誤處理有限", { left: 746, top: 560, width: 450, height: 38 }, { fontSize: 22, color: C.muted });
  setNotes(slide,
    "PythonNet 建構子用 ProcessBuilder 啟動 net.py，並保留 reader/writer。evaluate 被 synchronized，代表同一個 PythonNet 不會同時處理多筆推論。協定很精簡，但若 Python 少輸出一行、維度錯誤或程序終止，Java 端目前沒有完整復原機制。",
    ["src/PythonNet.java", "src/Main.java", "net.py"]);
}

// 11 — Training data
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "每個歷史節點最後會轉成一筆 state、π、z 訓練樣本", 11);
  const items = [
    ["state", "棋盤輸入", "double[player][row][col]\n描述當下各玩家的棋子位置"],
    ["π", "搜尋目標", "double[action]\n由 MCTS child visits 正規化"],
    ["z", "終局標籤", "double[player]\n各玩家得分占總分的比例"],
  ];
  const lefts = [42, 440, 838];
  items.forEach(([symbol, title, body], index) => {
    const left = lefts[index];
    addText(slide, symbol, { left, top: 188, width: 330, height: 94 }, { fontSize: 64, bold: true, color: index === 1 ? C.accentStrong : C.ink });
    addText(slide, title, { left, top: 300, width: 330, height: 42 }, { fontSize: 28, bold: true });
    addRule(slide, { left, top: 356, width: 330, height: 0 }, C.rule, 1);
    addText(slide, body, { left, top: 382, width: 330, height: 120 }, { fontSize: 21, color: C.muted });
  });
  addPanel(slide, { left: 42, top: 548, width: 1196, height: 72 }, C.panel, C.panel);
  addText(slide, "目前 createTrainingData() 只建立 ArrayList 並印出資料數量，尚未保存或訓練模型。", { left: 70, top: 566, width: 1120, height: 40 }, { fontSize: 22, bold: true, alignment: "center" });
  setNotes(slide,
    "這是 AlphaZero 類型方法的核心監督訊號：state 是輸入，π 教 policy head 模仿搜尋結果，z 教 value head預測終局。這份實作的 z 不是單一勝負值，而是每位玩家的得分比例。要特別指出：TrainingData 現在只存在記憶體中。",
    ["src/Node.java", "src/TrainingData.java", "src/Board.java"]);
}

// 12 — Close
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "下一步是把可執行原型升級成可反覆學習的系統", 12);
  addText(slide, "已完成", { left: 42, top: 178, width: 560, height: 50 }, { fontSize: 32, bold: true });
  addText(slide, "✓ 棋盤規則與合法步\n✓ MCTS 主流程與 π\n✓ Java／PyTorch 推論橋接\n✓ state、π、z 樣本結構", { left: 42, top: 248, width: 560, height: 240 }, { fontSize: 25 });
  addText(slide, "建議里程碑", { left: 678, top: 178, width: 560, height: 50 }, { fontSize: 32, bold: true });
  const milestones = [
    "1  儲存與批次載入 TrainingData",
    "2  實作 policy/value loss 與 optimizer",
    "3  建立自我對弈 → 訓練 → 評估迴圈",
    "4  補上模型保存、測試與效能量測",
  ];
  milestones.forEach((text, index) => {
    const top = 246 + index * 68;
    addRule(slide, { left: 678, top: top + 48, width: 560, height: 0 }, C.rule, 1);
    addText(slide, text, { left: 678, top, width: 560, height: 44 }, { fontSize: 22, color: index === 2 ? C.accentStrong : C.ink, bold: index === 2 });
  });
  addPanel(slide, { left: 42, top: 566, width: 1196, height: 70 }, C.accentPale, C.accent);
  addText(slide, "核心價值：專案已把規則、搜尋與網路邊界切開，具備繼續迭代的骨架。", { left: 68, top: 584, width: 1140, height: 38 }, { fontSize: 24, bold: true, alignment: "center" });
  setNotes(slide,
    "結尾回到開場：這不是已訓練完成的強棋力 AI，而是一個把關鍵模組串起來的可執行骨架。後續應先完成資料持久化和訓練迴圈，再談棋力、擴大棋盤或多人規則。",
    ["README.md", "src/Node.java", "src/TrainingData.java", "net.py"]);
}

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(OUTPUT_DIR, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(OUTPUT_DIR, `${stem}.layout.json`), await layout.text());
  }
  await writeBlob(path.join(OUTPUT_DIR, "deck-montage.webp"), await presentation.export({ format: "webp", montage: true, scale: 1 }));
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
  console.log(`Created ${FINAL_PPTX}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
