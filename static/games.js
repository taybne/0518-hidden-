/* Deprecated legacy games asset retained for compatibility.
(() => {
  initialized: false,
  canvas: null,
  ctx: null,
  statusText: null,
  animationId: null,
  running: false,
  snake: [],
  direction: 'right',
  food: null,
  score: 0,
  gridSize: 20,
  gameOver: false,

  init(canvas, statusText) {
    this.canvas = canvas;
    this.statusText = statusText;
    if (!this.canvas || !this.statusText) {
      return;
    }
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.resizeCanvas();
    this.reset();
    this.initialized = true;
  },

  handleKey(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!this.running) {
        this.start();
      }
    } else if (this.running && !this.gameOver) {
      switch (e.code) {
        case 'ArrowUp':
          if (this.direction !== 'down') this.direction = 'up';
          break;
        case 'ArrowDown':
          if (this.direction !== 'up') this.direction = 'down';
          break;
        case 'ArrowLeft':
          if (this.direction !== 'right') this.direction = 'left';
          break;
        case 'ArrowRight':
          if (this.direction !== 'left') this.direction = 'right';
          break;
      }
    }
  },

  handleKeyUp() {
    // unused
  },

  handleMouse() {
    // unused
  },

  handleClick(x, y) {
    // unused
  },

  resizeCanvas() {
    if (!this.canvas) {
      return;
    }
    const size = Math.min(400, this.canvas.parentElement.getBoundingClientRect().width);
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.gridSize = Math.floor(size / 20);
    this.draw();
  },

  reset() {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = 'right';
    this.food = this.generateFood();
    this.score = 0;
    this.gameOver = false;
    this.running = false;
    this.updateStatus('Press Space to start Snake.');
    this.draw();
  },

  generateFood() {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 20),
      };
    } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
    return food;
  },

  update() {
    if (this.gameOver) return;

    const head = { ...this.snake[0] };
    switch (this.direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 ||
        this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver = true;
      this.updateStatus(`Game Over! Score: ${this.score}. Press Restart to play again.`);
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.food = this.generateFood();
    } else {
      this.snake.pop();
    }

    this.updateStatus(`Score: ${this.score}`);
  },

  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw snake
    this.ctx.fillStyle = '#22c55e';
    this.snake.forEach(segment => {
      this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
    });

    // Draw food
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
  },

  updateStatus(text) {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  },

  start() {
    if (!this.initialized) return;
    if (!this.running) {
      this.running = true;
      this.gameLoop();
    }
  },

  gameLoop() {
    if (!this.running) return;
    this.update();
    this.draw();
    if (!this.gameOver) {
      setTimeout(() => this.gameLoop(), 150);
    }
  },

  pause() {
    this.running = false;
  },

  resetGame() {
    this.reset();
  },
})();

window.ShapeFitGame = {
  initialized: false,
  canvas: null,
  ctx: null,
  statusText: null,
  trayElement: null,
  availablePieces: [],
  board: [],
  cols: 8,
  rows: 8,
  cellSize: 30,
  score: 0,
  gameOverFlag: false,
  usedPieces: new Set(),
  pieces: [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 0], [1, 0], [1, 1]],
    [[0, 1], [0, 1], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[1], [1], [1], [1]],
    [[1, 1, 1, 1, 1]],
    [[1, 0, 1], [1, 1, 1]],
    [[1, 1, 0], [1, 0, 0], [1, 0, 0]],
    [[0, 1, 1], [0, 0, 1], [0, 0, 1]],
    [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
    [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
    [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
    [[1, 0, 0, 0], [1, 1, 1, 1]],
  ],
  colors: ['#34d399', '#60a5fa', '#f472b6', '#f59e0b', '#8b5cf6', '#fb7185', '#22c55e', '#fbbf24', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#a855f7', '#10b981', '#3b82f6', '#f43f5e', '#eab308', '#8b5cf6'],
  draggingIndex: null,
  isDragging: false,
  dragPreview: null,
  traySetup: false,
  highlightCells: [],

  init(canvas, statusText, trayElement) {
    this.canvas = canvas;
    this.statusText = statusText;
    this.trayElement = trayElement;
    if (!this.canvas || !this.statusText || !this.trayElement) {
      return;
    }
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.resizeCanvas();
    this.reset();
    this.setupTray();
    this.previewX = 0;
    this.previewY = 0;
    this.initialized = true;
  },

  setupTray() {
    if (this.traySetup || !this.trayElement) {
      return;
    }
    this.traySetup = true;
    this.trayElement.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    this.trayElement.addEventListener('drop', (event) => {
      event.preventDefault();
    });
    this.canvas.addEventListener('dragover', (event) => {
      event.preventDefault();
      this.handleDragOver(event);
    });
    this.canvas.addEventListener('drop', (event) => {
      event.preventDefault();
      this.handleDrop(event);
    });
    document.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (this.dragPreview) {
        this.updateDragPosition(event.clientX, event.clientY);
      }
    });
    document.addEventListener('dragend', () => {
      if (this.dragPreview) {
        document.body.removeChild(this.dragPreview);
        this.dragPreview = null;
      }
    });
  },

  handleKey(e) {
    if (!this.initialized) {
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!this.running) {
        this.start();
      }
    }
  },

  handleKeyUp() {
    // unused
  },

  handleMouse(x) {
    // unused for placement mode
  },

  handleClick(x, y) {
    // unused for placement mode
  },

  resizeCanvas() {
    if (!this.canvas) {
      return;
    }
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.cellSize = Math.floor(rect.width / this.cols);
    this.canvas.width = this.cols * this.cellSize;
    this.canvas.height = this.rows * this.cellSize;
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;
    this.draw();
  },

  reset() {
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.score = 0;
    this.gameOverFlag = false;
    this.running = false;
    this.usedPieces.clear();
    this.availablePieces = [this.createPiece(), this.createPiece(), this.createPiece()];
    this.draggingIndex = null;
    this.isDragging = false;
    this.highlightCells = [];
    if (this.dragPreview) {
      document.body.removeChild(this.dragPreview);
      this.dragPreview = null;
    }
    this.updateStatus('Drag a shape from below onto the board.');
    this.renderTray();
    this.draw();
  },

  createPiece() {
    let availableIndices = [];
    for (let i = 0; i < this.pieces.length; i++) {
      if (!this.usedPieces.has(i)) {
        availableIndices.push(i);
      }
    }
    if (availableIndices.length === 0) {
      this.usedPieces.clear();
      availableIndices = Array.from({ length: this.pieces.length }, (_, i) => i);
    }
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const index = availableIndices[randomIndex];
    this.usedPieces.add(index);
    const shape = this.pieces[index].map((row) => row.slice());
    return {
      shape,
      color: this.colors[index],
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };
  },

  renderTray() {
    if (!this.trayElement) {
      return;
    }
    const trayItems = document.getElementById('shapeFitTrayItems');
    if (!trayItems) {
      return;
    }
    trayItems.innerHTML = '';
    this.availablePieces.forEach((piece, index) => {
      const item = document.createElement('div');
      item.className = 'shape-fit-piece';
      item.setAttribute('draggable', 'true');
      item.dataset.index = index.toString();
      const shapeGrid = document.createElement('div');
      shapeGrid.className = 'shape-fit-piece-grid';
      const previewCellSize = this.cellSize;
      shapeGrid.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, ${previewCellSize}px)`;
      piece.shape.forEach((row) => {
        row.forEach((cell) => {
          const cellEl = document.createElement('div');
          cellEl.className = 'shape-fit-cell';
          if (cell) {
            cellEl.classList.add('filled');
            cellEl.style.background = piece.color;
          }
          shapeGrid.appendChild(cellEl);
        });
      });
      item.appendChild(shapeGrid);
      item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', index.toString());
        this.draggingIndex = index;
        const canvas = document.createElement('canvas');
        const cellSize = this.cellSize;
        canvas.width = piece.shape[0].length * cellSize;
        canvas.height = piece.shape.length * cellSize;
        const ctx = canvas.getContext('2d');
        piece.shape.forEach((row, r) => {
          row.forEach((cell, c) => {
            if (cell) {
              ctx.fillStyle = piece.color;
              ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
          });
        });
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '10000';
        canvas.style.opacity = '0.95';
        this.dragPreview = canvas;
        document.body.appendChild(this.dragPreview);
        this.updateDragPosition(event.clientX, event.clientY);
        event.dataTransfer.setDragImage(new Image(), 0, 0);
        event.target.classList.add('dragging');
      });
      item.addEventListener('dragend', (event) => {
        event.target.classList.remove('dragging');
        if (this.dragPreview) {
          document.body.removeChild(this.dragPreview);
          this.dragPreview = null;
        }
        this.draggingIndex = null;
        this.highlightCells = [];
        this.draw();
      });
      // Touch events for mobile
      item.addEventListener('touchstart', (event) => {
        event.preventDefault();
        this.draggingIndex = index;
        this.isDragging = true;
        // Create drag image
        const piece = this.availablePieces[index];
        const canvas = document.createElement('canvas');
        const cellSize = this.cellSize;
        canvas.width = piece.shape[0].length * cellSize;
        canvas.height = piece.shape.length * cellSize;
        const ctx = canvas.getContext('2d');
        piece.shape.forEach((row, r) => {
          row.forEach((cell, c) => {
            if (cell) {
              ctx.fillStyle = piece.color;
              ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
          });
        });
        this.dragPreview = canvas;
        this.dragPreview.style.position = 'absolute';
        this.dragPreview.style.pointerEvents = 'none';
        this.dragPreview.style.zIndex = '10000';
        this.dragPreview.style.opacity = '0.95';
        document.body.appendChild(this.dragPreview);
        this.updateDragPosition(event.touches[0].clientX, event.touches[0].clientY);
      });
      item.addEventListener('touchmove', (event) => {
        event.preventDefault();
        if (this.isDragging) {
          this.updateDragPosition(event.touches[0].clientX, event.touches[0].clientY);
          // Highlight possible positions
          const rect = this.canvas.getBoundingClientRect();
          const x = event.touches[0].clientX - rect.left;
          const y = event.touches[0].clientY - rect.top;
          const boardX = Math.floor(x / this.cellSize);
          const boardY = Math.floor(y / this.cellSize);
          const piece = this.availablePieces[this.draggingIndex];
          if (piece && this.canPlace(piece, boardX, boardY)) {
            this.highlightCells = [];
            piece.shape.forEach((row, r) => {
              row.forEach((cell, c) => {
                if (cell) {
                  this.highlightCells.push([boardY + r, boardX + c]);
                }
              });
            });
            this.previewX = boardX;
            this.previewY = boardY;
          } else {
            this.highlightCells = [];
            this.previewX = -1;
            this.previewY = -1;
          }
          this.draw();
        }
      });
      item.addEventListener('touchend', (event) => {
        event.preventDefault();
        if (this.isDragging) {
          const touch = event.changedTouches[0];
          const rect = this.canvas.getBoundingClientRect();
          if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            const x = Math.floor((touch.clientX - rect.left) / this.cellSize);
            const y = Math.floor((touch.clientY - rect.top) / this.cellSize);
            this.placePieceAt(this.draggingIndex, x, y);
          }
          if (this.dragPreview) {
            document.body.removeChild(this.dragPreview);
            this.dragPreview = null;
          }
          this.isDragging = false;
          this.draggingIndex = null;
          this.highlightCells = [];
          this.previewX = -1;
          this.previewY = -1;
          this.draw();
        }
      });
      trayItems.appendChild(item);
    });
    this.trayElement.classList.add('visible');
  },

  start() {
    if (!this.initialized) {
      return;
    }
    if (!this.running) {
      this.running = true;
      this.updateStatus('Shape Fit active. Drag a piece onto the board.');
    }
  },

  pause() {
    this.running = false;
  },

  resetGame() {
    this.reset();
  },

  placePieceAt(pieceIndex, boardX, boardY) {
    const piece = this.availablePieces[pieceIndex];
    if (!piece || this.gameOverFlag) {
      return false;
    }
    if (!this.canPlace(piece, boardX, boardY)) {
      this.updateStatus('Cannot place shape there. Try another spot.');
      return false;
    }
    piece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          this.board[boardY + r][boardX + c] = piece.color;
        }
      });
    });
    this.availablePieces[pieceIndex] = this.createPiece();
    this.clearLines();
    this.renderTray();
    this.draw();
    this.updateStatus(`Score: ${this.score}. Keep placing pieces.`);
    return true;
  },

  updateDragPosition(x, y) {
    if (this.dragPreview) {
      this.dragPreview.style.left = (x - this.dragPreview.width / 2) + 'px';
      this.dragPreview.style.top = (y - this.dragPreview.height / 2) + 'px';
    }
  },

  handleDragOver(event) {
    if (this.draggingIndex === null) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const boardX = Math.floor(x / this.cellSize);
    const boardY = Math.floor(y / this.cellSize);
    const piece = this.availablePieces[this.draggingIndex];
    if (piece && this.canPlace(piece, boardX, boardY)) {
      this.highlightCells = [];
      piece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell) {
            this.highlightCells.push([boardY + r, boardX + c]);
          }
        });
      });
      this.previewX = boardX;
      this.previewY = boardY;
    } else {
      this.highlightCells = [];
      this.previewX = -1;
      this.previewY = -1;
    }
    this.draw();
  },

  handleDrop(event) {
    if (this.draggingIndex === null) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const boardX = Math.floor(x / this.cellSize);
    const boardY = Math.floor(y / this.cellSize);
    this.placePieceAt(this.draggingIndex, boardX, boardY);
    this.draggingIndex = null;
    this.highlightCells = [];
    this.previewX = -1;
    this.previewY = -1;
    this.draw();
  },

  canPlace(piece, boardX, boardY) {
    for (let row = 0; row < piece.shape.length; row += 1) {
      for (let col = 0; col < piece.shape[row].length; col += 1) {
        if (piece.shape[row][col]) {
          const x = boardX + col;
          const y = boardY + row;
          if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return false;
          }
          if (this.board[y][x]) {
            return false;
          }
        }
      }
    }
    return true;
  },

  clearLines() {
    let linesCleared = 0;
    const fullRows = [];
    const fullCols = [];
    for (let row = 0; row < this.rows; row += 1) {
      if (this.board[row].every((cell) => cell !== 0)) {
        fullRows.push(row);
      }
    }
    for (let col = 0; col < this.cols; col += 1) {
      let full = true;
      for (let row = 0; row < this.rows; row += 1) {
        if (!this.board[row][col]) {
          full = false;
          break;
        }
      }
      if (full) {
        fullCols.push(col);
      }
    }
    fullRows.forEach((row) => {
      this.board[row] = Array(this.cols).fill(0);
      linesCleared += 1;
    });
    fullCols.forEach((col) => {
      for (let row = 0; row < this.rows; row += 1) {
        this.board[row][col] = 0;
      }
      linesCleared += 1;
    });
    if (linesCleared) {
      this.score += linesCleared * 20;
      this.updateStatus(`Cleared ${linesCleared} line(s)! Score: ${this.score}`);
    }
  },

  updateStatus(text) {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  },

  drawBoard() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const cell = this.board[row][col];
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        this.ctx.fillStyle = cell || 'rgba(255,255,255,0.04)';
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
        if (!cell) {
          this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
        }
        // Highlight possible positions
        if (this.highlightCells.some(([hr, hc]) => hr === row && hc === col)) {
          this.ctx.fillStyle = 'rgba(0,255,0,0.3)';
          this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
        }
      }
    }
  },

  draw() {
    if (!this.ctx || !this.canvas) {
      return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBoard();
    this.drawPreview();
  },

  drawPreview() {
    if (this.draggingIndex === null || this.previewX < 0 || !this.availablePieces[this.draggingIndex]) return;
    const piece = this.availablePieces[this.draggingIndex];
    this.ctx.save();
    this.ctx.globalAlpha = 0.7;
    piece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const x = (this.previewX + c) * this.cellSize;
          const y = (this.previewY + r) * this.cellSize;
          this.ctx.fillStyle = piece.color;
          this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
        }
      });
    });
    this.ctx.restore();
  },
};
*/

