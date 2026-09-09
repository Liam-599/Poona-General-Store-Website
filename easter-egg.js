// easter-egg.js
// Listens for the Konami code (Up Up Down Down Left Right Left Right B A)
// and launches a simple "catch the groceries" mini-game overlay when entered.

(function () {
  const KONAMI_SEQUENCE = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight",
    "b", "a"
  ];

  let progress = 0;
  let gameOpen = false;

  document.addEventListener("keydown", (e) => {
    if (gameOpen) return; // don't intercept keys while the game itself is open

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const expected = KONAMI_SEQUENCE[progress];

    if (key === expected) {
      progress++;
      if (progress === KONAMI_SEQUENCE.length) {
        progress = 0;
        openGame();
      }
    } else {
      // Allow the sequence to restart correctly even if the wrong key
      // happens to match the very first expected key.
      progress = key === KONAMI_SEQUENCE[0] ? 1 : 0;
    }
  });

  function openGame() {
    gameOpen = true;

    const overlay = document.createElement("div");
    overlay.id = "konamiGameOverlay";
    overlay.innerHTML = `
      <style>
        #konamiGameOverlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(44, 30, 20, 0.85);
          display: flex; align-items: center; justify-content: center;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }
        #konamiGameBox {
          background: #fffaf1; border: 2px solid #6b4226; border-radius: 12px;
          padding: 20px; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
        #konamiGameBox h2 { margin: 0 0 4px; color: #4a2c19; font-family: Georgia, serif; }
        #konamiGameBox p { margin: 0 0 12px; color: #7a6a58; font-size: 0.9rem; }
        #konamiCanvas { background: #faf3e6; border: 1px solid #e3d5bd; border-radius: 8px; display: block; margin: 0 auto; }
        #konamiScoreLine { margin-top: 10px; font-weight: bold; color: #4a2c19; }
        #konamiCloseBtn {
          margin-top: 12px; background: #c1440e; color: #fff; border: none;
          border-radius: 8px; padding: 8px 18px; font-weight: 600; cursor: pointer;
        }
        #konamiCloseBtn:hover { background: #9c360b; }
      </style>
      <div id="konamiGameBox">
        <h2>Catch the Shopping!</h2>
        <p>Use ← and → to move the basket. Don't let items hit the floor.</p>
        <canvas id="konamiCanvas" width="360" height="420"></canvas>
        <div id="konamiScoreLine">Score: 0 &nbsp;|&nbsp; Lives: 3</div>
        <button id="konamiCloseBtn">Close (Esc)</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const canvas = document.getElementById("konamiCanvas");
    const ctx = canvas.getContext("2d");
    const scoreLine = document.getElementById("konamiScoreLine");
    const closeBtn = document.getElementById("konamiCloseBtn");

    const state = {
      basketX: 160,
      basketWidth: 70,
      basketSpeed: 6,
      moveLeft: false,
      moveRight: false,
      items: [],
      spawnTimer: 0,
      spawnInterval: 60,
      score: 0,
      lives: 3,
      running: true,
      frame: null
    };

    const ITEM_EMOJIS = ["🍞", "🥛", "🍎", "🧃", "🥕", "🧴"];

    function spawnItem() {
      state.items.push({
        x: 20 + Math.random() * (canvas.width - 40),
        y: -20,
        speed: 1.5 + Math.random() * 1.8,
        emoji: ITEM_EMOJIS[Math.floor(Math.random() * ITEM_EMOJIS.length)]
      });
    }

    function update() {
      if (!state.running) return;

      if (state.moveLeft) state.basketX -= state.basketSpeed;
      if (state.moveRight) state.basketX += state.basketSpeed;
      state.basketX = Math.max(0, Math.min(canvas.width - state.basketWidth, state.basketX));

      state.spawnTimer++;
      if (state.spawnTimer >= state.spawnInterval) {
        state.spawnTimer = 0;
        spawnItem();
        if (state.spawnInterval > 25) state.spawnInterval -= 1;
      }

      for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        item.y += item.speed;

        const caught =
          item.y >= 360 && item.y <= 395 &&
          item.x >= state.basketX - 10 && item.x <= state.basketX + state.basketWidth + 10;

        if (caught) {
          state.score += 10;
          state.items.splice(i, 1);
        } else if (item.y > canvas.height) {
          state.lives -= 1;
          state.items.splice(i, 1);
          if (state.lives <= 0) endGame();
        }
      }

      scoreLine.textContent = `Score: ${state.score} | Lives: ${Math.max(state.lives, 0)}`;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.font = "28px serif";
      state.items.forEach((item) => ctx.fillText(item.emoji, item.x, item.y));

      ctx.font = "36px serif";
      ctx.fillText("🧺", state.basketX, 400);

      if (!state.running) {
        ctx.fillStyle = "rgba(44,30,20,0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = "16px Georgia, serif";
        ctx.fillText(`Final score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.textAlign = "left";
      }
    }

    function loop() {
      update();
      draw();
      if (state.running) {
        state.frame = requestAnimationFrame(loop);
      }
    }

    function endGame() {
      state.running = false;
    }

    function handleKeydown(e) {
      if (e.key === "ArrowLeft") state.moveLeft = true;
      if (e.key === "ArrowRight") state.moveRight = true;
      if (e.key === "Escape") closeGame();
    }
    function handleKeyup(e) {
      if (e.key === "ArrowLeft") state.moveLeft = false;
      if (e.key === "ArrowRight") state.moveRight = false;
    }

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);

    function closeGame() {
      state.running = false;
      if (state.frame) cancelAnimationFrame(state.frame);
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
      overlay.remove();
      gameOpen = false;
    }

    closeBtn.addEventListener("click", closeGame);

    loop();
  }
})();
