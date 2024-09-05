'use strict'

const MINE = '💣'
const MARK = '🚩'
const EMPTY = ''
const LIVE = '❤️'
const HINT = '💡'
const DARK_MODE = '🌚'
const LIGHT_MODE = '🌞'
const HAPPY_BTN = '😁'
const SURPRISED_BTN = '😯'
const ANGRY_BTN = '🤯'
const WINNER_BTN = '😎'

var gLevel = {
    SIZE: 10,
    MINES: 20,
}

var gGame = {
    isOn: true,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    liveCount: 3,
    hintCount: 3,
    numOfFlags: 0,
}

var gIsFirstClick = true
var gIsHint = false

// The function called when page loads
function onInit() {
    gElapsedTime = 0
    gStartTime = 0
    gGame.isOn = true
    const elResetBtn = document.querySelector('.reset-btn')
    elResetBtn.innerText = HAPPY_BTN
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.liveCount = 3
    gGame.hintCount = 3
    gIsHint = false
    gIsFirstClick = true
    gGame.numOfFlags = gLevel.MINES
    clearInterval(gTimerInterval)
    renderTimer()
    gBoard = buildBoard()
    renderBoard(gBoard)
    renderLives()
    renderHint()
    renderFlags()
    resetHintsBtn()
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

    if (gIsFirstClick) {
        gBoard = placeMinesAndCountNeighbors(gBoard, i, j)
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

function isVictory() {
    const elHitMines = document.querySelectorAll('.mine-hit')
    const isAllCellsRevealed = gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES + gGame.numOfFlags

    var totalMarkedMines = gGame.markedCount + gGame.numOfFlags
    var isAllMinesMarked = totalMarkedMines === gLevel.MINES

    return isAllCellsRevealed && isAllMinesMarked
}

function onHintClicked(elHintBtn) {
    if (gIsFirstClick) return
    gIsHint = true
    elHintBtn.classList.add('highlighted-hint')
}

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

function resetHintsBtn() {
    const elHints = document.querySelectorAll('.hint')
    if (elHints) {
        for (var i = 0; i < elHints.length; i++) {
            elHints[i].hidden = false
            elHints[i].classList.remove('highlighted-hint')
        }
    }
}

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

function getTimeByString(timerStr) {
    if (!timerStr) return null

    const timerArr = timerStr.split(':')
    if (timerArr.length < 2) return null

    const timer = { seconds: parseInt(timerArr[0]), milliSeconds: parseInt(timerArr[1]) }
    return timer
}

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
