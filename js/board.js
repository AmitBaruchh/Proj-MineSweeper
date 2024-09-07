'use strict'

var gBoard

// Prevents the default context menu when right-clicking on the game board
var elBoard = document.querySelector('.board')
elBoard.addEventListener('contextmenu', (e) => {
    e.preventDefault()
})

// Builds the game board with empty cells
function buildBoard() {
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

// Changes the board size and number of mines, then reinitializes the game
function changeBoard(size, mines) {
    gLevel.SIZE = size
    gLevel.MINES = mines
    onInit()
}

// ----- Placing Mines and Counting Neighbors -----

// Places random mines on the board and counts neighboring mines for each cell
function placeMinesRandomAndCountNeighbors(board, firstClickI, firstClickJ) {
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

    setMinesNegsCount(board) // Counts neighboring mines for all cells

    return board
}

// Sets the count of neighboring mines for each cell on the board
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            const currCell = board[i][j]
            if (!currCell.isMine) currCell.minesAroundCount = countMinesAround(board, i, j)
        }
    }
}

// ----- Rendering the Board -----

// Renders the board as a table on the webpage
function renderBoard(board) {
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'

        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j]
            var strData = `data-i="${i}" data-j="${j}"`

            strHTML += `<td ${strData}
                            onclick="onCellClicked(this,${i},${j})"
                             oncontextmenu="onCellMarked(this)">`
            if (currCell.isShown) {
                if (currCell.isMine) strHTML += MINE
                else if (currCell.minesAroundCount > 0) strHTML += currCell.minesAroundCount
            } else {
                if (currCell.isMarked) strHTML += MARK
            }
            ;`</td>`
        }

        strHTML += '</tr>'
    }
    const elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML
}

// ----- Rendering UI Elements -----

// Renders the number of lives remaining
function renderLives() {
    var strHTML = ''
    if (gGame.liveCount > gLevel.MINES) gGame.liveCount = gLevel.MINES - 1
    for (var i = 0; i < gGame.liveCount; i++) {
        strHTML += LIVE
    }
    document.querySelector('.live').innerText = strHTML
}

// Renders the available hints on the game board
function renderHint() {
    var strHTML = ''
    const elHintsBtn = document.querySelectorAll('.hint')
    for (var i = 0; i < gGame.hintCount; i++) {
        strHTML += HINT
        elHintsBtn[i].innerText = strHTML
        strHTML = ''
    }
}

// Renders the number of flags (mines marked)
function renderFlags() {
    const elFlagsBtn = document.querySelector('.flags')
    elFlagsBtn.innerText = gGame.numOfFlags
}

// ----- Revealing Mines and Cells -----

// Reveals all mines on the board at the end of the game
function revealAllMines() {
    const elMines = document.querySelectorAll('.mine')
    for (var i = 0; i < elMines.length; i++) {
        elMines[i].innerText = MINE
        elMines[i].classList.add('revealed')
    }
}

// Reveals neighboring cells when a hint is clicked
function revealNeighbors(board, cellI, cellJ) {
    var revealedCells = getNegsCells(board, cellI, cellJ)
    toggleReveal(revealedCells, true)

    setTimeout(() => {
        toggleReveal(revealedCells, false)
        var elHintBtn = document.querySelector('.highlighted-hint')
        if (elHintBtn) {
            elHintBtn.hidden = true
            elHintBtn.classList.remove('highlighted-hint')
        }
    }, 1000)
}

// Toggles the reveal state for neighboring cells
function toggleReveal(negs, isRevealing) {
    for (var i = 0; i < negs.length; i++) {
        var currCell = gBoard[negs[i].i][negs[i].j]
        if (!currCell.isShown && !currCell.isMarked) {
            var elCell = document.querySelector(`[data-i="${negs[i].i}"][data-j="${negs[i].j}"]`)
            if (isRevealing) {
                if (currCell.isMine) elCell.innerText = MINE
                else elCell.innerText = currCell.minesAroundCount || EMPTY
                elCell.classList.add('revealed')
            } else {
                elCell.innerText = EMPTY
                elCell.classList.remove('revealed')
            }
        }
    }
}

// ----- Cell Expansion Logic -----

// Expands and reveals neighboring cells if they have no surrounding mines
function expandShown(board, elCell, rowIdx, colIdx) {
    elCell.innerText = EMPTY
    elCell.classList.add('revealed')
    var currCell = board[rowIdx][colIdx]

    if (!currCell.isShown) {
        currCell.isShown = true
        gGame.shownCount++
    }
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= board[0].length) continue
            showCell(i, j)
        }
    }
}

// Recursively expands and reveals all cells without mines around them
function fullExpandShow(board, rowIdx, colIdx) {
    if (rowIdx < 0 || rowIdx >= board.length || colIdx < 0 || colIdx >= board[0].length) return
    var currCell = board[rowIdx][colIdx]

    if (currCell.isMine || currCell.isShown) return
    showCell(rowIdx, colIdx)

    if (countMinesAround(board, rowIdx, colIdx) === 0) {
        for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
            if (i < 0 || i >= board.length) continue
            for (var j = colIdx - 1; j <= board[i].length; j++) {
                if (j < 0 || j >= board[i].length) continue
                if (!(i === rowIdx && j === colIdx)) fullExpandShow(board, i, j)
            }
        }
    }
}

// Reveals a single cell on the board
function showCell(i, j) {
    var currCell = gBoard[i][j]
    if (currCell.isMarked === true || currCell.isShown) return
    var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    elCell.innerText = currCell.minesAroundCount || EMPTY
    elCell.classList.add('revealed')

    if (!currCell.isShown) {
        currCell.isShown = true
        gGame.shownCount++
    }
}
