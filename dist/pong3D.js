var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as BABYLON from '@babylonjs/core';
const canvas3D = document.getElementById('renderCanvasPong3D'); // Type assertion
let engine3D = null; // Initialize as null, will be set later
const player1NameInput3D = document.getElementById('player1Name3D');
const player2NameInput3D = document.getElementById('player2Name3D');
const roundsSelect3D = document.getElementById('rounds3D');
const roundDurationInput3D = document.getElementById('roundDuration3D');
const ballSpeedSelect3D = document.getElementById('ballSpeed3D');
const startGameButton3D_el = document.getElementById('startGameButton3D');
const quitGameButton3D_el = document.getElementById('quitGameButton3D');
const scorePlayer1Display3D_el = document.getElementById('scorePlayer1Display3D');
const scorePlayer2Display3D_el = document.getElementById('scorePlayer2Display3D');
const timerDisplay3D_el = document.getElementById('timerDisplay3D');
const messageArea3D_el = document.getElementById('messageArea3D');
const roundInfoDisplay3D_el = document.getElementById('roundInfoDisplay3D');
const settingsPanel_el = document.getElementById('settingsPanel');
// Game state enum
var GameState3D;
(function (GameState3D) {
    GameState3D[GameState3D["LOBBY"] = 0] = "LOBBY";
    GameState3D[GameState3D["COUNTDOWN"] = 1] = "COUNTDOWN";
    GameState3D[GameState3D["PLAYING"] = 2] = "PLAYING";
    GameState3D[GameState3D["ROUND_OVER"] = 3] = "ROUND_OVER";
    GameState3D[GameState3D["GAME_OVER"] = 4] = "GAME_OVER";
})(GameState3D || (GameState3D = {}));
// Game variables with types
let scene3D = null; // Initialize as null
let camera3D = null;
let player1Paddle3D = null;
let player2Paddle3D = null;
let ball3D = null;
let topWall3D = null;
let bottomWall3D = null;
let ground3D = null; // Or BABYLON.GroundMesh if specifically using CreateGround
let p1Name3D = "플레이어 1";
let p2Name3D = "플레이어 2";
let scoreP1_3D = 0;
let scoreP2_3D = 0;
let currentRound3D_val = 0;
let totalRounds3D_val = 3;
let roundTimeLimit3D_val = 60;
let currentRoundTime3D_val = 0;
let ballSpeedMultiplier3D_val = 1.0;
let gameState3D_val = GameState3D.LOBBY;
const PADDLE_HEIGHT_3D = 4;
const PADDLE_WIDTH_3D = 0.5;
const PADDLE_DEPTH_3D = 0.5;
const BALL_RADIUS_3D = 0.3;
const COURT_WIDTH_3D = 20;
const COURT_HEIGHT_3D = 12;
const COURT_DEPTH_3D = 10; // Not directly used for ground dimensions now, but kept for context
const PADDLE_SPEED_3D = 0.3;
const BASE_BALL_SPEED_X_3D = 0.15;
let ballVelocity3D = new BABYLON.Vector3(0, 0, 0);
let inputMap3D = {}; // Or {[key: string]: boolean}
let roundTimerInterval3D; // Stores the interval ID from setInterval
let shadowGenerator3D = null;
function createScene3D_func() {
    if (!engine3D) { // Check if engine3D is truly initialized
        console.error("Engine not initialized at the start of createScene3D_func");
        throw new Error("Engine not initialized");
    }
    const newScene = new BABYLON.Scene(engine3D);
    newScene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.1, 1); // Ensure alpha is 1
    camera3D = new BABYLON.UniversalCamera("gameCamera3D", new BABYLON.Vector3(0, 5, -22), newScene);
    camera3D.setTarget(new BABYLON.Vector3(0, 0, 0));
    camera3D.fov = 0.7;
    const light3D_scene = new BABYLON.HemisphericLight("light1_3D_scene", new BABYLON.Vector3(0, 1, 0), newScene);
    light3D_scene.intensity = 0.6;
    const dirLight3D_scene = new BABYLON.DirectionalLight("dirLight_3D_scene", new BABYLON.Vector3(-0.5, -1, -1), newScene);
    dirLight3D_scene.intensity = 0.7;
    dirLight3D_scene.position = new BABYLON.Vector3(10, 20, 20);
    const paddleMaterial1_3D = new BABYLON.StandardMaterial("paddleMat1_3D", newScene);
    paddleMaterial1_3D.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.9);
    paddleMaterial1_3D.emissiveColor = new BABYLON.Color3(0.1, 0.25, 0.4);
    player1Paddle3D = BABYLON.MeshBuilder.CreateBox("player1Paddle3D", { height: PADDLE_HEIGHT_3D, width: PADDLE_WIDTH_3D, depth: PADDLE_DEPTH_3D }, newScene);
    player1Paddle3D.material = paddleMaterial1_3D;
    player1Paddle3D.position = new BABYLON.Vector3(-COURT_WIDTH_3D / 2 + 1, 0, 0);
    const paddleMaterial2_3D = new BABYLON.StandardMaterial("paddleMat2_3D", newScene);
    paddleMaterial2_3D.diffuseColor = new BABYLON.Color3(0.9, 0.4, 0.4);
    paddleMaterial2_3D.emissiveColor = new BABYLON.Color3(0.4, 0.15, 0.15);
    player2Paddle3D = BABYLON.MeshBuilder.CreateBox("player2Paddle3D", { height: PADDLE_HEIGHT_3D, width: PADDLE_WIDTH_3D, depth: PADDLE_DEPTH_3D }, newScene);
    player2Paddle3D.material = paddleMaterial2_3D;
    player2Paddle3D.position = new BABYLON.Vector3(COURT_WIDTH_3D / 2 - 1, 0, 0);
    const ballMaterial3D = new BABYLON.StandardMaterial("ballMat3D", newScene);
    ballMaterial3D.diffuseColor = new BABYLON.Color3(1, 1, 0.3);
    ballMaterial3D.emissiveColor = new BABYLON.Color3(0.6, 0.6, 0.1);
    ball3D = BABYLON.MeshBuilder.CreateSphere("ball3D", { diameter: BALL_RADIUS_3D * 2, segments: 16 }, newScene);
    ball3D.material = ballMaterial3D;
    ball3D.position = new BABYLON.Vector3(0, 0, 0);
    const wallMaterial3D = new BABYLON.StandardMaterial("wallMat3D", newScene);
    wallMaterial3D.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.7);
    wallMaterial3D.alpha = 0.6;
    topWall3D = BABYLON.MeshBuilder.CreateBox("topWall3D", { width: COURT_WIDTH_3D, height: 0.3, depth: PADDLE_DEPTH_3D }, newScene);
    topWall3D.position = new BABYLON.Vector3(0, COURT_HEIGHT_3D / 2 + BALL_RADIUS_3D, 0);
    topWall3D.material = wallMaterial3D;
    bottomWall3D = BABYLON.MeshBuilder.CreateBox("bottomWall3D", { width: COURT_WIDTH_3D, height: 0.3, depth: PADDLE_DEPTH_3D }, newScene);
    bottomWall3D.position = new BABYLON.Vector3(0, -COURT_HEIGHT_3D / 2 - BALL_RADIUS_3D, 0);
    bottomWall3D.material = wallMaterial3D;
    ground3D = BABYLON.MeshBuilder.CreateGround("ground3D", { width: COURT_WIDTH_3D, height: COURT_DEPTH_3D * 1.5 }, newScene); // Using COURT_DEPTH_3D for ground depth
    ground3D.position.y = -COURT_HEIGHT_3D / 2 - BALL_RADIUS_3D - 0.2;
    const groundMaterialSimple = new BABYLON.StandardMaterial("groundSimpleMat", newScene);
    groundMaterialSimple.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4); // Example color
    ground3D.material = groundMaterialSimple;
    ground3D.receiveShadows = true;
    if (dirLight3D_scene) { // Ensure light exists before creating shadow generator
        shadowGenerator3D = new BABYLON.ShadowGenerator(1024, dirLight3D_scene);
        if (ball3D)
            shadowGenerator3D.addShadowCaster(ball3D);
        if (player1Paddle3D)
            shadowGenerator3D.addShadowCaster(player1Paddle3D);
        if (player2Paddle3D)
            shadowGenerator3D.addShadowCaster(player2Paddle3D);
    }
    return newScene; // Return the newly created scene
}
function setupInput3D_func() {
    if (!scene3D)
        return; // scene3D can be null, ensure it's checked
    scene3D.actionManager = new BABYLON.ActionManager(scene3D);
    scene3D.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        const keyboardEvent = evt.sourceEvent;
        inputMap3D[keyboardEvent.key.toLowerCase()] = true;
        if (["arrowup", "arrowdown", "w", "s"].includes(keyboardEvent.key.toLowerCase())) {
            keyboardEvent.preventDefault();
        }
    }));
    scene3D.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
        const keyboardEvent = evt.sourceEvent;
        inputMap3D[keyboardEvent.key.toLowerCase()] = false;
        if (["arrowup", "arrowdown", "w", "s"].includes(keyboardEvent.key.toLowerCase())) {
            keyboardEvent.preventDefault();
        }
    }));
}
function updatePaddleMovement3D_func() {
    if (!player1Paddle3D || !player2Paddle3D)
        return;
    const paddleMinY = -COURT_HEIGHT_3D / 2 + PADDLE_HEIGHT_3D / 2;
    const paddleMaxY = COURT_HEIGHT_3D / 2 - PADDLE_HEIGHT_3D / 2;
    if (inputMap3D["w"])
        player1Paddle3D.position.y = Math.min(paddleMaxY, player1Paddle3D.position.y + PADDLE_SPEED_3D);
    if (inputMap3D["s"])
        player1Paddle3D.position.y = Math.max(paddleMinY, player1Paddle3D.position.y - PADDLE_SPEED_3D);
    if (inputMap3D["arrowup"])
        player2Paddle3D.position.y = Math.min(paddleMaxY, player2Paddle3D.position.y + PADDLE_SPEED_3D);
    if (inputMap3D["arrowdown"])
        player2Paddle3D.position.y = Math.max(paddleMinY, player2Paddle3D.position.y - PADDLE_SPEED_3D);
}
function updateBallMovement3D_func() {
    if (gameState3D_val !== GameState3D.PLAYING || !ball3D || !player1Paddle3D || !player2Paddle3D)
        return;
    ball3D.position.addInPlace(ballVelocity3D);
    // Ball collision with top/bottom walls
    if (ball3D.position.y + BALL_RADIUS_3D > COURT_HEIGHT_3D / 2 || ball3D.position.y - BALL_RADIUS_3D < -COURT_HEIGHT_3D / 2) {
        ballVelocity3D.y *= -1;
        ball3D.position.y = Math.max(-COURT_HEIGHT_3D / 2 + BALL_RADIUS_3D, Math.min(COURT_HEIGHT_3D / 2 - BALL_RADIUS_3D, ball3D.position.y));
    }
    // Ball collision with paddles
    if (ball3D.intersectsMesh(player1Paddle3D, false) && ballVelocity3D.x < 0) {
        ballVelocity3D.x *= -1.05; // Increase speed slightly on hit
        ballVelocity3D.y += (ball3D.position.y - player1Paddle3D.position.y) * 0.12; // Add some spin based on hit location
        ball3D.position.x = player1Paddle3D.position.x + PADDLE_WIDTH_3D / 2 + BALL_RADIUS_3D + 0.01; // Prevent sticking
    }
    if (ball3D.intersectsMesh(player2Paddle3D, false) && ballVelocity3D.x > 0) {
        ballVelocity3D.x *= -1.05;
        ballVelocity3D.y += (ball3D.position.y - player2Paddle3D.position.y) * 0.12;
        ball3D.position.x = player2Paddle3D.position.x - PADDLE_WIDTH_3D / 2 - BALL_RADIUS_3D - 0.01;
    }
    // Ball out of bounds (scoring)
    if (ball3D.position.x < -COURT_WIDTH_3D / 2 - BALL_RADIUS_3D * 2) { // Player 2 scores
        scoreP2_3D++;
        handleScore3D_func(p2Name3D);
    }
    else if (ball3D.position.x > COURT_WIDTH_3D / 2 + BALL_RADIUS_3D * 2) { // Player 1 scores
        scoreP1_3D++;
        handleScore3D_func(p1Name3D);
    }
}
function handleScore3D_func(scoringPlayerName) {
    updateScoreboard3D_func();
    displayMessage3D_func(`${scoringPlayerName} 득점!`, 2000);
    resetBallAndState3D_func(GameState3D.COUNTDOWN); // Transition to countdown
}
function resetBallAndState3D_func(nextState = GameState3D.PLAYING) {
    if (!ball3D)
        return;
    ball3D.position.set(0, Math.random() * (COURT_HEIGHT_3D - PADDLE_HEIGHT_3D) - (COURT_HEIGHT_3D - PADDLE_HEIGHT_3D) / 2, 0);
    let angle = (Math.random() * Math.PI / 2.5 - Math.PI / 5) + (Math.random() < 0.5 ? 0 : Math.PI); // Random angle towards left or right
    const speed = BASE_BALL_SPEED_X_3D * ballSpeedMultiplier3D_val;
    ballVelocity3D.set(speed * Math.cos(angle), speed * Math.sin(angle) * 0.8, 0); // Adjust y component for less vertical initial speed
    setGameState3D_func(nextState);
}
function updateScoreboard3D_func() {
    if (scorePlayer1Display3D_el)
        scorePlayer1Display3D_el.textContent = `${p1Name3D}: ${scoreP1_3D}`;
    if (scorePlayer2Display3D_el)
        scorePlayer2Display3D_el.textContent = `${p2Name3D}: ${scoreP2_3D}`;
    if (roundInfoDisplay3D_el)
        roundInfoDisplay3D_el.textContent = `라운드: ${currentRound3D_val} / ${totalRounds3D_val}`;
}
function updateTimerDisplay3D_func() {
    const minutes = Math.floor(currentRoundTime3D_val / 60);
    const seconds = currentRoundTime3D_val % 60;
    if (timerDisplay3D_el)
        timerDisplay3D_el.textContent = `시간: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
function displayMessage3D_func(msg, duration = 0, isEmphasized = false) {
    if (messageArea3D_el) {
        messageArea3D_el.textContent = msg;
        messageArea3D_el.classList.remove('invisible'); // Make visible
        // Define base and emphasis text style classes (Tailwind CSS)
        const baseTextClasses = ['text-lg', 'font-bold', 'text-slate-100'];
        const emphasisTextClasses = ['text-6xl', 'font-extrabold', 'text-amber-400']; // Example: Very large, extra bold, amber color
        // Remove all managed text styling classes first to ensure a clean slate
        messageArea3D_el.classList.remove(...baseTextClasses, ...emphasisTextClasses);
        if (isEmphasized) {
            messageArea3D_el.classList.add(...emphasisTextClasses);
        }
        else {
            messageArea3D_el.classList.add(...baseTextClasses);
        }
        if (duration > 0) {
            setTimeout(() => {
                // Check if the message is still the one we set and haven't been overwritten
                if (messageArea3D_el && messageArea3D_el.textContent === msg) {
                    const defaultLobbyMessage = "새 게임을 시작하려면 설정을 조정하고 시작 버튼을 누르세요.";
                    // Determine what the default message should be based on current game state
                    const currentDefaultMessage = (gameState3D_val === GameState3D.LOBBY || gameState3D_val === GameState3D.GAME_OVER)
                        ? defaultLobbyMessage
                        : ""; // Empty if in active game phases (PLAYING, ROUND_OVER, COUNTDOWN)
                    messageArea3D_el.textContent = currentDefaultMessage;
                    // Reset classes to default text style
                    messageArea3D_el.classList.remove(...emphasisTextClasses);
                    messageArea3D_el.classList.add(...baseTextClasses);
                    if (!currentDefaultMessage) { // If there's no default message (e.g., during PLAYING), hide the area
                        messageArea3D_el.classList.add('invisible');
                    }
                    else {
                        messageArea3D_el.classList.remove('invisible'); // Ensure visible if there is a default message
                    }
                }
            }, duration);
        }
        else if (!msg) { // If called with an empty message and no duration (e.g. to clear it immediately)
            messageArea3D_el.classList.add('invisible');
            // Reset classes to default text style
            messageArea3D_el.classList.remove(...emphasisTextClasses);
            messageArea3D_el.classList.add(...baseTextClasses);
        }
    }
}
function setGameState3D_func(newState) {
    gameState3D_val = newState;
    if (quitGameButton3D_el)
        quitGameButton3D_el.style.display = (newState !== GameState3D.LOBBY && newState !== GameState3D.GAME_OVER) ? 'inline-block' : 'none';
    if (startGameButton3D_el)
        startGameButton3D_el.style.display = (newState === GameState3D.LOBBY || newState === GameState3D.GAME_OVER) ? 'inline-block' : 'none';
    if (settingsPanel_el)
        settingsPanel_el.style.display = (newState === GameState3D.LOBBY || newState === GameState3D.GAME_OVER) ? 'grid' : 'none';
    switch (gameState3D_val) {
        case GameState3D.LOBBY:
            displayMessage3D_func("설정을 선택하고 게임을 시작하세요.");
            if (roundTimerInterval3D)
                clearInterval(roundTimerInterval3D);
            roundTimerInterval3D = undefined;
            inputMap3D = {}; // Reset input
            resetGameStats3D_func();
            updateScoreboard3D_func();
            updateTimerDisplay3D_func();
            if (roundInfoDisplay3D_el)
                roundInfoDisplay3D_el.textContent = `라운드: 0 / ${totalRounds3D_val}`;
            if (ball3D)
                ball3D.isVisible = false;
            if (player1Paddle3D)
                player1Paddle3D.position.y = 0;
            if (player2Paddle3D)
                player2Paddle3D.position.y = 0;
            break;
        // Inside setGameState3D_func(newState: GameState3D)
        // ...
        case GameState3D.COUNTDOWN:
            if (ball3D)
                ball3D.isVisible = true;
            displayMessage3D_func("준비...", 1000, false); // "준비..." in normal style
            setTimeout(() => {
                if (gameState3D_val === GameState3D.COUNTDOWN)
                    displayMessage3D_func("3", 1000, true);
            }, 1000); // "3" emphasized
            setTimeout(() => {
                if (gameState3D_val === GameState3D.COUNTDOWN)
                    displayMessage3D_func("2", 1000, true);
            }, 2000); // "2" emphasized
            setTimeout(() => {
                if (gameState3D_val === GameState3D.COUNTDOWN)
                    displayMessage3D_func("1", 1000, true);
            }, 3000); // "1" emphasized
            setTimeout(() => {
                if (gameState3D_val === GameState3D.COUNTDOWN) { // Ensure still in countdown
                    displayMessage3D_func("시작!", 1000, true); // "시작!" emphasized
                    setGameState3D_func(GameState3D.PLAYING);
                }
            }, 4000);
            break;
        case GameState3D.PLAYING:
            startRoundTimer3D_func();
            break;
        case GameState3D.ROUND_OVER:
            if (roundTimerInterval3D)
                clearInterval(roundTimerInterval3D);
            roundTimerInterval3D = undefined;
            setTimeout(() => {
                if (gameState3D_val === GameState3D.ROUND_OVER) {
                    if (currentRound3D_val >= totalRounds3D_val && totalRounds3D_val > 0) {
                        setGameState3D_func(GameState3D.GAME_OVER);
                    }
                    else {
                        startNewRound3D_func();
                    }
                }
            }, 3000); // Wait before starting new round or game over
            break;
        case GameState3D.GAME_OVER:
            if (roundTimerInterval3D)
                clearInterval(roundTimerInterval3D);
            roundTimerInterval3D = undefined;
            determineGameWinner3D_func();
            break;
    }
}
function startGameTrigger3D() {
    if (gameState3D_val === GameState3D.LOBBY || gameState3D_val === GameState3D.GAME_OVER) {
        p1Name3D = player1NameInput3D.value || "플레이어 1";
        p2Name3D = player2NameInput3D.value || "플레이어 2";
        totalRounds3D_val = parseInt(roundsSelect3D.value);
        roundTimeLimit3D_val = parseInt(roundDurationInput3D.value) || 60;
        const speedSetting = ballSpeedSelect3D.value;
        if (speedSetting === "fast")
            ballSpeedMultiplier3D_val = 1.5;
        else if (speedSetting === "veryfast")
            ballSpeedMultiplier3D_val = 2.0;
        else
            ballSpeedMultiplier3D_val = 1.0;
        resetGameStats3D_func();
        currentRound3D_val = 0; // Reset round count for new game
        updateScoreboard3D_func();
        startNewRound3D_func();
    }
}
function resetGameStats3D_func() {
    scoreP1_3D = 0;
    scoreP2_3D = 0;
    // currentRound3D_val is reset in startGameTrigger3D
}
function startNewRound3D_func() {
    currentRound3D_val++;
    if (currentRound3D_val > totalRounds3D_val && totalRounds3D_val > 0) {
        setGameState3D_func(GameState3D.GAME_OVER);
        return;
    }
    displayMessage3D_func(`라운드 ${currentRound3D_val} 시작!`, 2000);
    if (roundInfoDisplay3D_el)
        roundInfoDisplay3D_el.textContent = `라운드: ${currentRound3D_val} / ${totalRounds3D_val}`;
    currentRoundTime3D_val = roundTimeLimit3D_val;
    updateTimerDisplay3D_func();
    if (player1Paddle3D)
        player1Paddle3D.position.y = 0; // Reset paddle positions
    if (player2Paddle3D)
        player2Paddle3D.position.y = 0;
    resetBallAndState3D_func(GameState3D.COUNTDOWN);
}
function startRoundTimer3D_func() {
    if (roundTimerInterval3D)
        clearInterval(roundTimerInterval3D);
    roundTimerInterval3D = window.setInterval(() => {
        if (gameState3D_val === GameState3D.PLAYING) {
            currentRoundTime3D_val--;
            updateTimerDisplay3D_func();
            if (currentRoundTime3D_val <= 0) {
                endRound3D_func();
            }
        }
    }, 1000);
}
function endRound3D_func() {
    setGameState3D_func(GameState3D.ROUND_OVER);
    let roundWinnerMsg = "시간 종료! ";
    if (scoreP1_3D > scoreP2_3D)
        roundWinnerMsg += `${p1Name3D} 승리!`;
    else if (scoreP2_3D > scoreP1_3D)
        roundWinnerMsg += `${p2Name3D} 승리!`;
    else
        roundWinnerMsg += "무승부!";
    displayMessage3D_func(`라운드 ${currentRound3D_val} - ${roundWinnerMsg}`, 3000);
}
function determineGameWinner3D_func() {
    const gameResultData = generateGameResultJson_func();
    console.log("경기 결과 (JSON 객체):", gameResultData);
    // Asynchronously send the game result to the server
    // We don't necessarily need to await this if we don't want to block UI updates,
    // but the sendGameResultToServer_func will provide its own UI feedback.
    sendGameResultToServer_func(gameResultData);
    // --- Existing logic for displaying the winner message ---
    let gameOutcomeMessage;
    if (scoreP1_3D > scoreP2_3D) {
        gameOutcomeMessage = `${p1Name3D} WINNER! (총점 ${scoreP1_3D} vs ${scoreP2_3D})`;
    }
    else if (scoreP2_3D > scoreP1_3D) {
        gameOutcomeMessage = `${p2Name3D} WINNER! (총점 ${scoreP2_3D} vs ${scoreP1_3D})`;
    }
    else {
        gameOutcomeMessage = `무승부! (총점 ${scoreP1_3D} vs ${scoreP2_3D})`;
    }
    const finalMessage = `END - ${gameOutcomeMessage}`;
    // Display the game end message. The save status message might briefly overwrite this or appear after.
    // Consider the order or how you want to manage these messages.
    // For now, the game end message will show, and then the save status might update it.
    displayMessage3D_func(finalMessage, 5000);
    // --- End of existing logic ---
    // Timeout to return to lobby (this should probably be longer or after save confirmation if critical)
    setTimeout(() => {
        if (gameState3D_val === GameState3D.GAME_OVER) {
            setGameState3D_func(GameState3D.LOBBY);
        }
    }, 5000); // This timeout is independent of the save operation finishing
}
function initGame3D_func() {
    if (!canvas3D) {
        console.error("renderCanvasPong3D not found!");
        return;
    }
    // Initialize engine only if it hasn't been initialized yet
    if (!engine3D) {
        engine3D = new BABYLON.Engine(canvas3D, true);
    }
    // Initialize scene only if it hasn't been initialized yet
    // And ensure engine is available
    if (!scene3D && engine3D) {
        scene3D = createScene3D_func(); // scene3D is assigned here
        if (scene3D) { // Check if scene was successfully created
            setupInput3D_func();
        }
        else {
            console.error("Scene could not be created.");
            return;
        }
    }
    else if (!engine3D) {
        console.error("Engine is not initialized, cannot create scene.");
        return;
    }
    // Render loop management
    // Check if a render loop is already running for this engine.
    // This is a simplified check. A more robust way might involve a flag.
    if (engine3D && engine3D.activeRenderLoops && engine3D.activeRenderLoops.length === 0) {
        engine3D.runRenderLoop(() => {
            if (gameState3D_val === GameState3D.PLAYING) {
                updatePaddleMovement3D_func();
                updateBallMovement3D_func();
            }
            if (scene3D) { // Ensure scene exists before rendering
                scene3D.render();
            }
        });
    }
    window.addEventListener('resize', () => {
        if (engine3D)
            engine3D.resize();
    });
}
function generateGameResultJson_func() {
    let determinedWinner;
    if (scoreP1_3D > scoreP2_3D) {
        determinedWinner = p1Name3D;
    }
    else if (scoreP2_3D > scoreP1_3D) {
        determinedWinner = p2Name3D;
    }
    else {
        determinedWinner = "무승부"; // "Draw" in Korean
    }
    const gameEndTimeISO = new Date().toISOString();
    const gameData = {
        player1Name: p1Name3D,
        player2Name: p2Name3D,
        player1Score: scoreP1_3D,
        player2Score: scoreP2_3D,
        winner: determinedWinner,
        gameEndTime: gameEndTimeISO,
    };
    return gameData;
}
function sendGameResultToServer_func(gameResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const gameResultJsonString = JSON.stringify(gameResult);
        // Adjust this URL if your backend server runs on a different host or port
        const backendUrl = 'http://localhost:3000/jsons';
        // The backend expects the JSON string to be wrapped in an object like: { "jsonString": "..." }
        const requestBody = {
            jsonString: gameResultJsonString
        };
        try {
            if (messageArea3D_el) { // Optionally indicate saving is in progress
                displayMessage3D_func('경기 결과 저장 중...', 0); // 0 duration means it stays until replaced
            }
            console.log(`Sending game result to server: ${JSON.stringify(requestBody)}`);
            const response = yield fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            if (response.ok) {
                const responseData = yield response.json();
                console.log('Game result successfully sent to server and confirmed on blockchain:', responseData);
                // Display success message to the user
                displayMessage3D_func(`결과 저장 성공! Tx: ${responseData.transactionHash.substring(0, 10)}...`, 4000);
            }
            else {
                // Try to parse error response from server
                let errorDetails = `Server responded with status: ${response.status}`;
                try {
                    const errorData = yield response.json();
                    errorDetails = errorData.details || errorData.error || errorDetails;
                }
                catch (e) {
                    // Could not parse JSON error, stick with status text
                    errorDetails = response.statusText || errorDetails;
                }
                console.error('Failed to send game result to server:', errorDetails);
                // Display error message to the user
                displayMessage3D_func(`결과 저장 실패: ${errorDetails}`, 4000);
            }
        }
        catch (error) {
            console.error('Network or other error sending game result to server:', error);
            // Display network error message to the user
            displayMessage3D_func(`결과 저장 중 오류 발생: ${error.message || '네트워크 연결 확인'}`, 4000);
        }
    });
}
// Event Listeners for UI
if (startGameButton3D_el) {
    startGameButton3D_el.addEventListener('click', () => {
        if (gameState3D_val === GameState3D.LOBBY || gameState3D_val === GameState3D.GAME_OVER) {
            if (canvas3D) { // Ensure canvas exists
                // Ensure engine and scene are initialized before starting the game trigger
                if (!engine3D) {
                    engine3D = new BABYLON.Engine(canvas3D, true);
                }
                if (!scene3D && engine3D) { // Check engine3D again as it might have just been created
                    scene3D = createScene3D_func();
                    if (scene3D)
                        setupInput3D_func();
                    else {
                        console.error("Failed to initialize scene for game start.");
                        return;
                    }
                }
                else if (scene3D && engine3D) { // If scene and engine exist, just resize
                    engine3D.resize();
                }
                else if (!engine3D) {
                    console.error("Engine could not be initialized for game start.");
                    return;
                }
                startGameTrigger3D();
            }
            else {
                console.error("Canvas not available to start game.");
            }
        }
    });
}
if (quitGameButton3D_el) {
    quitGameButton3D_el.addEventListener('click', () => {
        if (gameState3D_val !== GameState3D.LOBBY && gameState3D_val !== GameState3D.GAME_OVER) {
            if (roundTimerInterval3D)
                clearInterval(roundTimerInterval3D);
            roundTimerInterval3D = undefined;
            displayMessage3D_func("게임이 종료되었습니다. 설정을 다시 선택하세요.", 3000);
            setGameState3D_func(GameState3D.LOBBY);
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    if (player1NameInput3D)
        p1Name3D = player1NameInput3D.value || "플레이어 1";
    if (player2NameInput3D)
        p2Name3D = player2NameInput3D.value || "플레이어 2";
    if (roundsSelect3D)
        totalRounds3D_val = parseInt(roundsSelect3D.value);
    if (roundDurationInput3D)
        roundTimeLimit3D_val = parseInt(roundDurationInput3D.value) || 60;
    setGameState3D_func(GameState3D.LOBBY); // Initial game state
    if (canvas3D) {
        initGame3D_func(); // This will create engine and scene if not already done
    }
    else {
        console.error("renderCanvasPong3D not found on DOMContentLoaded.");
    }
});
//# sourceMappingURL=pong3D.js.map