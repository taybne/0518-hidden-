(() => {
  const GRID_COLS = 20;
  const GRID_ROWS = 20;
  const SNAKE_TICK_MS = 140;
  const RAT_DEN_ROUND_SECONDS = 30;
  const INITIAL_DIRECTION = 'right';
  const DIRECTION_VECTORS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const OPPOSITES = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };
  const BLOCK_SIZE = 8;
  const BLOCK_SHAPES = [
    [[1]],
    [[1, 1]],
    [[1], [1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1]],
    [[1], [1], [1]],
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    [[1, 0], [1, 1]],
    [[0, 1], [1, 1]],
    [[1, 1], [1, 0]],
    [[1, 1], [0, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
  ];
  const SUDOKU_PUZZLE = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];
  const SUDOKU_SOLUTION = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ];

  function positionsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function createInitialSnake() {
    return [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
  }

  function getRandomEmptyCell(snake, randomFn = Math.random) {
    const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
    const available = [];

    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLS; x += 1) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y });
        }
      }
    }

    if (!available.length) {
      return null;
    }

    return available[Math.floor(randomFn() * available.length)];
  }

  function createSnakeState(randomFn = Math.random) {
    const snake = createInitialSnake();
    return {
      snake,
      direction: INITIAL_DIRECTION,
      queuedDirection: INITIAL_DIRECTION,
      food: getRandomEmptyCell(snake, randomFn),
      score: 0,
      started: false,
      paused: true,
      gameOver: false,
      status: 'Press Start or use arrow keys / WASD to begin.',
    };
  }

  function queueSnakeDirection(state, nextDirection) {
    if (!DIRECTION_VECTORS[nextDirection]) {
      return state;
    }

    const activeDirection = state.started ? state.queuedDirection : state.direction;
    if (OPPOSITES[activeDirection] === nextDirection) {
      return state;
    }

    return {
      ...state,
      queuedDirection: nextDirection,
      started: true,
      paused: false,
      status: `Score: ${state.score}`,
    };
  }

  function stepSnakeState(state, randomFn = Math.random) {
    if (state.paused || state.gameOver) {
      return state;
    }

    const direction = state.queuedDirection;
    const vector = DIRECTION_VECTORS[direction];
    const nextHead = {
      x: state.snake[0].x + vector.x,
      y: state.snake[0].y + vector.y,
    };
    const eatsFood = state.food && positionsEqual(nextHead, state.food);
    const bodyToCheck = eatsFood ? state.snake : state.snake.slice(0, -1);
    const hitWall =
      nextHead.x < 0 ||
      nextHead.x >= GRID_COLS ||
      nextHead.y < 0 ||
      nextHead.y >= GRID_ROWS;
    const hitSelf = bodyToCheck.some((segment) => positionsEqual(segment, nextHead));

    if (hitWall || hitSelf) {
      return {
        ...state,
        direction,
        queuedDirection: direction,
        paused: true,
        gameOver: true,
        started: true,
        status: `Game over. Final score: ${state.score}. Press Restart to try again.`,
      };
    }

    const nextSnake = [nextHead, ...state.snake];
    if (!eatsFood) {
      nextSnake.pop();
    }

    const nextScore = eatsFood ? state.score + 1 : state.score;
    return {
      ...state,
      snake: nextSnake,
      direction,
      queuedDirection: direction,
      food: eatsFood ? getRandomEmptyCell(nextSnake, randomFn) : state.food,
      score: nextScore,
      paused: false,
      gameOver: false,
      started: true,
      status: `Score: ${nextScore}`,
    };
  }

  function drawSnake(ctx, canvas, state) {
    const cellSize = canvas.width / GRID_COLS;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let col = 0; col <= GRID_COLS; col += 1) {
      const x = Math.round(col * cellSize) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let row = 0; row <= GRID_ROWS; row += 1) {
      const y = Math.round(row * cellSize) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (state.food) {
      ctx.fillStyle = '#ffb6d9';
      ctx.fillRect(
        state.food.x * cellSize + 3,
        state.food.y * cellSize + 3,
        cellSize - 6,
        cellSize - 6,
      );
    }

    state.snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#ffffff' : '#d1d5db';
      ctx.fillRect(
        segment.x * cellSize + 2,
        segment.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4,
      );
    });
  }

  function cloneBlockBoard(board) {
    return board.map((row) => row.slice());
  }

  function createEmptyBlockBoard() {
    return Array.from({ length: BLOCK_SIZE }, () => Array(BLOCK_SIZE).fill(0));
  }

  function createBlockPiece(index, randomFn = Math.random) {
    const shape = BLOCK_SHAPES[Math.floor(randomFn() * BLOCK_SHAPES.length)];
    return {
      id: `piece-${index}-${Math.random().toString(16).slice(2, 8)}`,
      shape: shape.map((row) => row.slice()),
    };
  }

  function createBlockState(randomFn = Math.random) {
    const pieces = [0, 1, 2].map((index) => createBlockPiece(index, randomFn));
    return {
      board: createEmptyBlockBoard(),
      pieces,
      selectedPieceId: pieces[0].id,
      draggingPieceId: null,
      preview: null,
      score: 0,
      gameOver: false,
      status: 'Choose a block below, then tap the board to place it.',
    };
  }

  function canPlaceBlockPiece(board, piece, col, row) {
    for (let y = 0; y < piece.shape.length; y += 1) {
      for (let x = 0; x < piece.shape[y].length; x += 1) {
        if (!piece.shape[y][x]) {
          continue;
        }
        const boardRow = row + y;
        const boardCol = col + x;
        if (
          boardRow < 0 ||
          boardRow >= BLOCK_SIZE ||
          boardCol < 0 ||
          boardCol >= BLOCK_SIZE ||
          board[boardRow][boardCol]
        ) {
          return false;
        }
      }
    }
    return true;
  }

  function clearBlockLines(board) {
    const nextBoard = cloneBlockBoard(board);
    const rowsToClear = [];
    const colsToClear = [];

    for (let row = 0; row < BLOCK_SIZE; row += 1) {
      if (nextBoard[row].every(Boolean)) {
        rowsToClear.push(row);
      }
    }

    for (let col = 0; col < BLOCK_SIZE; col += 1) {
      let full = true;
      for (let row = 0; row < BLOCK_SIZE; row += 1) {
        if (!nextBoard[row][col]) {
          full = false;
          break;
        }
      }
      if (full) {
        colsToClear.push(col);
      }
    }

    rowsToClear.forEach((row) => {
      nextBoard[row] = Array(BLOCK_SIZE).fill(0);
    });
    colsToClear.forEach((col) => {
      for (let row = 0; row < BLOCK_SIZE; row += 1) {
        nextBoard[row][col] = 0;
      }
    });

    return {
      board: nextBoard,
      cleared: rowsToClear.length + colsToClear.length,
    };
  }

  function countPieceCells(piece) {
    return piece.shape.reduce(
      (total, row) => total + row.reduce((sum, cell) => sum + (cell ? 1 : 0), 0),
      0,
    );
  }

  function hasAnyBlockMove(board, pieces) {
    return pieces.some((piece) => {
      for (let row = 0; row < BLOCK_SIZE; row += 1) {
        for (let col = 0; col < BLOCK_SIZE; col += 1) {
          if (canPlaceBlockPiece(board, piece, col, row)) {
            return true;
          }
        }
      }
      return false;
    });
  }

  function placeBlockPiece(state, pieceId, col, row, randomFn = Math.random) {
    const piece = state.pieces.find((item) => item.id === pieceId);
    if (!piece || state.gameOver || !canPlaceBlockPiece(state.board, piece, col, row)) {
      return state;
    }

    const nextBoard = cloneBlockBoard(state.board);
    for (let y = 0; y < piece.shape.length; y += 1) {
      for (let x = 0; x < piece.shape[y].length; x += 1) {
        if (piece.shape[y][x]) {
          nextBoard[row + y][col + x] = 1;
        }
      }
    }

    const cleared = clearBlockLines(nextBoard);
    const scoreGain = countPieceCells(piece) + cleared.cleared * 10;
    let nextPieces = state.pieces.filter((item) => item.id !== pieceId);

    if (!nextPieces.length) {
      nextPieces = [0, 1, 2].map((index) => createBlockPiece(index, randomFn));
    }

    const stuck = !hasAnyBlockMove(cleared.board, nextPieces);
    return {
      ...state,
      board: cleared.board,
      pieces: nextPieces,
      selectedPieceId: nextPieces[0] ? nextPieces[0].id : null,
      score: state.score + scoreGain,
      gameOver: stuck,
      status: stuck
        ? `No more moves. Final score: ${state.score + scoreGain}.`
        : cleared.cleared
          ? `Cleared ${cleared.cleared} line(s).`
          : 'Block placed. Choose the next piece.',
    };
  }

  function drawBlockBoard(ctx, canvas, state) {
    const cellSize = canvas.width / BLOCK_SIZE;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < BLOCK_SIZE; row += 1) {
      for (let col = 0; col < BLOCK_SIZE; col += 1) {
        const x = col * cellSize;
        const y = row * cellSize;
        ctx.fillStyle = state.board[row][col] ? '#ffb6d9' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      }
    }

    if (state.preview && state.draggingPieceId) {
      const piece = state.pieces.find((item) => item.id === state.draggingPieceId);
      if (piece) {
        const previewColor = state.preview.valid
          ? 'rgba(255, 182, 217, 0.55)'
          : 'rgba(248, 113, 113, 0.55)';
        for (let y = 0; y < piece.shape.length; y += 1) {
          for (let x = 0; x < piece.shape[y].length; x += 1) {
            if (!piece.shape[y][x]) {
              continue;
            }
            const drawX = (state.preview.col + x) * cellSize;
            const drawY = (state.preview.row + y) * cellSize;
            ctx.fillStyle = previewColor;
            ctx.fillRect(drawX + 2, drawY + 2, cellSize - 4, cellSize - 4);
          }
        }
      }
    }
  }

  function createSudokuState() {
    return {
      board: SUDOKU_PUZZLE.map((row) => row.slice()),
      selected: null,
      mistakes: new Set(),
      status: 'Select an empty cell and use the keypad below.',
    };
  }

  function createRatDenStreams(randomFn = Math.random) {
    return Array.from({ length: 18 }, (_, index) => {
      const lineCount = 8 + Math.floor(randomFn() * 6);
      const lines = [];

      for (let line = 0; line < lineCount; line += 1) {
        let content = '';
        const glyphCount = 3 + Math.floor(randomFn() * 3);
        for (let glyph = 0; glyph < glyphCount; glyph += 1) {
          content += `${randomFn() > 0.5 ? '6' : '9'} `;
        }
        lines.push(content.trim());
      }

      return {
        id: `stream-${index}-${Math.random().toString(16).slice(2, 8)}`,
        left: 2 + index * 5.35 + randomFn() * 2.4,
        duration: 4.8 + randomFn() * 4.6,
        delay: -randomFn() * 6,
        opacity: 0.28 + randomFn() * 0.48,
        fontSize: 16 + Math.floor(randomFn() * 10),
        content: lines.join('\n'),
      };
    });
  }

  function createRatDenTarget(randomFn = Math.random) {
    return {
      id: `rat-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      left: 12 + randomFn() * 76,
      top: 18 + randomFn() * 58,
      size: 34 + Math.floor(randomFn() * 12),
      rotate: -20 + Math.floor(randomFn() * 40),
    };
  }

  function createRatDenState(randomFn = Math.random) {
    return {
      score: 0,
      timeLeft: RAT_DEN_ROUND_SECONDS,
      started: false,
      paused: true,
      gameOver: false,
      rat: null,
      streams: createRatDenStreams(randomFn),
      status: 'Press Start Hunt. Watch the black screen and catch the rat.',
    };
  }

  function getSudokuFilledCount(state) {
    return state.board.flat().filter((value) => value !== 0).length;
  }

  function isSudokuSolved(state) {
    return state.board.every((row, rowIndex) =>
      row.every((value, colIndex) => value === SUDOKU_SOLUTION[rowIndex][colIndex]),
    );
  }

  function getSudokuMistakes(board) {
    const mistakes = new Set();
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const value = board[row][col];
        if (value !== 0 && value !== SUDOKU_SOLUTION[row][col]) {
          mistakes.add(`${row}-${col}`);
        }
      }
    }
    return mistakes;
  }

  function setSudokuValue(state, value) {
    if (!state.selected) {
      return {
        ...state,
        status: 'Pick a cell first.',
      };
    }

    const { row, col } = state.selected;
    if (SUDOKU_PUZZLE[row][col] !== 0) {
      return state;
    }

    const nextBoard = state.board.map((currentRow) => currentRow.slice());
    nextBoard[row][col] = value;
    const mistakes = getSudokuMistakes(nextBoard);
    const solved = isSudokuSolved({ ...state, board: nextBoard });
    return {
      ...state,
      board: nextBoard,
      mistakes,
      status: solved
        ? 'Sudoku solved.'
        : mistakes.has(`${row}-${col}`)
          ? 'That number does not fit here.'
          : 'Value updated.',
    };
  }

  function getRelatedSudokuCells(selected) {
    if (!selected) {
      return new Set();
    }
    const related = new Set();
    const boxRow = Math.floor(selected.row / 3) * 3;
    const boxCol = Math.floor(selected.col / 3) * 3;
    for (let index = 0; index < 9; index += 1) {
      related.add(`${selected.row}-${index}`);
      related.add(`${index}-${selected.col}`);
    }
    for (let row = boxRow; row < boxRow + 3; row += 1) {
      for (let col = boxCol; col < boxCol + 3; col += 1) {
        related.add(`${row}-${col}`);
      }
    }
    return related;
  }

  window.SnakeGameLogic = {
    createSnakeState,
    queueSnakeDirection,
    stepSnakeState,
    getRandomEmptyCell,
  };

  const SnakeGame = {
    key: 'snake',
    title: 'Snake',
    description: 'Eat food, grow longer, and avoid walls or your own tail.',
    statLabel: 'Score',

    setup(manager) {
      manager.state.snake = createSnakeState();
    },

    onEnter(manager) {
      if (!manager.state.snake) {
        this.setup(manager);
      }
      manager.stopSnakeTimer();
      this.render(manager);
    },

    onLeave(manager) {
      manager.stopSnakeTimer();
    },

    onKeydown(manager, event) {
      const state = manager.state.snake;
      const keyMap = {
        ArrowUp: 'up',
        KeyW: 'up',
        ArrowDown: 'down',
        KeyS: 'down',
        ArrowLeft: 'left',
        KeyA: 'left',
        ArrowRight: 'right',
        KeyD: 'right',
      };

      if (event.code === 'Space') {
        event.preventDefault();
        if (state.gameOver) {
          this.handleRestart(manager);
          this.handleStart(manager);
        } else {
          this.handlePause(manager);
        }
        return;
      }

      const direction = keyMap[event.code];
      if (!direction) {
        return;
      }

      event.preventDefault();
      manager.state.snake = queueSnakeDirection(state, direction);
      manager.ensureSnakeTimer();
      this.render(manager);
    },

    handleDirection(manager, direction) {
      manager.state.snake = queueSnakeDirection(manager.state.snake, direction);
      manager.ensureSnakeTimer();
      this.render(manager);
    },

    handleStart(manager) {
      manager.state.snake = {
        ...manager.state.snake,
        started: true,
        paused: false,
        status: `Score: ${manager.state.snake.score}`,
      };
      manager.ensureSnakeTimer();
      this.render(manager);
    },

    handlePause(manager) {
      const state = manager.state.snake;
      if (state.gameOver) {
        return;
      }

      manager.state.snake = {
        ...state,
        started: true,
        paused: !state.paused,
        status: state.paused ? `Score: ${state.score}` : 'Paused. Press Resume or any direction key to continue.',
      };
      if (manager.state.snake.paused) {
        manager.stopSnakeTimer();
      } else {
        manager.ensureSnakeTimer();
      }
      this.render(manager);
    },

    handleRestart(manager) {
      manager.stopSnakeTimer();
      manager.state.snake = createSnakeState();
      this.render(manager);
    },

    tick(manager) {
      manager.state.snake = stepSnakeState(manager.state.snake);
      if (manager.state.snake.paused || manager.state.snake.gameOver) {
        manager.stopSnakeTimer();
      }
      this.render(manager);
    },

    render(manager) {
      const state = manager.state.snake;
      manager.showCanvas(true);
      manager.showSnakeControls(true);
      manager.showBlockTray(false);
      manager.showSudokuPad(false);
      manager.showDomArea(false);
      drawSnake(manager.ctx, manager.canvas, state);
      manager.setMeta({
        title: this.title,
        description: this.description,
        statLabel: this.statLabel,
        statValue: state.score,
        status: state.status,
      });
      manager.setButtons({
        start: { visible: true, label: 'Start', disabled: !state.paused || state.gameOver },
        pause: { visible: true, label: state.paused ? 'Resume' : 'Pause', disabled: state.gameOver },
        restart: { visible: true, label: 'Restart', disabled: false },
      });
    },
  };

  const RatDenGame = {
    key: 'ratDen',
    title: 'Rat Den',
    description: '',
    statLabel: 'Caught',

    setup(manager) {
      manager.state.ratDen = createRatDenState();
    },

    onEnter(manager) {
      if (!manager.state.ratDen) {
        this.setup(manager);
      }
      manager.stopRatDenTimers();
      if (
        manager.state.ratDen.started &&
        !manager.state.ratDen.paused &&
        !manager.state.ratDen.gameOver
      ) {
        this.ensureRunning(manager);
      }
      this.render(manager);
    },

    onLeave(manager) {
      manager.stopRatDenTimers();
    },

    onKeydown(manager, event) {
      if (event.code !== 'Space') {
        return;
      }

      event.preventDefault();
      if (!manager.state.ratDen.started || manager.state.ratDen.gameOver) {
        this.handleStart(manager);
      } else {
        this.handlePause(manager);
      }
    },

    handleStart(manager) {
      const currentState = manager.state.ratDen;
      const nextState = currentState.gameOver ? createRatDenState() : currentState;

      if (nextState.started && !nextState.paused && !nextState.gameOver) {
        return;
      }

      manager.state.ratDen = {
        ...nextState,
        started: true,
        paused: false,
        gameOver: false,
        status: nextState.rat
          ? `Rat spotted. ${nextState.timeLeft}s left.`
          : `Hunt started. ${nextState.timeLeft}s left.`,
      };
      this.ensureRunning(manager);
      this.render(manager);
    },

    handlePause(manager) {
      const state = manager.state.ratDen;
      if (!state.started || state.gameOver) {
        return;
      }

      const paused = !state.paused;
      manager.state.ratDen = {
        ...state,
        paused,
        status: paused
          ? 'Paused. Resume when you are ready to catch more rats.'
          : state.rat
            ? `Rat spotted. ${state.timeLeft}s left.`
            : `Back in the den. ${state.timeLeft}s left.`,
      };

      if (paused) {
        manager.stopRatDenTimers();
      } else {
        this.ensureRunning(manager);
      }

      this.render(manager);
    },

    handleRestart(manager) {
      manager.stopRatDenTimers();
      manager.state.ratDen = createRatDenState();
      this.render(manager);
    },

    ensureRunning(manager) {
      const state = manager.state.ratDen;
      if (state.paused || state.gameOver) {
        return;
      }

      if (!manager.ratDenCountdownId) {
        manager.ratDenCountdownId = window.setInterval(() => {
          this.tick(manager);
        }, 1000);
      }

      if (state.rat) {
        this.scheduleHide(manager);
      } else {
        this.scheduleSpawn(manager);
      }
    },

    scheduleSpawn(manager) {
      const state = manager.state.ratDen;
      if (
        manager.ratDenSpawnTimeoutId ||
        state.paused ||
        state.gameOver ||
        state.rat
      ) {
        return;
      }

      const delay = 650 + Math.floor(Math.random() * 1000);
      manager.ratDenSpawnTimeoutId = window.setTimeout(() => {
        manager.ratDenSpawnTimeoutId = null;
        this.spawnRat(manager);
      }, delay);
    },

    scheduleHide(manager) {
      const state = manager.state.ratDen;
      if (
        manager.ratDenHideTimeoutId ||
        state.paused ||
        state.gameOver ||
        !state.rat
      ) {
        return;
      }

      const delay = 900 + Math.floor(Math.random() * 650);
      manager.ratDenHideTimeoutId = window.setTimeout(() => {
        manager.ratDenHideTimeoutId = null;
        const currentState = manager.state.ratDen;
        if (!currentState.rat || currentState.paused || currentState.gameOver) {
          return;
        }

        manager.state.ratDen = {
          ...currentState,
          rat: null,
          status: `It slipped away. ${currentState.timeLeft}s left.`,
        };
        this.render(manager);
        this.scheduleSpawn(manager);
      }, delay);
    },

    spawnRat(manager) {
      const state = manager.state.ratDen;
      if (state.paused || state.gameOver) {
        return;
      }

      manager.state.ratDen = {
        ...state,
        rat: createRatDenTarget(),
        status: `Rat spotted. ${state.timeLeft}s left.`,
      };
      this.render(manager);
      this.scheduleHide(manager);
    },

    catchRat(manager) {
      const state = manager.state.ratDen;
      if (!state.rat || state.paused || state.gameOver) {
        return;
      }

      if (manager.ratDenHideTimeoutId) {
        window.clearTimeout(manager.ratDenHideTimeoutId);
        manager.ratDenHideTimeoutId = null;
      }

      manager.state.ratDen = {
        ...state,
        rat: null,
        score: state.score + 1,
        status: `Caught. ${state.timeLeft}s left.`,
      };
      this.render(manager);
      this.scheduleSpawn(manager);
    },

    tick(manager) {
      const state = manager.state.ratDen;
      if (state.paused || state.gameOver) {
        return;
      }

      const timeLeft = state.timeLeft - 1;
      if (timeLeft <= 0) {
        manager.state.ratDen = {
          ...state,
          timeLeft: 0,
          paused: true,
          gameOver: true,
          rat: null,
          status: `Time up. You caught ${state.score} rat${state.score === 1 ? '' : 's'}.`,
        };
        manager.stopRatDenTimers();
        this.render(manager);
        return;
      }

      manager.state.ratDen = {
        ...state,
        timeLeft,
        status: state.rat
          ? `Rat spotted. ${timeLeft}s left.`
          : `Scan the den. ${timeLeft}s left.`,
      };
      this.render(manager);
    },

    render(manager) {
      const state = manager.state.ratDen;
      manager.showCanvas(false);
      manager.showSnakeControls(false);
      manager.showBlockTray(false);
      manager.showSudokuPad(false);
      manager.showDomArea(true);

      const stage = document.createElement('div');
      stage.className = 'rat-den-stage';

      const grid = document.createElement('div');
      grid.className = 'rat-den-grid';
      state.streams.forEach((stream) => {
        const column = document.createElement('div');
        column.className = 'rat-den-stream';
        column.textContent = stream.content;
        column.style.left = `${stream.left}%`;
        column.style.fontSize = `${stream.fontSize}px`;
        column.style.setProperty('--stream-duration', `${stream.duration}s`);
        column.style.setProperty('--stream-delay', `${stream.delay}s`);
        column.style.setProperty('--stream-opacity', String(stream.opacity));
        grid.appendChild(column);
      });

      const scanline = document.createElement('div');
      scanline.className = 'rat-den-scanline';

      const overlay = document.createElement('div');
      overlay.className = 'rat-den-overlay';
      overlay.innerHTML = `
        <span>Time: ${state.timeLeft}s</span>
        <span>Signal: ${state.paused ? 'paused' : 'active'}</span>
      `;

      stage.appendChild(grid);
      stage.appendChild(scanline);

      if (state.rat) {
        const ratButton = document.createElement('button');
        ratButton.type = 'button';
        ratButton.className = 'rat-den-rat';
        ratButton.style.left = `${state.rat.left}%`;
        ratButton.style.top = `${state.rat.top}%`;
        ratButton.style.width = `${state.rat.size}px`;
        ratButton.style.height = `${state.rat.size}px`;
        ratButton.style.setProperty('--rat-rotate', `${state.rat.rotate}deg`);
        ratButton.setAttribute('aria-label', 'Catch the rat');
        ratButton.title = 'Catch the rat';
        ratButton.addEventListener('click', () => this.catchRat(manager));
        stage.appendChild(ratButton);
      } else {
        const emptyState = document.createElement('div');
        emptyState.className = 'rat-den-empty';
        emptyState.textContent = state.started && !state.gameOver
          ? state.paused
            ? 'Den paused'
            : 'Watching for movement'
          : 'Start hunt';
        stage.appendChild(emptyState);
      }

      stage.appendChild(overlay);
      manager.domArea.innerHTML = '';
      manager.domArea.appendChild(stage);

      manager.setMeta({
        title: this.title,
        description: this.description,
        statLabel: this.statLabel,
        statValue: state.score,
        status: state.status,
      });
      manager.setButtons({
        start: {
          visible: true,
          label: state.gameOver ? 'New round' : state.started ? 'Running' : 'Start hunt',
          disabled: state.started && !state.gameOver,
        },
        pause: {
          visible: true,
          label: state.paused ? 'Resume' : 'Pause',
          disabled: !state.started || state.gameOver,
        },
        restart: {
          visible: true,
          label: 'Restart',
          disabled: false,
        },
      });
    },
  };

  const BlockBlastGame = {
    key: 'blockBlast',
    title: 'Block Blast',
    description: '',
    statLabel: 'Score',

    setup(manager) {
      manager.state.blockBlast = createBlockState();
    },

    onEnter(manager) {
      if (!manager.state.blockBlast) {
        this.setup(manager);
      }
      this.render(manager);
    },

    onLeave(manager) {
      manager.cancelBlockDrag();
    },

    selectPiece(manager, pieceId) {
      const state = manager.state.blockBlast;
      manager.state.blockBlast = {
        ...state,
        selectedPieceId: pieceId,
        draggingPieceId: null,
        preview: null,
        status: 'Tap a cell on the board to place the selected piece.',
      };
      this.render(manager);
    },

    beginDrag(manager, pieceId) {
      const state = manager.state.blockBlast;
      if (state.gameOver) {
        return;
      }
      manager.state.blockBlast = {
        ...state,
        selectedPieceId: pieceId,
        draggingPieceId: pieceId,
        preview: null,
        status: 'Drag the piece over the board and release to place it.',
      };
      this.render(manager);
    },

    updateDrag(manager, clientX, clientY) {
      const state = manager.state.blockBlast;
      if (!state.draggingPieceId) {
        return;
      }

      const piece = state.pieces.find((item) => item.id === state.draggingPieceId);
      if (!piece) {
        return;
      }

      const rect = manager.canvas.getBoundingClientRect();
      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (!inside) {
        manager.state.blockBlast = {
          ...state,
          preview: null,
        };
        this.render(manager);
        return;
      }

      const cellSize = manager.canvas.width / BLOCK_SIZE;
      const col = Math.floor((clientX - rect.left) / cellSize);
      const row = Math.floor((clientY - rect.top) / cellSize);
      const valid = canPlaceBlockPiece(state.board, piece, col, row);

      manager.state.blockBlast = {
        ...state,
        preview: { col, row, valid },
      };
      this.render(manager);
    },

    endDrag(manager, clientX, clientY) {
      const state = manager.state.blockBlast;
      if (!state.draggingPieceId) {
        return;
      }

      const pieceId = state.draggingPieceId;
      const preview = state.preview;
      let nextState = {
        ...state,
        draggingPieceId: null,
        preview: null,
      };

      if (preview && preview.valid) {
        nextState = placeBlockPiece(nextState, pieceId, preview.col, preview.row);
      } else if (typeof clientX === 'number' && typeof clientY === 'number') {
        nextState = {
          ...nextState,
          status: 'That piece does not fit there.',
        };
      }

      manager.state.blockBlast = nextState;
      this.render(manager);
    },

    onCanvasClick(manager, canvasX, canvasY) {
      const state = manager.state.blockBlast;
      if (state.draggingPieceId) {
        return;
      }
      if (!state.selectedPieceId || state.gameOver) {
        manager.state.blockBlast = {
          ...state,
          status: state.gameOver ? state.status : 'Choose a piece first.',
        };
        this.render(manager);
        return;
      }

      const cellSize = manager.canvas.width / BLOCK_SIZE;
      const col = Math.floor(canvasX / cellSize);
      const row = Math.floor(canvasY / cellSize);
      const nextState = placeBlockPiece(state, state.selectedPieceId, col, row);

      if (nextState === state) {
        manager.state.blockBlast = {
          ...state,
          status: 'That piece does not fit there.',
        };
      } else {
        manager.state.blockBlast = nextState;
      }

      this.render(manager);
    },

    handleRestart(manager) {
      manager.state.blockBlast = createBlockState();
      this.render(manager);
    },

    render(manager) {
      const state = manager.state.blockBlast;
      manager.showCanvas(true);
      manager.showSnakeControls(false);
      manager.showBlockTray(true);
      manager.showSudokuPad(false);
      manager.showDomArea(false);
      drawBlockBoard(manager.ctx, manager.canvas, state);
      manager.renderBlockTray(state, (pieceId) => this.selectPiece(manager, pieceId));
      manager.setMeta({
        title: this.title,
        description: this.description,
        statLabel: this.statLabel,
        statValue: state.score,
        status: state.status,
      });
      manager.setButtons({
        start: { visible: false, label: 'Start', disabled: true },
        pause: { visible: false, label: 'Pause', disabled: true },
        restart: { visible: true, label: 'New game', disabled: false },
      });
    },
  };

  const SudokuGame = {
    key: 'sudoku',
    title: 'Sudoku',
    description: '',
    statLabel: 'Filled',

    setup(manager) {
      manager.state.sudoku = createSudokuState();
    },

    onEnter(manager) {
      if (!manager.state.sudoku) {
        this.setup(manager);
      }
      this.render(manager);
    },

    selectCell(manager, row, col) {
      manager.state.sudoku = {
        ...manager.state.sudoku,
        selected: { row, col },
      };
      this.render(manager);
    },

    handlePad(manager, value) {
      manager.state.sudoku = setSudokuValue(manager.state.sudoku, value);
      this.render(manager);
    },

    handleRestart(manager) {
      manager.state.sudoku = createSudokuState();
      this.render(manager);
    },

    handleStart(manager) {
      const selected = manager.state.sudoku.selected;
      if (!selected) {
        manager.state.sudoku = {
          ...manager.state.sudoku,
          status: 'Select a cell first to fill it from the solution.',
        };
      } else if (SUDOKU_PUZZLE[selected.row][selected.col] !== 0) {
        manager.state.sudoku = {
          ...manager.state.sudoku,
          status: 'That cell is fixed.',
        };
      } else {
        manager.state.sudoku = setSudokuValue(manager.state.sudoku, SUDOKU_SOLUTION[selected.row][selected.col]);
        manager.state.sudoku.status = 'Hint applied.';
      }
      this.render(manager);
    },

    handlePause(manager) {
      const mistakes = getSudokuMistakes(manager.state.sudoku.board);
      manager.state.sudoku = {
        ...manager.state.sudoku,
        mistakes,
        status: mistakes.size ? 'There are incorrect entries on the board.' : 'All current entries look correct.',
      };
      this.render(manager);
    },

    render(manager) {
      const state = manager.state.sudoku;
      manager.showCanvas(false);
      manager.showSnakeControls(false);
      manager.showBlockTray(false);
      manager.showSudokuPad(true);
      manager.showDomArea(true);
      manager.renderSudokuBoard(state, (row, col) => this.selectCell(manager, row, col));
      manager.renderSudokuPad((value) => this.handlePad(manager, value));
      manager.setMeta({
        title: this.title,
        description: this.description,
        statLabel: this.statLabel,
        statValue: `${getSudokuFilledCount(state)}/81`,
        status: state.status,
      });
      manager.setButtons({
        start: { visible: true, label: 'Hint', disabled: false },
        pause: { visible: true, label: 'Check', disabled: false },
        restart: { visible: true, label: 'Reset', disabled: false },
      });
    },
  };

  window.GameManager = {
    initialized: false,
    canvas: null,
    ctx: null,
    domArea: null,
    scoreText: null,
    statLabel: null,
    statusText: null,
    titleText: null,
    descText: null,
    startButton: null,
    pauseButton: null,
    restartButton: null,
    snakeControls: null,
    snakeHelp: null,
    blockTray: null,
    sudokuPad: null,
    tabs: [],
    state: {},
    currentGameKey: 'ratDen',
    snakeTimerId: null,
    ratDenCountdownId: null,
    ratDenSpawnTimeoutId: null,
    ratDenHideTimeoutId: null,
    games: {
      ratDen: RatDenGame,
      blockBlast: BlockBlastGame,
      sudoku: SudokuGame,
    },

    init() {
      if (this.initialized) {
        return;
      }

      this.canvas = document.getElementById('gameCanvas');
      this.domArea = document.getElementById('gameDomArea');
      this.scoreText = document.getElementById('gameScore');
      this.statLabel = document.getElementById('gameStatLabel');
      this.statusText = document.getElementById('gameStatus');
      this.titleText = document.getElementById('gameTitle');
      this.descText = document.getElementById('gameDesc');
      this.startButton = document.getElementById('startGameBtn');
      this.pauseButton = document.getElementById('pauseGameBtn');
      this.restartButton = document.getElementById('resetGameBtn');
      this.snakeControls = document.getElementById('snakeControls');
      this.snakeHelp = document.getElementById('snakeHelp');
      this.blockTray = document.getElementById('blockTray');
      this.sudokuPad = document.getElementById('sudokuPad');
      this.tabs = Array.from(document.querySelectorAll('.game-tab'));

      if (!this.canvas || !this.scoreText || !this.statusText) {
        return;
      }

      this.ctx = this.canvas.getContext('2d');
      this.bindEvents();
      this.resizeCanvas();
      this.selectGame(this.currentGameKey);
      this.initialized = true;
    },

    bindEvents() {
      window.addEventListener('resize', () => this.resizeCanvas());
      window.addEventListener('keydown', (event) => {
        const game = this.games[this.currentGameKey];
        if (game && game.onKeydown) {
          game.onKeydown(this, event);
        }
      });

      window.addEventListener('pointermove', (event) => {
        const game = this.games[this.currentGameKey];
        if (game && game.updateDrag) {
          game.updateDrag(this, event.clientX, event.clientY);
        }
      });

      window.addEventListener('pointerup', (event) => {
        const game = this.games[this.currentGameKey];
        if (game && game.endDrag) {
          game.endDrag(this, event.clientX, event.clientY);
        }
      });

      window.addEventListener('pointercancel', () => {
        const game = this.games[this.currentGameKey];
        if (game && game.endDrag) {
          game.endDrag(this);
        }
      });

      this.canvas.addEventListener('click', (event) => {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        const game = this.games[this.currentGameKey];
        if (game && game.onCanvasClick) {
          game.onCanvasClick(this, canvasX, canvasY);
        }
      });

      this.tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          this.selectGame(tab.dataset.game);
        });
      });

      this.startButton.addEventListener('click', () => {
        const game = this.games[this.currentGameKey];
        if (game && game.handleStart) {
          game.handleStart(this);
        }
      });

      this.pauseButton.addEventListener('click', () => {
        const game = this.games[this.currentGameKey];
        if (game && game.handlePause) {
          game.handlePause(this);
        }
      });

      this.restartButton.addEventListener('click', () => {
        const game = this.games[this.currentGameKey];
        if (game && game.handleRestart) {
          game.handleRestart(this);
        }
      });

      document.querySelectorAll('[data-snake-direction]').forEach((button) => {
        button.addEventListener('click', () => {
          SnakeGame.handleDirection(this, button.dataset.snakeDirection);
        });
      });
    },

    resizeCanvas() {
      if (!this.canvas) {
        return;
      }
      const wrapper = this.canvas.parentElement;
      const wrapperWidth = Math.floor((wrapper.parentElement?.getBoundingClientRect().width || wrapper.getBoundingClientRect().width) - 32);
      const viewHeight = Math.floor(document.getElementById('gameView')?.getBoundingClientRect().height || window.innerHeight);
      const sizeConfig = this.currentGameKey === 'blockBlast'
        ? { max: 336, min: 192, reservedHeight: 390, grid: BLOCK_SIZE }
        : { max: 360, min: 220, reservedHeight: 300, grid: GRID_COLS };
      const heightLimit = Math.max(sizeConfig.min, viewHeight - sizeConfig.reservedHeight);
      const availableWidth = Math.max(sizeConfig.min, wrapperWidth);
      const rawSize = Math.min(sizeConfig.max, availableWidth, heightLimit);
      const size = Math.max(
        sizeConfig.grid,
        Math.floor(rawSize / sizeConfig.grid) * sizeConfig.grid,
      );
      this.canvas.width = size;
      this.canvas.height = size;
      this.canvas.style.width = `${size}px`;
      this.canvas.style.height = `${size}px`;
      wrapper.style.width = `${size}px`;
      wrapper.style.height = `${size}px`;
      const game = this.games[this.currentGameKey];
      if (game && game.render) {
        game.render(this);
      }
    },

    selectGame(key) {
      if (!this.games[key]) {
        return;
      }
      const previous = this.games[this.currentGameKey];
      if (previous && previous.onLeave) {
        previous.onLeave(this);
      }

      this.currentGameKey = key;
      this.tabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.game === key);
      });

      const nextGame = this.games[key];
      if (nextGame && nextGame.onEnter) {
        nextGame.onEnter(this);
      }
      this.resizeCanvas();
    },

    cancelBlockDrag() {
      if (!this.state.blockBlast || !this.state.blockBlast.draggingPieceId) {
        return;
      }
      this.state.blockBlast = {
        ...this.state.blockBlast,
        draggingPieceId: null,
        preview: null,
      };
    },

    ensureSnakeTimer() {
      if (this.snakeTimerId || this.currentGameKey !== 'snake' || this.state.snake.paused || this.state.snake.gameOver) {
        return;
      }

      this.snakeTimerId = window.setInterval(() => {
        SnakeGame.tick(this);
      }, SNAKE_TICK_MS);
    },

    stopSnakeTimer() {
      if (this.snakeTimerId) {
        window.clearInterval(this.snakeTimerId);
        this.snakeTimerId = null;
      }
    },

    stopRatDenTimers() {
      if (this.ratDenCountdownId) {
        window.clearInterval(this.ratDenCountdownId);
        this.ratDenCountdownId = null;
      }
      if (this.ratDenSpawnTimeoutId) {
        window.clearTimeout(this.ratDenSpawnTimeoutId);
        this.ratDenSpawnTimeoutId = null;
      }
      if (this.ratDenHideTimeoutId) {
        window.clearTimeout(this.ratDenHideTimeoutId);
        this.ratDenHideTimeoutId = null;
      }
    },

    pause() {
      this.cancelBlockDrag();
      if (this.currentGameKey === 'snake' && this.state.snake && !this.state.snake.gameOver) {
        this.state.snake = {
          ...this.state.snake,
          paused: true,
          status: this.state.snake.started
            ? 'Paused. Press Resume or any direction key to continue.'
            : this.state.snake.status,
        };
        this.stopSnakeTimer();
        SnakeGame.render(this);
        return;
      }

      if (this.currentGameKey === 'ratDen' && this.state.ratDen && !this.state.ratDen.gameOver) {
        this.state.ratDen = {
          ...this.state.ratDen,
          paused: true,
          status: this.state.ratDen.started
            ? 'Paused. Resume when you are ready to catch more rats.'
            : this.state.ratDen.status,
        };
        this.stopRatDenTimers();
        RatDenGame.render(this);
        return;
      }

      this.stopSnakeTimer();
      this.stopRatDenTimers();
    },

    showCanvas(visible) {
      this.canvas.parentElement.style.display = visible ? 'flex' : 'none';
    },

    showDomArea(visible) {
      this.domArea.classList.toggle('active', visible);
      if (!visible) {
        this.domArea.innerHTML = '';
      }
    },

    showSnakeControls(visible) {
      if (this.snakeControls) {
        this.snakeControls.style.display = visible ? 'flex' : 'none';
      }
      if (this.snakeHelp) {
        this.snakeHelp.style.display = visible ? 'block' : 'none';
      }
    },

    showBlockTray(visible) {
      this.blockTray.classList.toggle('active', visible);
      if (!visible) {
        this.blockTray.innerHTML = '';
      }
    },

    showSudokuPad(visible) {
      this.sudokuPad.classList.toggle('active', visible);
      if (!visible) {
        this.sudokuPad.innerHTML = '';
      }
    },

    setMeta({ title, description, statLabel, statValue, status }) {
      this.titleText.textContent = title;
      this.descText.textContent = description;
      this.statLabel.textContent = statLabel;
      this.scoreText.textContent = String(statValue);
      this.statusText.textContent = status;
    },

    setButtons(config) {
      const { start, pause, restart } = config;
      if (start) {
        this.startButton.hidden = !start.visible;
        this.startButton.disabled = start.disabled;
        this.startButton.textContent = start.label;
      }
      if (pause) {
        this.pauseButton.hidden = !pause.visible;
        this.pauseButton.disabled = pause.disabled;
        this.pauseButton.textContent = pause.label;
      }
      if (restart) {
        this.restartButton.hidden = !restart.visible;
        this.restartButton.disabled = restart.disabled;
        this.restartButton.textContent = restart.label;
      }
    },

    renderBlockTray(state, onSelect) {
      this.blockTray.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.className = 'block-tray';

      state.pieces.forEach((piece) => {
        const pieceButton = document.createElement('button');
        pieceButton.className = 'block-piece';
        pieceButton.type = 'button';
        if (piece.id === state.selectedPieceId) {
          pieceButton.classList.add('active');
        }
        if (piece.id === state.draggingPieceId) {
          pieceButton.classList.add('dragging');
        }

        const grid = document.createElement('div');
        grid.className = 'block-piece-grid';
        grid.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 14px)`;

        piece.shape.forEach((row) => {
          row.forEach((cell) => {
            const cellElement = document.createElement('span');
            cellElement.className = 'block-piece-cell';
            if (cell) {
              cellElement.classList.add('filled');
            }
            grid.appendChild(cellElement);
          });
        });

        pieceButton.appendChild(grid);
        pieceButton.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          if (pieceButton.setPointerCapture) {
            try {
              pieceButton.setPointerCapture(event.pointerId);
            } catch {}
          }
          BlockBlastGame.beginDrag(this, piece.id);
          BlockBlastGame.updateDrag(this, event.clientX, event.clientY);
        });
        pieceButton.addEventListener('click', () => onSelect(piece.id));
        wrapper.appendChild(pieceButton);
      });

      this.blockTray.appendChild(wrapper);
    },

    renderSudokuBoard(state, onSelect) {
      const related = getRelatedSudokuCells(state.selected);
      const board = document.createElement('div');
      board.className = 'sudoku-board';

      for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'sudoku-cell';
          button.dataset.row = String(row);
          button.dataset.col = String(col);
          button.textContent = state.board[row][col] ? String(state.board[row][col]) : '';

          if (SUDOKU_PUZZLE[row][col] !== 0) {
            button.classList.add('fixed');
          }
          if (state.selected && state.selected.row === row && state.selected.col === col) {
            button.classList.add('selected');
          } else if (related.has(`${row}-${col}`)) {
            button.classList.add('related');
          }
          if (state.mistakes.has(`${row}-${col}`)) {
            button.classList.add('error');
          }

          button.addEventListener('click', () => onSelect(row, col));
          board.appendChild(button);
        }
      }

      this.domArea.innerHTML = '';
      this.domArea.appendChild(board);
    },

    renderSudokuPad(onInput) {
      const pad = document.createElement('div');
      pad.className = 'sudoku-pad';

      for (let value = 1; value <= 9; value += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sudoku-pad-btn';
        button.textContent = String(value);
        button.addEventListener('click', () => onInput(value));
        pad.appendChild(button);
      }

      const clearButton = document.createElement('button');
      clearButton.type = 'button';
      clearButton.className = 'sudoku-pad-btn';
      clearButton.textContent = 'Clear';
      clearButton.addEventListener('click', () => onInput(0));
      pad.appendChild(clearButton);

      this.sudokuPad.innerHTML = '';
      this.sudokuPad.appendChild(pad);
    },
  };
})();
