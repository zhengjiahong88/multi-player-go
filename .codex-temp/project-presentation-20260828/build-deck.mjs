import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const WIDTH = 1280;
const HEIGHT = 720;
const OUTPUT_DIR = path.join(process.env.TEMP, "codex-project-presentation-edit-20260829");
const FINAL_PPTX = path.join(OUTPUT_DIR, "多人圍棋AI專案講解_舒適配色版.pptx");

const C = {
  canvas: "#E3D3C4",
  ink: "#211710",
  muted: "#5F4635",
  panel: "#F0DDC7",
  panel2: "#FFF8F1",
  rule: "#6B4A33",
  accent: "#D89A62",
  accentStrong: "#8F3F00",
  accentPale: "#F2D8C1",
  danger: "#8A2E24",
};

const presentation = Presentation.create({ slideSize: { width: WIDTH, height: HEIGHT } });

function mixedRuns(text) {
  const runs = [];
  for (const character of String(text)) {
    const typeface = /[0-9]/.test(character)
      ? "Georgia"
      : /[A-Za-z]/.test(character) || /[\x00-\x7F]/.test(character)
        ? "Courier New"
        : "DFKai-SB";
    const previous = runs.at(-1);
    if (previous?.textStyle?.typeface === typeface) previous.run += character;
    else runs.push({ run: character, textStyle: { typeface } });
  }
  return runs;
}

function addText(slide, text, position, style = {}, name = undefined) {
  const box = slide.shapes.add({
    geometry: "textbox",
    name,
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = mixedRuns(text);
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

function addTitle(slide, title, number, fontSize = 46) {
  addText(slide, title, { left: 42, top: 34, width: 1120, height: 66 }, { fontSize, bold: true }, `slide-${number}-title`);
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
  box.text = mixedRuns(label);
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
      fill: stone.player === 1 ? C.ink : "#FFFFFF",
      line: { style: "solid", fill: C.ink, width: 2 },
    });
  }
}

function addGlossarySlide(title, number, rows) {
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, title, number, 40);
  const columns = [
    { left: 42, width: 230, label: "專有名詞" },
    { left: 272, width: 340, label: "白話意思" },
    { left: 612, width: 626, label: "在這個專案裡是什麼" },
  ];
  columns.forEach(column => {
    addPanel(slide, { left: column.left, top: 150, width: column.width, height: 42 }, "#1C1C1C", "#1C1C1C");
    addText(slide, column.label, { left: column.left + 14, top: 158, width: column.width - 28, height: 26 }, { fontSize: 18, bold: true, color: "#FFFFFF", verticalAlignment: "middle" });
  });
  const rowHeight = Math.min(56, 432 / rows.length);
  rows.forEach((row, index) => {
    const top = 192 + index * rowHeight;
    const fill = index % 2 === 0 ? C.panel2 : C.panel;
    addPanel(slide, { left: 42, top, width: 1196, height: rowHeight }, fill, C.rule);
    addText(slide, row[0], { left: 56, top: top + 6, width: 202, height: rowHeight - 12 }, { fontSize: 18, bold: true, verticalAlignment: "middle" });
    addText(slide, row[1], { left: 286, top: top + 6, width: 312, height: rowHeight - 12 }, { fontSize: 17, verticalAlignment: "middle" });
    addText(slide, row[2], { left: 626, top: top + 6, width: 598, height: rowHeight - 12 }, { fontSize: 16, color: C.muted, verticalAlignment: "middle" });
  });
  setNotes(slide, "本頁為附錄名詞速查，報告時不主動講解；若聽眾對相關名詞有疑問，再回到本頁說明。", ["user-provided pasted-text.txt"]);
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

