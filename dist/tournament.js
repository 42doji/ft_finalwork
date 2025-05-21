// src/tournament.ts
// 2의 거듭제곱인지 확인하는 헬퍼 함수
export function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}
// 배열 섞기 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
// 참가자 아이디 입력 필드 생성 함수
export function createParticipantInputs(count, container) {
    container.innerHTML = '';
    if (count < 2 || count > 64 || !isPowerOfTwo(count))
        return;
    for (let i = 0; i < count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `참가자 ${i + 1} 아이디`;
        input.className = 'participant-name-input mt-1 block w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100';
        input.id = `participant-name-${i}`;
        container.appendChild(input);
    }
}
// 전체 대진표 구조 생성 함수
export function generateFullBracketStructure(numParticipants) {
    const rounds = [];
    if (numParticipants < 2 || !isPowerOfTwo(numParticipants))
        return rounds;
    const numRounds = Math.log2(numParticipants);
    for (let r = 0; r < numRounds; r++) {
        const matchesInRound = numParticipants / Math.pow(2, r + 1);
        const roundMatches = [];
        for (let m = 0; m < matchesInRound; m++) {
            roundMatches.push({
                id: `R${r + 1}M${m + 1}`,
                player1: null,
                player2: null,
                winner: null,
                roundIndex: r,
                matchIndexInRound: m,
                nextMatchId: (r < numRounds - 1) ? `R${r + 2}M${Math.floor(m / 2) + 1}` : null,
                isPlayable: false,
            });
        }
        rounds.push(roundMatches);
    }
    return rounds;
}
// 초기 라운드에 참가자 배정 함수
export function populateInitialRound(bracket, participantNames) {
    const shuffledParticipants = shuffleArray(participantNames).map((name, index) => ({ name, id: `P${index}` }));
    if (bracket.length > 0 && bracket[0]) {
        const firstRound = bracket[0];
        for (let i = 0; i < firstRound.length; i++) {
            if (firstRound[i]) {
                firstRound[i].player1 = shuffledParticipants[i * 2] || null;
                firstRound[i].player2 = shuffledParticipants[i * 2 + 1] || null;
                firstRound[i].isPlayable = !!(firstRound[i].player1 && firstRound[i].player2);
            }
        }
    }
    return bracket;
}
// 대진표 렌더링 함수 (수정됨)
export function renderBracket(tournamentData, bracketDiv, onStartMatch, onSelectWinner // 승자 수동 선택 콜백 추가
) {
    var _a;
    bracketDiv.innerHTML = '';
    bracketDiv.className = 'flex flex-row space-x-2 md:space-x-6 p-2 md:p-4 overflow-x-auto bg-slate-900/50 ring-1 ring-slate-700 rounded-lg shadow-xl min-h-[150px] md:min-h-[200px]';
    const numRounds = tournamentData.length;
    if (numRounds === 0) {
        bracketDiv.innerHTML = '<p class="text-slate-500 text-center w-full self-center">대진표 데이터가 없습니다.</p>';
        return;
    }
    tournamentData.forEach((round, roundIndex) => {
        const roundContainer = document.createElement('div');
        roundContainer.className = 'round-column flex flex-col justify-around min-w-[150px] md:min-w-[200px]';
        const roundTitle = document.createElement('h3');
        roundTitle.className = 'text-base md:text-lg font-semibold mb-2 md:mb-3 text-center text-sky-400 sticky top-0 bg-slate-900/50 py-1 z-10';
        if (numRounds === 1 && round.length === 1)
            roundTitle.textContent = '결승전';
        else if (roundIndex < numRounds - 1)
            roundTitle.textContent = `${roundIndex + 1}회전`;
        else
            roundTitle.textContent = '결승전';
        roundContainer.appendChild(roundTitle);
        round.forEach((match) => {
            var _a, _b;
            const matchContainer = document.createElement('div');
            matchContainer.className = 'match bg-slate-700 p-2 md:p-3 rounded-lg shadow-md mb-8 md:mb-10 relative';
            matchContainer.id = match.id;
            const player1Div = document.createElement('div');
            let p1NameText = ((_a = match.player1) === null || _a === void 0 ? void 0 : _a.name) || (match.roundIndex > 0 ? `승자 (R${match.roundIndex}M${match.matchIndexInRound * 2 + 1})` : '미정');
            player1Div.textContent = p1NameText;
            player1Div.className = `participant text-xs md:text-sm p-1 md:p-2 border-b border-slate-600 ${match.player1 ? 'text-slate-100' : 'text-slate-400 italic'}`;
            const player2Div = document.createElement('div');
            let p2NameText = ((_b = match.player2) === null || _b === void 0 ? void 0 : _b.name) || (match.roundIndex > 0 ? `승자 (R${match.roundIndex}M${(match.matchIndexInRound * 2) + 2})` : '미정');
            player2Div.textContent = p2NameText;
            player2Div.className = `participant text-xs md:text-sm p-1 md:p-2 ${match.player2 ? 'text-slate-100' : 'text-slate-400 italic'}`;
            matchContainer.appendChild(player1Div);
            matchContainer.appendChild(player2Div);
            if (match.isPlayable && !match.winner && match.player1 && match.player2) {
                // 선수 이름 클릭으로 승자 지정 기능 추가
                player1Div.classList.add('cursor-pointer', 'clickable-participant');
                player1Div.title = `${match.player1.name}님을 승자로 지정`;
                player1Div.onclick = () => {
                    if (match.player1)
                        onSelectWinner(match.id, match.player1);
                };
                player2Div.classList.add('cursor-pointer', 'clickable-participant');
                player2Div.title = `${match.player2.name}님을 승자로 지정`;
                player2Div.onclick = () => {
                    if (match.player2)
                        onSelectWinner(match.id, match.player2);
                };
                // "경기 시작" 버튼 (2D 퐁 게임용)
                const startButton = document.createElement('button');
                startButton.textContent = '게임 시작'; // 2D 퐁 게임 시작 버튼
                startButton.className = 'start-match-button'; // 기존 스타일 유지
                startButton.onclick = () => {
                    if (match.player1 && match.player2) {
                        onStartMatch(match.id, match.player1.name, match.player2.name);
                    }
                };
                matchContainer.appendChild(startButton);
            }
            else if (match.winner) {
                const winnerDisplay = document.createElement('div');
                winnerDisplay.textContent = `승자: ${match.winner.name}`;
                winnerDisplay.className = 'text-xs text-amber-400 text-center pt-1 font-semibold';
                matchContainer.appendChild(winnerDisplay);
            }
            roundContainer.appendChild(matchContainer);
        });
        bracketDiv.appendChild(roundContainer);
    });
    if (numRounds > 0 && ((_a = tournamentData[numRounds - 1][0]) === null || _a === void 0 ? void 0 : _a.winner)) {
        const overallWinner = tournamentData[numRounds - 1][0].winner;
        const winnerColumn = document.createElement('div');
        winnerColumn.className = 'round-column flex flex-col justify-center min-w-[150px] md:min-w-[200px] items-center pl-2 md:pl-4';
        const winnerTitle = document.createElement('h3');
        winnerTitle.className = 'text-base md:text-lg font-semibold mb-2 md:mb-3 text-center text-amber-400 sticky top-0 bg-slate-900/50 py-1 z-10';
        winnerTitle.textContent = '최종 우승';
        winnerColumn.appendChild(winnerTitle);
        const winnerBox = document.createElement('div');
        winnerBox.className = 'match bg-slate-700 p-2 md:p-3 rounded-lg shadow-md h-16 md:h-20 flex items-center justify-center w-full';
        const winnerNameDiv = document.createElement('div');
        winnerNameDiv.textContent = (overallWinner === null || overallWinner === void 0 ? void 0 : overallWinner.name) || '미정';
        winnerNameDiv.className = `participant text-sm md:text-base font-bold ${overallWinner ? 'text-amber-300' : 'text-slate-400 italic'} p-1 md:p-2 text-center`;
        winnerBox.appendChild(winnerNameDiv);
        winnerColumn.appendChild(winnerBox);
        bracketDiv.appendChild(winnerColumn);
    }
}
// 경기 후 대진표 업데이트 함수 (승자 이름으로 처리)
export function updateTournamentAfterMatch(tournamentData, matchId, winnerName) {
    let matchFound = false;
    for (const round of tournamentData) {
        for (const match of round) {
            if (match.id === matchId) {
                matchFound = true;
                if (!match.player1 || !match.player2) {
                    console.error("오류: 두 명의 플레이어가 없는 경기에서 승자를 결정할 수 없습니다:", match);
                    return tournamentData;
                }
                // 승자 객체 찾기
                const winnerParticipant = match.player1.name === winnerName ? match.player1 : match.player2.name === winnerName ? match.player2 : null;
                if (!winnerParticipant) {
                    console.error(`오류: 경기 ${matchId}에서 승자 '${winnerName}'을(를) 찾을 수 없습니다.`);
                    return tournamentData;
                }
                match.winner = winnerParticipant;
                match.isPlayable = false;
                if (match.nextMatchId) {
                    const [nextRoundIndexStr, nextMatchIndexStr] = match.nextMatchId.substring(1).split('M');
                    const nextRoundIndex = parseInt(nextRoundIndexStr) - 1;
                    const nextMatchIndex = parseInt(nextMatchIndexStr) - 1;
                    if (tournamentData[nextRoundIndex] && tournamentData[nextRoundIndex][nextMatchIndex]) {
                        const nextMatch = tournamentData[nextRoundIndex][nextMatchIndex];
                        if (match.matchIndexInRound % 2 === 0) {
                            nextMatch.player1 = match.winner;
                        }
                        else {
                            nextMatch.player2 = match.winner;
                        }
                        if (nextMatch.player1 && nextMatch.player2) {
                            nextMatch.isPlayable = true;
                        }
                    }
                }
                break;
            }
        }
        if (matchFound)
            break;
    }
    if (!matchFound) {
        console.error(`오류: 경기 ID ${matchId}를 찾을 수 없습니다.`);
    }
    return tournamentData;
}
//# sourceMappingURL=tournament.js.map