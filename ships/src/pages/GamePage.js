import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ActionsInfo from "../components/ActionsInfo"
import BoardComponent from "../components/BoardComponent"
import { Board } from "../models/Board"

const wss = new WebSocket("ws://localhost:1337")

const GamePage = () => {
  const [myBoard, setMyBoard] = useState(new Board())
  const [enemyBoard, setEnemyBoard] = useState(new Board())
  const [enemyName, setEnemyName] = useState("")
  const [shipsReady, setShipsReady] = useState(false)
  const [canShoot, setCanshoot] = useState(false)

  const { gameId } = useParams()
  const navigate = useNavigate()

  function restart() {
    const newMyBoard = new Board()
    const newEnemyBoard = new Board()
    newMyBoard.initCels()
    newEnemyBoard.initCels()
    setMyBoard(newMyBoard)
    setEnemyBoard(newEnemyBoard)
  }

  function shoot(x, y) {
    wss.send(JSON.stringify({event: 'shoot', payload: {username: localStorage.nickname, x, y, gameId}}))
  }

  wss.onmessage = function (res) {
    const { type, payload } = JSON.parse(res.data)
    const { username, x, y, canStart, enemyName, success } = payload

    switch (type) {
      case "connectToPlay":
        if (!success) {
          return navigate("/")
        }
        setEnemyName(enemyName)
        break
      case "readyToPlay":
        if (payload.username === localStorage.nickname && canStart) {
          setCanshoot(true)
        }
        break

      case "afterShootByMe":
        console.log("afterShoot", username !== localStorage.nickname)
        if (username !== localStorage.nickname) {
          const isPerfectHit = myBoard.cells[y][x].mark?.name === "ship"
          changeBoardAfterShoot(myBoard, setMyBoard, x, y, isPerfectHit)
          wss.send(
            JSON.stringify({
              event: "checkShoot",
              payload: { ...payload, isPerfectHit },
            })
          )
          if (!isPerfectHit) {
            setCanshoot(true)
          }
        }
        break
      case "isPerfectHit":
        if (username === localStorage.nickname) {
          changeBoardAfterShoot(
            enemyBoard,
            setEnemyBoard,
            x,
            y,
            payload.isPerfectHit
          )
          payload.isPerfectHit ? setCanshoot(true) : setCanshoot(false)
        }
        break
      default:
        break
    }
  }

  function changeBoardAfterShoot(board, setBoard, x, y, isPerfectHit) {
    isPerfectHit ? board.addDamage(x,y) : board.addMiss(x,y)
    const newBoard = board.getCopyBoard()
    setBoard(newBoard)
  }
  function ready() {
    wss.send(JSON.stringify({event: 'ready', payload: { username: localStorage.nickname, gameId}}))
    setShipsReady(true)
  }

  useEffect(() => {
    wss.send(
      JSON.stringify({
        event: "connect",
        payload: { username: localStorage.nickname, gameId },
      })
    )
    restart()
  }, [])

  

  return (
    <div>
      <p>Welcome to Warships</p>
      <div className="boards-container">
        <div>
          <p className="nick">{localStorage.nickname}</p>
          <BoardComponent
            board={myBoard}
            isMyBoard
            setBoard={setMyBoard}
            canShoot={false}
            shipsReady={shipsReady}
          />
        </div>
        <div>
          <p className="nick">{enemyName || "Enemy"}</p>
          <BoardComponent
            board={enemyBoard}
            setBoard={setEnemyBoard}
            canShoot={canShoot}
            shoot={shoot}
            shipsReady={shipsReady}
          />
        </div>
      </div>
      <ActionsInfo ready={ready} canShoot={canShoot} shipsReady={shipsReady}/>
    </div>
  )
}

export default GamePage