const appendGlossarySlides = () => {
addGlossarySlide("名詞速查：棋局與資料表示", 13, [
  ["Board", "一個棋局狀態", "記錄棋盤上的棋子、輪到誰等"],
  ["State", "給神經網路看的棋盤資料", "double[player][row][col]"],
  ["Action", "AI 可以選的一個動作", "某個落子位置，或 Pass"],
  ["Legal Move", "現在規則允許的動作", "排除已有棋子、自殺、Ko 等"],
  ["Pass", "這一手不下棋", "pos == null"],
  ["Tensor", "神經網路使用的多維陣列", "例如目前 state 是 2 × 4 × 4"],
  ["Channel", "Tensor 中的一層資料", "目前一個玩家一個 channel"],
]);

addGlossarySlide("名詞速查：搜尋樹結構", 14, [
  ["Node", "搜尋樹中的一個棋局", "一個 Node 對應一個 Board"],
  ["Root", "搜尋樹最上面的節點", "現在真正要決定下一手的局面"],
  ["Parent", "上一個節點", "這個局面是從哪個局面走來的"],
  ["Child", "下一步可能形成的節點", "每一個合法動作建立一個 child"],
  ["Leaf", "搜尋目前走到最底端的節點", "還沒有 children、準備被展開"],
  ["MCTS", "用很多次嘗試判斷哪一步較好", "Monte Carlo Tree Search"],
  ["Simulation", "一次完整的 MCTS 搜尋迭代", "Selection → Expansion／Evaluation → Backpropagation；不是 random rollout"],
  ["Visits", "一個節點被搜尋經過多少次", "visits 越高，代表 MCTS 越常走這裡"],
]);

addGlossarySlide("名詞速查：MCTS 搜尋流程", 15, [
  ["Selection", "從 root 一路挑值得搜尋的路", "不斷選 UCB／PUCT 最大的 child"],
  ["Expansion", "把新的可能走法加進搜尋樹", "找合法步、建立 children"],
  ["Evaluation", "判斷 leaf 目前有多好", "這個版本使用 Net 的 Value"],
  ["Random Rollout", "傳統 MCTS 從 leaf 隨便下到終局", "這個版本把它換成 Value Network"],
  ["Backpropagation", "把剛得到的評價往回傳", "leaf → parent → … → root"],
  ["UCB / PUCT", "Selection 決定下一個搜尋 child 的分數", "同時考慮目前評價與探索；這個版本還加入 prior"],
  ["Q", "某個 child 目前平均看起來有多好", "約等於 valueSum / visits"],
  ["valueSum", "很多次 Value 累積起來的總和", "valueSum / visits 得到平均 Value"],
]);

addGlossarySlide("名詞速查：Policy 與 Value", 16, [
  ["Policy", "Net 對各種動作的初步偏好", "一整組 action 的輸出"],
  ["Logit", "Policy 變成機率前的原始分數", "可以是負數，也不需要加總為 1"],
  ["Softmax", "把 logits 變成機率的方法", "每個值 ≥ 0，而且總和 = 1"],
  ["Prior", "某個 child 對應的 Policy 機率", "child.prior，之後 Selection 會使用"],
  ["Value", "Net 覺得目前局面對各玩家有多好", "Python Net 回傳的 value[]"],
  ["P", "Policy 給這個動作的初始偏好", "也就是 prior"],
  ["N", "parent 被拜訪幾次", "parent.visits"],
  ["n", "child 被拜訪幾次", "child.visits"],
]);

addGlossarySlide("名詞速查：從搜尋到訓練與介接", 17, [
  ["π（pi）", "MCTS 搜尋完後得到的策略", "child.visits / 所有 children visits"],
  ["Policy vs π", "一個是搜尋前、一個是搜尋後", "Policy → MCTS → π"],
  ["Self-play", "AI 自己和自己下棋", "用目前 Net + MCTS 不斷產生棋局"],
  ["z", "一盤棋真正結束後的結果", "目前暫時使用各玩家最終得分比例"],
  ["Training Data", "之後拿來訓練 Net 的資料", "(state, π, z)"],
  ["Policy Head", "Net 負責下一步怎麼走的輸出部分", "輸出 ACTION_SIZE 個 logits"],
  ["Value Head", "Net 負責局面好不好的輸出部分", "輸出各玩家 Value"],
  ["Inference", "只讓 Net 做預測，不訓練", "Java 傳 state 給 Python，拿回 policy／value"],
  ["stdin / stdout", "Java 與 Python 傳文字資料的管道", "Java 寫 stdin，Python 從 stdout 回傳結果"],
]);
};

