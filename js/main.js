'use strict'

const MINE = '💣'
const MARK = '🚩'
const EMPTY = ''
const LIVE = '❤️'
const HINT = '💡'
const DARK_MODE = '🌚'
const LIGHT_MODE = '🌞'

var gBoard
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
}

var gIsFirstClick = true
var gIsHint = false

var elBoard = document.querySelector('.board')
elBoard.addEventListener('contextmenu', (e) => {
    e.preventDefault()
})

// The function called when page loads
function onInit() {
    gGame.isOn = true
    const elResetBtn = document.querySelector('.reset-btn')
    elResetBtn.innerText = '😁'
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.liveCount = 3
    gIsFirstClick = true

    gBoard = buildBoard()
    renderBoard(gBoard)
    renderLives()
    renderHint()
}

function buildBoard() {
    // Building a blank board
    var board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([])
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: EMPTY,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
        }
    }
    return board
}

// The function builds and returns the board,
//creates random mines and counts each cell how many mines are around it
function placeMinesAndCountNeighbors(board, firstClickI, firstClickJ) {
    //Adds mines randomly according to
    //the number of mines that should be in relation to the size of the board
    var placeMines = 0
    while (placeMines < gLevel.MINES) {
        const idxI = getRandomInt(0, gLevel.SIZE)
        const idxJ = getRandomInt(0, gLevel.SIZE)
        if (!board[idxI][idxJ].isMine && idxI !== firstClickI && idxJ !== firstClickJ) {
            board[idxI][idxJ].isMine = true
            const elCell = document.querySelector(`[data-i="${idxI}"][data-j="${idxJ}"]`)
            elCell.classList.add('mine')

            placeMines++
        }
    }
    // board[1][1].isMine = true
    // board[2][2].isMine = true

    //Counting for each cell how many mined neighbors it has
    setMinesNegsCount(board)

    return board
}

//The function uses the auxiliary function countMinesAround
//and defines for each cell how many mined neighbors it has
function setMinesNegsCount(board) {
    var negCount = 0
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            const currCell = board[i][j]
            if (!currCell.isMine) currCell.minesAroundCount = countMinesAround(board, i, j)
        }
    }
}

//The function counts mines around each cell
function countMinesAround(board, cellI, cellJ) {
    var negsCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= board[i].length) continue
            if (board[i][j].isMine) negsCount++
        }
    }
    return negsCount
}

//The function Render the board as a <table> to the page
function renderBoard(board) {
    renderLives()
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'

        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j]
            var strData = `data-i="${i}" data-j="${j}"`

            strHTML += `<td ${strData}
                            onclick="onCellClicked(this,${i},${j})"
                             oncontextmenu="onCellMarked(this)">
                        </td>`
        }

        strHTML += '</tr>'
    }

    const elBoard = document.querySelector('.board')

    elBoard.innerHTML = strHTML
}

//The function reveals the cell with each click as needed
//and updates the model
function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return
    var cell = gBoard[i][j]

    // if (gIsHint && hintCount) {
    //     showNegsAround(gBoard, i, j)
    //     gIsHint = false
    //     return
    // }

    if (gIsFirstClick) {
        gBoard = placeMinesAndCountNeighbors(gBoard, i, j)
        gIsFirstClick = false
    }

    if (cell.isShown || cell.isMarked) return

    cell.isShown = true
    gGame.shownCount++
    if (cell.isMine) {
        gGame.liveCount--
        renderLives()
        elCell.innerText = MINE
        elCell.classList.add('mine-hit')
        elCell.classList.remove('mine')
        if (gGame.liveCount === 0) {
            revealAllMines()
            gGame.isOn = false
        }
    } else {
        elCell.innerText = cell.minesAroundCount || EMPTY
        elCell.classList.add('revealed')
        if (cell.minesAroundCount === 0) expandShown(gBoard, elCell, i, j)
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
    } else {
        elCell.innerText = MARK
        gGame.markedCount++
    }

    cell.isMarked = !cell.isMarked
    checkGameOver()
}

function checkGameOver() {
    const elResetBtn = document.querySelector('.reset-btn')
    if (gGame.liveCount === 0) {
        gGame.isOn = false
        elResetBtn.innerText = '🤯'
        return
    } else if (isVictory()) {
        gGame.isOn = false
        elResetBtn.innerText = '😎'
        alert('You Win!')
    }
}

function isVictory() {
    return gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES && gGame.markedCount === gLevel.MINES
}

function expandShown(board, elCell, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= board[0].length) continue
            var currCell = board[i][j]
            if (currCell.isMarked === true || currCell.isShown) continue
            var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
            elCell.innerText = currCell.minesAroundCount || EMPTY
            elCell.classList.add('revealed')
            currCell.isShown = true
            gGame.shownCount++
        }
    }
}

function changeBoard(size, mines) {
    gLevel.SIZE = size
    gLevel.MINES = mines
    onInit()
}

function renderLives() {
    var strHTML = ''
    for (var i = 0; i < gGame.liveCount; i++) {
        strHTML += LIVE
    }
    const elH3Live = document.querySelector('.live')
    elH3Live.innerText = strHTML
}

function renderHint() {
    var strHTML = ''
    const elHintsBtn = document.querySelectorAll('.hint')
    for (var i = 0; i < gGame.hintCount; i++) {
        strHTML += HINT
        elHintsBtn[i].innerText = strHTML
        strHTML = ''
    }
}

function revealAllMines() {
    const elMines = document.querySelectorAll('.mine')
    for (var i = 0; i < elMines.length; i++) {
        console.log('elMines[i]:', elMines[i])
        elMines[i].innerText = MINE
        elMines[i].classList.add('revealed')
    }
}

function onHintClicked(elHintBtn) {
    gIsHint = true
    gGame.hintCount--
    elHintBtn.style.backgroundColor = 'yellow'
}

// TODO: Add setTimeout and use this function inside onCellClicked when a hint is used
function showNegsAround(board, cellI, cellJ) {
    var revealedCells = []
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            var currCell = board[i][j]
            if (!currCell.isShown && !currCell.isMarked) {
                var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
                elCell.innerText = currCell.minesAroundCount || EMPTY
                elCell.classList.add('revealed')
                revealedCells.push(elCell)
            }
        }
    }
}
