'use strict'

const MINE = '💣'
const MARK = '🚩'
const EMPTY = ''
const LIVE = '❤️'
const HINT = '💡'
const DARK_MODE = '🌚'
const LIGHT_MODE = '🌞'
const HAPPY_BTN = '😃'
const SURPRISED_BTN = '😯'
const ANGRY_BTN = '🤯'
const WINNER_BTN = '😎'

var gLevel = {
    SIZE: 9,
    MINES: 10,
}

var gGame = {
    isOn: true,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    liveCount: 3,
    hintCount: 3,
    numOfFlags: 0,
    numOfSafeClick: 3,
}

var gIsFirstClick = true
var gIsHint = false
var gIsManualMineMode = false
var gItWasManualMine = false
var gNumOfManualMine = 0
var gHistory

// The function called when page loads
function onInit() {
    loadScores()
    // clearLeaderBoard()
    gElapsedTime = 0
    gStartTime = 0
    gGame.isOn = true
    document.querySelector('.reset-btn').innerText = HAPPY_BTN
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.liveCount = 3
    gGame.hintCount = 3
    gGame.numOfSafeClick = 3
    gIsHint = false
    gIsFirstClick = true
    gGame.numOfFlags = gLevel.MINES
    gIsManualMineMode = false
    gNumOfManualMine = 0
    gItWasManualMine = false
    resetNumOfManualMine()
    gHistory = []
    document.querySelector('.remaining-mines').innerText = gNumOfManualMine

    clearInterval(gTimerInterval)
    renderTimer()
    gBoard = buildBoard()
    renderBoard(gBoard)
    renderLives()
    renderHint()
    renderFlags()
    resetHintsBtn()
    document.querySelector('p span').innerText = gGame.numOfSafeClick
}

//The function counts mines around each cell
function countMinesAround(board, cellI, cellJ) {
    var negs = getNegsCells(board, cellI, cellJ)
    var mineCount = 0
    for (var i = 0; i < negs.length; i++) {
        var currCell = board[negs[i].i][negs[i].j]
        if (currCell.isMine) mineCount++
    }
    return mineCount
}

//The function reveals the cell with each click as needed
//and updates the model
function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return

    saveState()

    if (gIsManualMineMode && gIsFirstClick) {
        placeManualMine(i, j)
        return
    }
    var currCell = gBoard[i][j]

    const elResetBtn = document.querySelector('.reset-btn')
    elResetBtn.innerText = SURPRISED_BTN
    setTimeout(() => {
        currCell.isMine ? (elResetBtn.innerText = ANGRY_BTN) : (elResetBtn.innerText = HAPPY_BTN)
    }, 400)

    if (gIsHint && gGame.hintCount) {
        if (gIsFirstClick) return
        revealNeighbors(gBoard, i, j)
        gIsHint = false
        gGame.hintCount--

        return
    }

    if (gIsFirstClick && !gItWasManualMine) {
        gBoard = placeMinesRandomAndCountNeighbors(gBoard, i, j)
        gIsFirstClick = false
        startTimer()
    }

    if (currCell.isShown || currCell.isMarked) return
    if (currCell.isMine) {
        gGame.liveCount--
        elCell.classList.add('mine-hit')
        elCell.classList.remove('mine')
        elCell.innerText = MINE
        renderLives()
        if (gGame.liveCount === 0) {
            revealAllMines()
            gGame.isOn = false
        }
    } else {
        elCell.innerText = currCell.minesAroundCount || EMPTY
        elCell.classList.add('revealed')
        if (currCell.minesAroundCount === 0) fullExpandShow(gBoard, i, j)
    }

    if (!currCell.isShown) {
        currCell.isShown = true
        gGame.shownCount++
    }

    checkGameOver()
}

//The function is triggered when the user right-clicks on a cell.
//If the cell is marked, it removes the mark, and if not, it adds a flag.
function onCellMarked(elCell) {
    if (!gGame.isOn) return

    saveState()

    const idxI = elCell.dataset.i
    const idxJ = elCell.dataset.j
    var cell = gBoard[idxI][idxJ]

    if (cell.isShown) return
    if (cell.isMarked) {
        elCell.innerText = EMPTY
        gGame.markedCount--
        gGame.numOfFlags++
    } else {
        elCell.innerText = MARK
        gGame.markedCount++
        gGame.numOfFlags--
    }

    cell.isMarked = !cell.isMarked
    renderFlags()
    checkGameOver()
}

// ----- Game Over Logic -----