// 2 — Scope
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "這個原型已串起完整決策鏈，但尚未完成學習迴圈", 2);
  const items = [
    ["規則層", "落子、Pass、提子、合法步、終局與計分"],
    ["搜尋層", "Selection、Expansion、Evaluation、Backpropagation 與 π"],
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

// 3 — Overall flow
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "MCTS 搜尋時，Java 會反覆呼叫 Python 神經網路評估局面", 3, 38);
  const stages = [
    ["棋盤規則", "合法步"],
    ["MCTS\n搜尋", "多次\nsimulation"],
    ["Net\n評估", "policy\n+ value"],
    ["選下一手", "visits → π"],
    ["終局", "連續\nPass"],
    ["training data", "state\nπ／z"],
  ];
  stages.forEach(([title, body], index) => {
    const left = 42 + index * 200;
    addPanel(slide, { left, top: 238, width: 166, height: 180 }, index === 2 ? C.accentPale : C.panel2, C.rule);
    addText(slide, title, { left: left + 8, top: 264, width: 150, height: 62 }, { fontSize: index === 5 ? 18 : 24, bold: true, alignment: "center" });
    addText(slide, body, { left: left + 18, top: index === 5 ? 338 : 332, width: 130, height: 62 }, { fontSize: 17, color: C.muted, alignment: "center" });
    if (index < stages.length - 1) addArrow(slide, "→", { left: left + 166, top: 292, width: 34, height: 64 });
  });
  addPanel(slide, { left: 42, top: 496, width: 1196, height: 92 }, C.panel, C.panel);
  addText(slide, "重點：一次真正落子前，會先執行許多次 MCTS simulation；每次展開未終局 leaf 時，會呼叫 Net。", { left: 70, top: 518, width: 1140, height: 52 }, { fontSize: 23, bold: true, alignment: "center" });
  setNotes(slide,
    "先用整體流程建立心智模型。不要把 Java 與 Python 的技術邊界講得太早；此處只強調一次落子之前會重複許多次 simulation。展開未終局 leaf 時會要求 Net 評估；終局 leaf 則直接使用 board.getZ()。",
    ["src/Main.java", "src/Node.java", "src/PythonNet.java", "net.py"]);
}

// 4 — Board representation
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Board：棋盤規則與神經網路輸入表示", 4);
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
  addText(slide, "2 × 4 × 4", { left: 1020, top: 310, width: 206, height: 46 }, { fontSize: 30, bold: true, color: C.accentStrong, alignment: "center" });
  addText(slide, "channels × rows × cols", { left: 1024, top: 380, width: 198, height: 54 }, { fontSize: 18, color: C.muted, alignment: "center" });
  addPanel(slide, { left: 530, top: 552, width: 708, height: 76 }, C.panel, C.panel);
  addText(slide, "目前 state 僅編碼棋子位置，尚未加入目前行棋玩家。", { left: 554, top: 571, width: 660, height: 38 }, { fontSize: 20, bold: true, alignment: "center" });
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

// 6 — AlphaZero-style MCTS overview
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "我把傳統 MCTS 改成 AlphaZero 式搜尋", 6);
  addRule(slide, { left: 72, top: 272, width: 1136, height: 0 }, C.ink, 2);
  const items = [
    ["01", "Selection", "用 UCB + prior\n選路徑"],
    ["02", "Expansion", "呼叫 Net，取得\npolicy 與 value"],
    ["03", "Evaluation", "用 value 取代\nrandom rollout"],
    ["04", "Backpropagation", "把 value\n傳回 root"],
  ];
  const lefts = [74, 360, 646, 932];
  items.forEach(([label, title, body], index) => {
    const left = lefts[index];
    slide.shapes.add({ geometry: "ellipse", position: { left: left - 7, top: 262, width: 20, height: 20 }, fill: C.accentStrong, line: { style: "solid", fill: C.accentStrong, width: 0 } });
    addText(slide, `${label}  ${title}`, { left, top: 326, width: 258, height: 48 }, { fontSize: 25, bold: true });
    addText(slide, body, { left, top: 388, width: 250, height: 88 }, { fontSize: 20, color: C.muted });
  });
  addPanel(slide, { left: 72, top: 520, width: 1136, height: 86 }, C.panel, C.panel);
  addText(slide, "搜尋結束：visits 轉成 π，再依 π 選下一手", { left: 104, top: 542, width: 1072, height: 46 }, { fontSize: 28, bold: true, alignment: "center" });
  setNotes(slide,
    "這頁是簡報核心，也是後續第 7～10 頁的目錄。傳統 MCTS 常用 random rollout 評估 leaf；本專案改由 Net 同時提供 policy 與 value。口頭補充：Policy 用來建立 prior，Value 則取代 rollout 的結果。四步會在一次真正落子前重複 10000 次，最後才把 visits 正規化為 π 並抽樣下一手。",
    ["README.md", "src/Node.java"]);
}

