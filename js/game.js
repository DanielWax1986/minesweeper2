'use strict'
localStorage.setItem("bestPlayer", "Daniel");
localStorage.setItem("bestTime", "200");
var gBoard
var gClockInterval
const gEmoJi = {
            MINE: '💣',
            FLAG: '🚩',
            HAPPY: '🙂',
            SCARED: '😨',
            WIN: '😎',
            LOSE: '☠',
            }

var gLevel = {
    SIZE: 4,
    MINES: 2,

}

var gGame = {isOn: true, 
            emptyCoords: [], 
            shownCount: 0,  
            secsPassed: 0, 
            isFirstClick: true, 
            lifeCount: 3,
            mineExploded: 0,
            lastMineCoord: {}, 
            safeClickLeft: 3,
            moves: [], 
            minesToInput: 2,
            wrongChoise: false,
            useHint: false,
            hints: 3,
            
}

function initGame(){
    resetGame()
    buildBoard()
    renderBoard(gBoard)
}

function buildBoard(){
    gBoard = []
    for (var i = 0; i < gLevel.SIZE; i++){
        gBoard.push([])
        for (var j = 0; j < gLevel.SIZE; j++){
            gBoard[i][j] = {
                location: {i,j},
                isShown: false,
                isMarked: false,
                containing: '',
                wasShown: false
            }
        }
    }
}

function renderBoard(board = gBoard){
    var strHTML = '<table>\n'
    for (var i = 0; i < gLevel.SIZE; i++){
        strHTML += '<tr>\n'
        for (var j = 0; j < gLevel.SIZE; j++){
            if (board[i][j].isShown){
                var showCell = board[i][j].containing
                var cellClicked = 'clicked'
            } else {
                var showCell = ''
                var cellClicked = 'un-clicked'
            }
            showCell = (board[i][j].isMarked) ? gEmoJi.FLAG : showCell    
            strHTML += `<td class="cell cell-${i}-${j} ${cellClicked}"
            onmousedown="cellClicked(event,this,${i},${j})">${showCell}</td>\n`
        }
        strHTML += '\n'
    }
    strHTML += '</table>'
    var elBoard = document.querySelector('.main-content')
    elBoard.innerHTML = strHTML
}
function firstClick(event,el, i, j){
    if (gGame.isManually){
        inputMines(el,i,j)
        return
    }
    gClockInterval = setInterval(clock, 10)
    insertMines(i,j)
    setMinesNegsCount(gBoard)
    gBoard[i][j].isShown = true
    gGame.moves.push(0)  
    gGame.moves.push({i,j}) 
    gGame.shownCount++
    expandShown(gBoard,el,i,j)
    gGame.moves.push(1) 
    renderBoard(gBoard)
    el.classList.remove("un-clicked");
    el.classList.add("clicked");
    gGame.isFirstClick = false
}


function gameClick(event,el, i, j){
    if (gBoard[i][j].isShown) return
    var elEmoji = document.querySelector('.emoji')
    if (gBoard[i][j].containing === gEmoJi.MINE){
        gBoard[i][j].isShown = true
        gGame.moves.push({i,j})
        elEmoji.innerText = gEmoJi.SCARED
        gGame.shownCount++
        if (gGame.markedCount !== gLevel.MINES) gGame.lifeCount--
        var elLife = document.querySelector('.lives')
        var strText = ' 💙 '.repeat(gGame.lifeCount)
        strText += ' 💙 '.repeat(3 - gGame.lifeCount)
        if (gLevel.SIZE === 4){
            var strText2 = ' 💔 '.repeat(gGame.lifeCount - 1)
            strText2 += ' 💔 '.repeat(3 - gGame.lifeCount)
        }
        elLife.innerText = (gLevel.SIZE === 4) ? strText2 : strText
        var elMinesLeft = document.querySelector('.mines')
        elMinesLeft.innerHTML = gLevel.MINES - gGame.markedCount - 3 + gGame.lifeCount
        gGame.mineExploded++
        gGame.lastMineCoord = {i,j}
        renderBoard(gBoard)
        setTimeout(makeExplosion,500)
        if (checkGameOver()){
            clearInterval(gClockInterval)
            if (gGame.wrongChoise){
                elEmoji.innerText = gEmoJi.LOSE
                gGame.isOn = false
                return
            }
            elEmoji.innerText = gEmoJi.LOSE
            revealAllMines()
            gGame.isOn = false
            return
        }
    }
    var isNumber = typeof(gBoard[i][j].containing) === 'number'
    if (isNumber){
        gBoard[i][j].isShown = true
        gGame.moves.push({i,j})
        gGame.shownCount++
        renderBoard(gBoard)
    }
    if (gBoard[i][j].containing === ''){
        gBoard[i][j].isShown = true
        gGame.moves.push(0)
        gGame.moves.push({i,j})
        gGame.shownCount++
        expandShown(gBoard,el,i,j)
        gGame.moves.push(1)
        renderBoard(gBoard)
    }
    if (checkGameOver()){
        clearInterval(gClockInterval)
        if (gGame.wrongChoise){
            elEmoji.innerText = gEmoJi.LOSE
            gGame.isOn = false
            return
        }
        elEmoji.innerText = gEmoJi.WIN
        setTimeout(checkBestWiner,500)
    } 
}