// Checks if the game is over either by losing all lives or winning by revealing all cells or marking all mines.
function checkGameOver() {
    const elResetBtn = document.querySelector('.reset-btn')
    if (gGame.liveCount === 0) {
        clearInterval(gTimerInterval)
        elResetBtn.innerText = ANGRY_BTN
        setTimeout(() => {
            gGame.isOn = false
            alert('You Lost!')
        }, 500)
        return
    } else if (isVictory()) {
        const elTimer = document.querySelector('.timer')
        const timerStr = elTimer.innerText
        const timer = getTimeByString(timerStr)
        addToLeaderBoard(timer, timerStr)

        clearInterval(gTimerInterval)
        elResetBtn.innerText = WINNER_BTN
        setTimeout(() => {
            gGame.isOn = false
            alert('You Win!')
        }, 500)
    }
}

// Checks if the player has won by verifying all non-mine cells are revealed and all mines are correctly marked.
function isVictory() {
    const isAllCellsRevealed = gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES + gGame.numOfFlags

    var totalMarkedMines = gGame.markedCount + gGame.numOfFlags
    var isAllMinesMarked = totalMarkedMines === gLevel.MINES

    return isAllCellsRevealed && isAllMinesMarked
}

// ----- Hint Feature -----

// Activates hint mode when the hint button is clicked, allowing the player to see neighboring cells.
function onHintClicked(elHintBtn) {
    if (gIsFirstClick) return
    gIsHint = true
    elHintBtn.classList.add('highlighted-hint')
}

// Retrieves all neighboring cells around a specific cell on the board for hint or other purposes.
function getNegsCells(board, cellI, cellJ) {
    var negs = []
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            negs.push({ i, j })
        }
    }
    return negs
}

// Resets the hint buttons when starting a new game or resetting the game state.
function resetHintsBtn() {
    const elHints = document.querySelectorAll('.hint')
    if (elHints) {
        for (var i = 0; i < elHints.length; i++) {
            elHints[i].hidden = false
            elHints[i].classList.remove('highlighted-hint')
        }
    }
}

// ----- Leaderboard -----

// Adds the current game time to the leaderboard and updates the best time for the current difficulty level.
function addToLeaderBoard(timer, timerStr) {
    if (typeof Storage !== 'undefined') {
        const levelName = getLevelName()
        var prevMinTimerStr = localStorage.getItem(levelName)

        if (!prevMinTimerStr) {
            localStorage.setItem(levelName, timerStr)
        } else {
            var prevMinTimer = getTimeByString(prevMinTimerStr)
            if (!prevMinTimer) {
                localStorage.setItem(levelName, timerStr)
            } else {
                var minTimerStr = getMinStrTime(prevMinTimer, timer)
                localStorage.setItem(levelName, minTimerStr)
            }
        }
        document.getElementById(levelName).innerHTML = localStorage.getItem(levelName)
    } else {
        document.getElementById(levelName).innerHTML = 'Sorry, your browser does not support Web Storage...'
    }
}

// Converts a timer string into an object with seconds and milliseconds.
function getTimeByString(timerStr) {
    if (!timerStr) return null

    const timerArr = timerStr.split(':')
    if (timerArr.length < 2) return null

    const timer = { seconds: parseInt(timerArr[0]), milliSeconds: parseInt(timerArr[1]) }
    return timer
}

// Compares two timers and returns the string of the faster time.
function getMinStrTime(timer1, timer2) {
    if (!timer1) return timer2.seconds + ':' + timer2.milliSeconds
    if (!timer2) return timer1.seconds + ':' + timer1.milliSeconds

    var min = timer1
    if (timer1.seconds < timer2.seconds) {
        min = timer1
    } else if (timer2.seconds < timer1.seconds) {
        min = timer2
    } else {
        if (timer1.milliSeconds < timer2.milliSeconds) {
            min = timer1
        } else if (timer2.milliSeconds <= timer1.milliSeconds) {
            min = timer2
        }
    }
    return min.seconds + ':' + min.milliSeconds
}

// Returns the name of the current difficulty level (Beginner, Intermediate, Expert).
function getLevelName() {
    var levelName = ''
    switch (gLevel.SIZE) {
        case 4:
            levelName = 'Beginner'
            break
        case 9:
            levelName = 'Intermediate'
            break
        case 12:
            levelName = 'Expert'
            break
    }
    return levelName
}

// Loads the best scores for each difficulty level from localStorage and displays them on the leaderboard.
function loadScores() {
    var levels = ['Beginner', 'Intermediate', 'Expert']
    for (var i = 0; i < levels.length; i++) {
        var level = levels[i]
        var bestScore = localStorage.getItem(level)
        if (bestScore) {
            document.getElementById(level).innerText = bestScore
        }
    }
}

