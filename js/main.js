'use strict'

const MINE = '💣'
const MARK = '🚩'
const EMPTY = ''
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
}

var elBoard = document.querySelector('.board')
elBoard.addEventListener('contextmenu', (e) => {
    e.preventDefault()
})

// The function called when page loads
function onInit() {
    gBoard = buildBoard()
    console.table(gBoard)
    renderBoard(gBoard)
}

// The function builds and returns the board,
//creates random mines and counts each cell how many mines are around it
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

    //Adds mines randomly according to
    //the number of mines that should be in relation to the size of the board
    for (var i = 0; i < gLevel.MINES; i++) {
        const idxI = getRandomInt(0, gLevel.SIZE)
        const idxJ = getRandomInt(0, gLevel.SIZE)
        board[idxI][idxJ].isMine = true
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
function countMinesAround(mat, cellI, cellJ) {
    var negsCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= mat[i].length) continue
            if (mat[i][j].isMine) negsCount++
        }
    }
    return negsCount
}

//The function Render the board as a <table> to the page
function renderBoard(board) {
    // console.table(board)
    var strHTML = ''

    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'

        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j]
            var className = currCell.isMine ? MINE : currCell.minesAroundCount
            var strData = `data-i="${i}" data-j="${j}"`

            strHTML += `<td ${strData}
                            onclick="onCellClicked(this,${i},${j})"
                             oncontextmenu="onCellMarked(this)">
                        </td>`
        }

        strHTML += '</tr>'
    }

    // console.log('strHTML:', strHTML)

    const elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML
}

//The function reveals the cell with each click as needed
//and updates the model
function onCellClicked(elCell, i, j) {
    var cell = gBoard[i][j]

    if (cell.isShown || cell.isMarked) return

    cell.isShown = true
    gGame.shownCount++
    if (cell.isMine) {
        elCell.innerText = MINE
        elCell.classList.add('mine-hit')
    } else {
        elCell.innerText = cell.minesAroundCount || EMPTY
        elCell.classList.add('revealed')
    }

    if (cell.minesAroundCount === 0) expandShown(gBoard, elCell, i, j)

    checkGameOver()
}

//The function is triggered when the user right-clicks on a cell.
//If the cell is marked, it removes the mark, and if not, it adds a flag.
function onCellMarked(elCell) {
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
    // console.log('gGame.shownCount:', gGame.shownCount)
    // console.log('gLevel.SIZE :', gLevel.SIZE)
    // console.log('gLevel.MINES:', gLevel.MINES)
    // console.log('gGame.markedCount:', gGame.markedCount)
    // console.log('gLevel.MINES:', gLevel.MINES)

    if (gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES && gGame.markedCount === gLevel.MINES) {
        gGame.isOn = false
        console.log('if')
    }

    console.log('gGame.isOn:', gGame.isOn)

    return !gGame.isOn
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


function changeBoard(size , mines) {
    gLevel.SIZE = size
    gLevel.MINES = mines 
    onInit()
}