function cellClicked(event,el, i, j){
    if (!gGame.isOn) return
    if (event.button === 2 && !gBoard[i][j].isShown){ 
        if (gGame.markedCount === gLevel.MINES) return
        if (gBoard[i][j].containing !== gEmoJi.MINE){
            gGame.wrongChoise = true
        }
        cellMarked(el,i,j) 
        if (checkGameOver()){ 
            clearInterval(gClockInterval)
            var elEmoji = document.querySelector('.emoji')
            if (gGame.wrongChoise){
                elEmoji.innerText = gEmoJi.LOSE
                gGame.isOn = false
                return
            }
            elEmoji.innerText = gEmoJi.WIN
            gGame.isOn = false
            setTimeout(checkBestWiner,500)
        } 
    }
    if(event.button === 0){    
        if (gGame.useHint) {  
            hintClick(i,j)
        }
        if (gBoard[i][j].isMarked) return 
        if (gGame.isFirstClick){ 
            firstClick(event,el, i, j)
            return
        }
        if (!gGame.isFirstClick){
            gameClick(event,el, i, j)
        }
    }
}


function insertMines(idx,jdx){
    findCellsForMines(idx,jdx)
    for (var i = 1; i <= gLevel.MINES; i++){
        var x = getRandomInt(0,gGame.emptyCoords.length)
        var id = gGame.emptyCoords[x] 
        gBoard[id.i][id.j].containing = gEmoJi.MINE 
        gGame.emptyCoords.splice(x,1)
    }
}

function setMinesNegsCount(board){
    for (var i = 0; i < board.length; i++){
        for (var j = 0; j <  board.length; j++){  
            if (board[i][j].containing === gEmoJi.MINE) continue
            var mineCounter = negsCellCheck(board,i,j)   
            if (mineCounter === 0){
                board[i][j].containing = ''
            }else {
                board[i][j].containing = mineCounter
            }
        }
    }
}

function findCellsForMines(idx,jdx){
    gGame.emptyCoords = []
    for (var i = 0; i < gBoard.length; i++){
        for (var j = 0; j <  gBoard.length; j++){
            if ( i >= idx - 1 && i <= idx + 1 && j >= jdx - 1 && j <= jdx + 1) continue
            gGame.emptyCoords.push({i,j})
        }
    }
}

function negsCellCheck(board,i,j){  
    var mineCounter = 0
    for (var idx = -1; idx  <=  1; idx++){
        for (var jdx = -1; jdx <=  1; jdx++){ 
            if (i + idx < 0 || j + jdx < 0 || 
            i + idx === board.length || j + jdx === board.length || 
            (idx === 0 && jdx === 0)) continue 
            if (board[i + idx][j + jdx].containing === gEmoJi.MINE){
                mineCounter++
            }
        }
    }
    return mineCounter
}


function expandShown(board, elCell, i, j){
    for (var idx = -1; idx  <=  1; idx++){
        for (var jdx = -1; jdx <=  1; jdx++){ 
            if (i + idx < 0 || j + jdx < 0 || 
            i + idx === board.length || j + jdx === board.length ||(idx === 0 && jdx === 0)) continue 
            if (board[i + idx][j + jdx].isShown) continue
            if (board[i + idx][j + jdx].isMarked) continue
            gBoard[i + idx][j + jdx].isShown = true 
            gGame.moves.push({i: i + idx,j: j + jdx})
            gGame.shownCount++
            if (gBoard[i + idx][j + jdx].containing === ''){
                expandShown(gBoard, elCell, i + idx, j + jdx)
            }
        }
    }

}


function cellMarked(el,i,j){
    var elMinesLeft = document.querySelector('.mines')
    if(gBoard[i][j].isMarked){ 
        el.innerHTML = ''
        gGame.markedCount--
    } else{
        el.innerHTML = gEmoJi.FLAG
        gGame.markedCount++
    } 
    elMinesLeft.innerHTML = gLevel.MINES - gGame.markedCount - 3 + gGame.lifeCount
    gBoard[i][j].isMarked = !gBoard[i][j].isMarked
}

function checkGameOver(){
    if (gGame.lifeCount === 0 || gGame.mineExploded === gLevel.MINES ||
        (gGame.shownCount + gGame.markedCount === (gLevel.SIZE ** 2)) 
        ){
            gGame.isOn = false
            return true
    }
}

function choseLevel(level,mines){
    gLevel.SIZE = level
    gLevel.MINES = mines
    initGame()
}




function userFace(event,el){
    el.innerText = gEmoJi.HAPPY
    initGame()
}

