'use strict'

var gTimerInterval
var gStartTime
var gElapsedTime = 0

function startTimer() {
    gElapsedTime = 0
    gStartTime = Date.now()
    gTimerInterval = setInterval(() => {
        gElapsedTime = Date.now() - gStartTime
        renderTimer()
    }, 10)
}

function renderTimer() {
    const seconds = (parseInt(gElapsedTime / 1000) + '').padStart(2, 0)
    const milliSeconds = ((gElapsedTime % 1000) + '').padStart(3, 0)
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = `${seconds}:${milliSeconds}`
}

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min //The maximum is inclusive and the minimum is inclusive
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'
    var color = '#'
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

function createMat(ROWS, COLS) {
    const mat = []
    for (var i = 0; i < ROWS; i++) {
        const row = []
        for (var j = 0; j < COLS; j++) {
            row.push('')
        }
        mat.push(row)
    }
    return mat
}

function copyMat(mat) {
    var newMat = []
    for (var i = 0; i < mat.length; i++) {
        newMat[i] = []
        for (var j = 0; j < mat[0].length; j++) {
            newMat[i][j] = mat[i][j]
        }
    }
    return newMat
}

function renderCell(location, strHTML) {
    const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
    elCell.innerHTML = strHTML
}