// 7 — Selection
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Selection 在已知價值與探索之間取得平衡", 7);
  addPanel(slide, { left: 42, top: 188, width: 610, height: 300 }, C.panel, C.panel);
  addText(slide, "加入 Policy prior 的 UCB／PUCT 形式", { left: 70, top: 214, width: 556, height: 38 }, { fontSize: 24, bold: true, alignment: "center" });
  addText(slide, "UCB = Q + 1.4 × P × √N / (1 + n)", { left: 70, top: 286, width: 556, height: 86 }, { fontSize: 38, bold: true, alignment: "center", verticalAlignment: "middle" });
  addText(slide, "程式中 Q 使用 parent 當前玩家對應的 valueSum / visits", { left: 70, top: 394, width: 556, height: 54 }, { fontSize: 20, color: C.muted, alignment: "center" });
  const explanations = [
    ["Q", "平均價值", "走過的結果是否好"],
    ["P", "（prior）", "Expansion 時由 Policy\n給每個動作的初始偏好"],
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
    "這是加入 Policy prior 的 UCB／PUCT 形式。把公式拆成兩半：Q 是 exploitation，偏向已知表現好的步；其餘項是 exploration，利用神經網路 prior 與 visit 比例讓搜尋保持廣度。這裡 value 是每位玩家一個分量，因此 Q 會取 parent.board.player 對應的值。",
    ["src/Node.java"]);
}

// 8 — Expansion
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Expansion：Policy 產生 prior", 8, 42);
  const items = [
    ["① 網路推論", "evaluate(state) 取得 policy logits"],
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
    "這頁只聚焦 policy 如何變成 prior。policy head 輸出 logits；Java 端以 mask 排除非法步，再做穩定 softmax。moveIndex(null) 回傳 POINTS，因此 Pass 落在最後一格。value 的用途留到下一頁說明。",
    ["src/Node.java", "src/Board.java", "src/Main.java", "net.py"]);
}

// 9 — Value evaluation
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Evaluation：Value 取代 Random Rollout", 9);
  addText(slide, "傳統 MCTS", { left: 42, top: 176, width: 520, height: 48 }, { fontSize: 30, bold: true });
  addPanel(slide, { left: 42, top: 236, width: 540, height: 264 }, C.panel2, C.rule);
  addText(slide, "Random Rollout", { left: 72, top: 274, width: 480, height: 44 }, { fontSize: 30, bold: true });
  addText(slide, "從 leaf 隨機下到終局\n再用終局結果估計局面價值", { left: 72, top: 344, width: 470, height: 100 }, { fontSize: 23, color: C.muted });
  addText(slide, "本專案", { left: 676, top: 176, width: 520, height: 48 }, { fontSize: 30, bold: true });
  addPanel(slide, { left: 676, top: 236, width: 562, height: 264 }, C.accentPale, C.rule);
  addText(slide, "Value Head", { left: 706, top: 274, width: 500, height: 44 }, { fontSize: 30, bold: true });
  addText(slide, "Net 直接輸出每位玩家的 value\nNode.expansion() 將它回傳給搜尋樹", { left: 706, top: 344, width: 500, height: 100 }, { fontSize: 23, color: C.muted });
  addPanel(slide, { left: 42, top: 548, width: 1196, height: 68 }, C.panel, C.panel);
  addText(slide, "終局 leaf：board.getZ()　｜　未終局 leaf：result.value()", { left: 70, top: 565, width: 1140, height: 38 }, { fontSize: 24, bold: true, alignment: "center" });
  setNotes(slide,
    "這頁補上 AlphaZero 式搜尋與傳統 MCTS 的關鍵差異。傳統做法可用 random rollout 估值；這份程式在未終局 leaf 呼叫 Net，直接取得每位玩家的 value。若 leaf 已終局，則直接使用 board.getZ()。",
    ["src/Node.java", "src/Board.java", "net.py"]);
}

// 10 — Backpropagation and pi
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Backpropagation：value 回傳，visits 轉成 π", 10, 38);
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
  addPanel(slide, { left: 80, top: 516, width: 680, height: 98 }, C.panel, C.panel);
  addPanel(slide, { left: 780, top: 516, width: 400, height: 98 }, C.panel, C.panel);
  addText(slide, "① 產生 π", { left: 110, top: 530, width: 620, height: 30 }, { fontSize: 22, bold: true });
  addText(slide, "π(action) = child.visits / Σ children.visits", { left: 110, top: 566, width: 620, height: 30 }, { fontSize: 21, bold: true });
  addText(slide, "② 依 π 選下一手", { left: 810, top: 530, width: 340, height: 30 }, { fontSize: 22, color: C.accentStrong, bold: true, alignment: "center" });
  addText(slide, "依 π 隨機抽樣", { left: 810, top: 566, width: 340, height: 30 }, { fontSize: 20, color: C.muted, alignment: "center" });
  setNotes(slide,
    "leaf 的 value 是每位玩家一個分量，因此沿 parent chain 回傳時會把整個向量累加。完成所有 simulation 後，根節點的 child visits 分布形成 π；程式用 Math.random 依 π 抽樣下一手。",
    ["src/Node.java", "src/NetResult.java"]);
}