function revealAllMines(){
    for (var i = 0; i < gBoard.length; i++){
        for (var j = 0; j <  gBoard.length; j++){
            if (gBoard[i][j].containing === gEmoJi.MINE){
                gBoard[i][j].isShown = true
            }
        }
    }
    renderBoard(gBoard)
    setTimeout(finishExplose,500)
}


function checkBestWiner(){
    if (+localStorage.getItem("bestTime") > gSeconds){
        var bestTime = gSeconds + ''
        var bestPlayer = prompt('you are the best! what is your name?')
        localStorage.bestTime = bestTime;
        localStorage.bestPlayer = bestPlayer;
        var elPlayer = document.querySelector('.player')
        var elTime = document.querySelector('.time')
        elPlayer.innerHTML = bestPlayer
        elTime.innerHTML = bestTime
    }
}

function resetGame(){
    gGame = {isOn: true, 
        emptyCoords: [],        
        shownCount: 0, 
        markedCount: 0, 
        secsPassed: 0,
        isFirstClick: true,
        lifeCount: 3,
        mineExploded: 0,
        lastMineCoord: {}, 
        safeClickLeft: 3,
        moves: [],
        isManually: false,
        minesToInput: gLevel.MINES,
        wrongChoise: false,
        useHint: false, 
        hints: 3,
    }
    if (gLevel.SIZE === 4){
        var elLife = document.querySelector('.lives')
        elLife.innerText = '💙 💙 '
    }else{
        var elLife = document.querySelector('.lives')
        elLife.innerText = '💙  '.repeat(gGame.lifeCount)
    }
    var elMinesLeft = document.querySelector('.mines')
    elMinesLeft.innerHTML = gLevel.MINES - gGame.markedCount - 3 + gGame.lifeCount
    var elBtn = document.querySelector('.hints')
    elBtn.innerText = '💡  💡  💡'
    var elSafe = document.querySelector('.btn')
    if (elSafe.classList){
        elSafe.classList.remove('safeBtn')
    } 
    resetClock() 
}


function safeClick(el){
    if (!gGame.isOn) return
    if (gGame.safeClickLeft === 0){
        return
    } 
    if (gGame.safeClickLeft === 1){
        el.classList.add('safeBtn')
    }
    if (gGame.isFirstClick){
        var i = getRandomInt(0,gBoard.length)
        var j = getRandomInt(0,gBoard.length)
        var elCell = document.querySelector(`.cell-${i}-${j}`)
        elCell.classList.add('safe')
        elCell.innerText = '🦺'
        gGame.safeClickLeft--
    } else{
        if (gGame.shownCount === gLevel.SIZE**2 - gLevel.MINES){
            var foundEmptyCoord = true
            var i
            var j
            for (var i = 0;i < gLevel.SIZE;i++){
                for (var j = 0;j < gLevel.SIZE;j++){
                    if (gBoard[i][j].containing === gEmoJi.MINE){
                        var elCell = document.querySelector(`.cell-${i}-${j}`)
                        elCell.classList.add('safe')
                        elCell.innerText = gEmoJi.FLAG
                        gGame.safeClickLeft--
                        return
                    }
                }
            }
        }
        var foundEmptyCoord = true
        var i
        var j
        while(foundEmptyCoord){
            i = getRandomInt(0,gBoard.length)
            j = getRandomInt(0,gBoard.length)
            if (!gBoard[i][j].isShown && gBoard[i][j].containing !== gEmoJi.MINE){
                var elCell = document.querySelector(`.cell-${i}-${j}`)
                elCell.classList.add('safe')
                elCell.innerText = '🦺'
                foundEmptyCoord = false
                gGame.safeClickLeft--
            }

        }
    }
}

function manually(el){
    initGame()
    gGame.isManually = true
}

function inputMines(el,i,j){
    gBoard[i][j].containing = gEmoJi.MINE
    el.innerHTML = gEmoJi.MINE
    gGame.minesToInput--
    if (gGame.minesToInput === 0){
        gGame.isManually = false
        setTimeout(renderBoard,1000)
        gClockInterval = setInterval(clock, 10)
        setMinesNegsCount(gBoard)
        gGame.isFirstClick = false
    }
}

function undo(el){
    if (gGame.moves.length === 0) return
    if (gGame.moves[gGame.moves.length - 1] === 1){
        gGame.moves.splice(gGame.moves.length - 1,1)
        while (gGame.moves[gGame.moves.length - 1] !== 0){
            var idx = gGame.moves[gGame.moves.length - 1].i
            var jdx = gGame.moves[gGame.moves.length - 1].j
            gGame.moves.splice(gGame.moves.length - 1,1)
            gBoard[idx][jdx].isShown = false
        }
        gGame.moves.splice(gGame.moves.length - 1,1)
        renderBoard(gBoard)
        return
    }
    var idx = gGame.moves[gGame.moves.length - 1].i
    var jdx = gGame.moves[gGame.moves.length - 1].j
    gGame.moves.splice(gGame.moves.length - 1,1)
    gBoard[idx][jdx].isShown = false
    renderBoard(gBoard)
}