// Clears the leaderboard by removing the best scores from localStorage.
function clearLeaderBoard() {
    var levels = ['Beginner', 'Intermediate', 'Expert']
    for (var i = 0; i < levels.length; i++) {
        localStorage.removeItem(levels[i])
    }
    loadScores()
}

// ----- Safe Click Feature -----

// Allows the player to reveal a safe cell (non-mine) for a limited number of times during the game.
function onSafeClick() {
    if (gGame.numOfSafeClick === 0 || gIsFirstClick) return
    var isNotShownCell = true
    while (isNotShownCell) {
        const idxI = getRandomInt(0, gLevel.SIZE)
        const idxJ = getRandomInt(0, gLevel.SIZE)
        const currCell = gBoard[idxI][idxJ]
        if (!currCell.isShown && !currCell.isMine) {
            const elCell = document.querySelector(`[data-i="${idxI}"][data-j="${idxJ}"]`)
            elCell.innerText = gBoard[idxI][idxJ].minesAroundCount || EMPTY
            elCell.classList.add('show-safe-click')
            setTimeout(() => {
                elCell.innerText = EMPTY
                elCell.classList.remove('show-safe-click')
            }, 2000)
            isNotShownCell = false
        }
    }
    gGame.numOfSafeClick--
    document.querySelector('p span').innerText = gGame.numOfSafeClick
}

// ----- Manual Mine Placement -----

// Enables manual mine placement mode when clicked.
function onManualMineClick() {
    gIsManualMineMode = true
    gItWasManualMine = true
}

// Resets the number of manual mines based on the game level.
function resetNumOfManualMine() {
    switch (gLevel.SIZE) {
        case 4:
            gNumOfManualMine = 2
            break
        case 9:
            gNumOfManualMine = 10
            break
        case 12:
            gNumOfManualMine = 40
            break
    }
}

// Places a manual mine on the board at the specified cell (i, j) and updates the count.
function placeManualMine(i, j) {
    if (!gBoard[i][j].isMine) {
        gBoard[i][j].isMine = true
        const elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
        elCell.classList.add('mine')
        gNumOfManualMine--
    }
    document.querySelector('.remaining-mines').innerText = gNumOfManualMine

    if (gNumOfManualMine === 0) {
        gIsManualMineMode = false
        setMinesNegsCount(gBoard)
        startTimer()
    }
}

// ----- Undo Feature -----

// Saves the current state of the game (board) to enable undo functionality.
function saveState() {
    if (gIsFirstClick) return
    gHistory.push({
        board: copyMat(gBoard),
    })
}

// Restores the previous state of the game when the back button is clicked (undo).
function onBack() {
    if (gHistory.length === 0) {
        onInit()
        return
    }

    var prevState = gHistory.pop()

    gBoard = copyMat(prevState.board)
    renderBoard(gBoard)
    renderFlags()
    recountMarkedCells(gBoard)
    recountShownCells(gBoard)
    recountMines(gBoard)
    updateDOM(gBoard)
}

// Updates the DOM (gameboard) based on the current game state.
function updateDOM(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currCell = board[i][j]
            var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)

            if (currCell.isShown) {
                elCell.classList.add('revealed')
                if (currCell.isMine) {
                    elCell.classList.add('mine-hit')
                }
            } else {
                elCell.classList.remove('revealed')
                if (currCell.isMarked) {
                    elCell.classList.add('marked')
                } else {
                    elCell.classList.remove('marked')
                }
            }
        }
    }
}

// ----- Recount Functions -----

// Recounts and updates the number of marked cells on the board.
function recountMarkedCells(board) {
    var count = 0
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMarked) count++
        }
    }
    gGame.markedCount = count
    document.querySelector('.flags').innerHTML = gLevel.MINES - count
}

// Recounts and updates the number of revealed cells on the board.
function recountShownCells(board) {
    var count = 0
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isShown) count++
        }
    }
    gGame.shownCount = count
}

// Recounts and updates the number of mines on the board.
function recountMines(board) {
    var count = 0
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine) count++
        }
    }
    gLevel.MINES = count
}

// ----- Dark Mode -----

// Toggles dark mode on and off when the dark mode button is clicked.
function onDarkMode(elDarkBtn) {
    const elBody = document.querySelector('body')
    elBody.classList.toggle('dark-mode')
    if (elBody.classList.contains('dark-mode')) elDarkBtn.innerText = LIGHT_MODE
    else elDarkBtn.innerText = DARK_MODE
}