window.MemoryGame = {
  initialized: false,
  canvas: null,
  ctx: null,
  statusText: null,
  running: false,
  size: 4,
  cellSize: 70,
  cards: [],
  flipped: [],
  matched: [],
  moves: 0,
  symbols: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],

  init(canvas, statusText) {
    this.canvas = canvas;
    this.statusText = statusText;
    if (!this.canvas || !this.statusText) {
      return;
    }
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.resizeCanvas();
    this.reset();
    this.initialized = true;
  },

  handleKey(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!this.running) {
        this.start();
      }
    }
  },

  handleKeyUp() {
    // unused
  },

  handleMouse() {
    // unused
  },

  handleClick(x, y) {
    if (!this.running) return;
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    if (col >= 0 && col < this.size && row >= 0 && row < this.size) {
      const index = row * this.size + col;
      if (!this.flipped.includes(index) && !this.matched.includes(index)) {
        this.flipCard(index);
      }
    }
  },

  resizeCanvas() {
    if (!this.canvas) return;
    const containerWidth = this.canvas.parentElement.getBoundingClientRect().width;
    this.cellSize = Math.floor(containerWidth / this.size);
    this.canvas.width = this.size * this.cellSize;
    this.canvas.height = this.size * this.cellSize;
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;
    this.draw();
  },

  reset() {
    this.cards = [];
    const pairs = this.symbols.concat(this.symbols);
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    this.cards = pairs;
    this.flipped = [];
    this.matched = [];
    this.moves = 0;
    this.running = false;
    this.updateStatus('Press Space to start Memory Game. Find matching pairs.');
    this.draw();
  },

  flipCard(index) {
    this.flipped.push(index);
    if (this.flipped.length === 2) {
      this.moves++;
      const [first, second] = this.flipped;
      if (this.cards[first] === this.cards[second]) {
        this.matched.push(first, second);
        this.flipped = [];
        if (this.matched.length === this.cards.length) {
          this.updateStatus(`Won in ${this.moves} moves! Press Restart to play again.`);
          this.running = false;
        } else {
          this.updateStatus(`Match! Moves: ${this.moves}`);
        }
      } else {
        setTimeout(() => {
          this.flipped = [];
          this.updateStatus(`No match. Moves: ${this.moves}`);
          this.draw();
        }, 1000);
      }
    } else {
      this.updateStatus(`Flipped 1 card. Moves: ${this.moves}`);
    }
    this.draw();
  },

  updateStatus(text) {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  },

  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const index = row * this.size + col;
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        const isFlipped = this.flipped.includes(index) || this.matched.includes(index);
        this.ctx.fillStyle = isFlipped ? '#34d399' : '#6b7280';
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
        this.ctx.strokeStyle = '#ffffff30';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
        if (isFlipped) {
          this.ctx.fillStyle = '#fff';
          this.ctx.font = `${this.cellSize * 0.6}px sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(this.cards[index], x + this.cellSize / 2, y + this.cellSize / 2);
        }
      }
    }
  },

  start() {
    if (!this.initialized) return;
    this.running = true;
    this.updateStatus('Memory Game active. Click cards to flip.');
  },

  pause() {
    this.running = false;
  },

  resetGame() {
    this.reset();
  },
};

window.GameManager = {
  initialized: false,
  canvas: null,
  statusText: null,
  gameTitle: null,
  gameDesc: null,
  resetButton: null,
  tabs: null,
  currentGame: null,
  currentKey: 'lightsOut',
  games: {
    lightsOut: window.SnakeGame,
    shapeFit: window.ShapeFitGame,
    swapLogic: window.MemoryGame,
  },
  config: {
    lightsOut: {
      title: 'Snake',
      desc: 'Control the snake to eat food and grow. Avoid walls and yourself.',
    },
    shapeFit: {
      title: 'Shape Fit',
      desc: 'Drag and fit pieces into the grid to clear lines.',
    },
    swapLogic: {
      title: 'Memory Game',
      desc: 'Flip cards to find matching pairs of animals.',
    },
  },

  init() {
    if (this.initialized) {
      return;
    }
    this.canvas = document.getElementById('gameCanvas');
    this.statusText = document.getElementById('gameStatus');
    this.gameTitle = document.getElementById('gameTitle');
    this.gameDesc = document.getElementById('gameDesc');
    this.resetButton = document.getElementById('resetGameBtn');
    this.tabs = document.querySelectorAll('.game-tab');
    this.trayElement = document.getElementById('shapeFitTray');
    if (!this.canvas || !this.statusText || !this.gameTitle || !this.resetButton) {
      return;
    }

    this.tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectGame(btn.dataset.game);
        this.start();
      });
    });

    window.addEventListener('keydown', (event) => {
      if (this.currentGame && this.currentGame.handleKey) {
        this.currentGame.handleKey(event);
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener('keyup', (event) => {
      if (this.currentGame && this.currentGame.handleKeyUp) {
        this.currentGame.handleKeyUp(event);
      }
    });

    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      if (this.currentGame && this.currentGame.handleMouse) {
        this.currentGame.handleMouse(event.clientX - rect.left, event.clientY - rect.top);
      }
    });

    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      if (this.currentGame && this.currentGame.handleClick) {
        this.currentGame.handleClick(event.clientX - rect.left, event.clientY - rect.top);
      }
    });

    this.canvas.addEventListener('dragover', (event) => {
      if (this.currentKey === 'shapeFit') {
        event.preventDefault();
      }
    });

    this.canvas.addEventListener('drop', (event) => {
      event.preventDefault();
      if (this.currentKey !== 'shapeFit' || !this.currentGame) {
        return;
      }
      const data = event.dataTransfer.getData('text/plain');
      const pieceIndex = Number(data);
      if (Number.isNaN(pieceIndex)) {
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / this.currentGame.cellSize);
      const y = Math.floor((event.clientY - rect.top) / this.currentGame.cellSize);
      this.currentGame.placePieceAt(pieceIndex, x, y);
    });

    this.resetButton.onclick = () => this.reset();
    this.selectGame(this.currentKey);
    this.initialized = true;
  },

  selectGame(key) {
    if (!this.games[key]) {
      return;
    }
    this.currentKey = key;
    this.tabs.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.game === key);
    });
    const config = this.config[key];
    if (config) {
      this.gameTitle.textContent = config.title;
      this.gameDesc.textContent = config.desc;
    }
    if (this.currentGame && this.currentGame.pause) {
      this.currentGame.pause();
    }
    this.currentGame = this.games[key];
    if (this.canvas) {
      this.canvas.style.width = '';
      this.canvas.style.height = '';
    }
    if (this.currentGame.init) {
      this.currentGame.init(this.canvas, this.statusText, this.trayElement);
    }
    if (this.trayElement) {
      this.trayElement.classList.toggle('visible', key === 'shapeFit');
    }
  },

  start() {
    if (this.currentGame && this.currentGame.start) {
      this.currentGame.start();
    }
  },

  pause() {
    if (this.currentGame && this.currentGame.pause) {
      this.currentGame.pause();
    }
  },

  reset() {
    if (this.currentGame && this.currentGame.reset) {
      this.currentGame.reset();
    }
  },
};
*/