// 11 — Java / Python bridge
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "Java ↔ PythonNet ↔ PyTorch", 11);
  addFlowBox(slide, "Java / Node", "建立 state\n在 Expansion 要求評估", { left: 94, top: 210, width: 280, height: 220 });
  addArrow(slide, "⇄", { left: 386, top: 280, width: 80, height: 70 });
  addFlowBox(slide, "PythonNet", "長駐子程序\nstdin / stdout 文字協定", { left: 478, top: 210, width: 310, height: 220 }, C.accentPale);
  addArrow(slide, "⇄", { left: 800, top: 280, width: 80, height: 70 });
  addFlowBox(slide, "PyTorch Net", "Conv body\npolicy head + value head", { left: 892, top: 210, width: 294, height: 220 });
  addRule(slide, { left: 42, top: 490, width: 1196, height: 0 }, C.rule, 1);
  addText(slide, "輸入", { left: 42, top: 530, width: 88, height: 36 }, { fontSize: 24, bold: true });
  addText(slide, "一行攤平 state", { left: 140, top: 528, width: 320, height: 40 }, { fontSize: 22, color: C.muted });
  addText(slide, "輸出", { left: 520, top: 530, width: 88, height: 36 }, { fontSize: 24, bold: true });
  addText(slide, "第 1 行 policy logits；第 2 行 value", { left: 618, top: 528, width: 560, height: 40 }, { fontSize: 22, color: C.muted });
  setNotes(slide,
    "等觀眾理解 MCTS 後，再解釋技術邊界。PythonNet 用 ProcessBuilder 啟動 net.py 並保持程序長駐；Java 傳一行 state，Python 回兩行結果。evaluate 是 synchronized，避免同一個通道同時處理多筆推論。",
    ["src/PythonNet.java", "src/Main.java", "src/Node.java", "net.py"]);
}

// 12 — Training data and next step
{
  const slide = presentation.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "state、π、z 串起搜尋結果與下一輪訓練", 12);
  const items = [
    ["state", "棋盤輸入", "double[player][row][col]\n描述當下棋子位置"],
    ["π", "搜尋目標", "double[action]\n由 child visits 正規化"],
    ["z", "終局結果", "double[player]\n目前暫以各玩家\n得分比例表示"],
  ];
  const lefts = [42, 440, 838];
  items.forEach(([symbol, title, body], index) => {
    const left = lefts[index];
    addText(slide, symbol, { left, top: 172, width: 330, height: 76 }, { fontSize: 56, bold: true, color: index === 1 ? C.accentStrong : C.ink });
    addText(slide, title, { left, top: 260, width: 330, height: 42 }, { fontSize: 28, bold: true });
    addRule(slide, { left, top: 316, width: 330, height: 0 }, C.rule, 1);
    addText(slide, body, { left, top: 342, width: 330, height: 96 }, { fontSize: 21, color: C.muted });
  });
  addPanel(slide, { left: 42, top: 486, width: 1196, height: 122 }, C.panel, C.panel);
  addText(slide, "下一步", { left: 72, top: 510, width: 160, height: 42 }, { fontSize: 28, bold: true });
  addText(slide, "保存 TrainingData → 訓練 policy / value → 建立自我對弈與評估迴圈", { left: 240, top: 510, width: 940, height: 72 }, { fontSize: 23, bold: true, verticalAlignment: "middle" });
  setNotes(slide,
    "最後把搜尋與訓練接起來：state 是輸入，π 教 policy head 模仿搜尋分布，z 教 value head 預測終局。現況是 createTrainingData() 只建立記憶體中的 ArrayList 並印出數量；下一步才是保存資料與實作反覆訓練。\n\n以上是目前專案已完成的部分。接下來才會把 (state, π, z) 真正拿去訓練 Net，完成 Self-play → Training → 再 Self-play 的學習迴圈。",
    ["src/Node.java", "src/TrainingData.java", "src/Board.java", "net.py"]);
}

appendGlossarySlides();

async function writeBlob(filePath, blob) {
  if (typeof blob.save === "function") {
    await blob.save(filePath);
    return;
  }
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
