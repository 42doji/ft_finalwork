// --- Interfaces for Tournament Data ---
interface Participant {
    name: string | null; // Name of the participant, or null if slot is empty/TBD
    id: string; // Unique ID for this participant instance, e.g., "player1_r0m0p0"
}

interface Match {
    participants: [Participant, Participant]; // The two participants/slots in this match
    winnerName?: string | null;       // Name of the winner of THIS match.
    matchId: string;                  // Unique ID for the match, e.g., "r0m0"
    isClickable: boolean;             // Can this match be played (i.e., winner selected) now?
    roundIndex: number;
    matchIndexInRound: number;
}

interface RoundData {
    matches: Match[];
    roundId: string; // e.g., "round0"
}

let tournamentData: RoundData[] = [];
const BYE_PLAYER_NAME = "BYE";

// --- DOM Elements ---
const numParticipantsInput = document.getElementById('numParticipants') as HTMLInputElement;
const participantInputsContainer = document.getElementById('participantInputsContainer');
const generateBracketButton = document.getElementById('generateBracketButton') as HTMLButtonElement;
const bracketContainer = document.getElementById('bracketContainer');
const participantErrorMessage = document.getElementById('participantErrorMessage');
const tournamentWinnerMessage = document.getElementById('tournamentWinnerMessage');

// HTML 문자열을 안전하게 처리하기 위한 함수
function escapeHTML(unsafe: string | null | undefined): string {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// --- Event Listeners ---
if (numParticipantsInput) {
    numParticipantsInput.addEventListener('input', () => {
        const num = parseInt(numParticipantsInput.value);
        if (validateParticipantCount(num)) {
            generateParticipantInputs(num);
            if (generateBracketButton) generateBracketButton.disabled = false;
            if (participantErrorMessage) participantErrorMessage.textContent = '';
        } else {
            if (generateBracketButton) generateBracketButton.disabled = true;
            if (participantInputsContainer) participantInputsContainer.innerHTML = '<p class="text-slate-400 text-sm">참가자 수를 먼저 유효하게 선택하세요.</p>';
        }
    });
}

if (generateBracketButton) {
    generateBracketButton.addEventListener('click', () => {
        const participantNames = getParticipantNames();
        if (participantNames.length > 0) {
            initializeTournament(participantNames);
        } else {
            if (participantErrorMessage) participantErrorMessage.textContent = '모든 참가자 이름을 입력해주세요.';
        }
    });
}


// --- Utility Functions ---
function validateParticipantCount(num: number): boolean {
    if (isNaN(num) || num < 1 || num > 64) { // 1명 참가자도 허용 (바로 우승)
        if (participantErrorMessage) participantErrorMessage.textContent = '참가자 수는 1명 이상 64명 이하여야 합니다.';
        return false;
    }
    if (participantErrorMessage) participantErrorMessage.textContent = '';
    return true;
}

function generateParticipantInputs(num: number): void {
    if (!participantInputsContainer) return;
    participantInputsContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < num; i++) {
        const inputDiv = document.createElement('div');
        inputDiv.classList.add('mb-2');

        const label = document.createElement('label');
        label.htmlFor = `participant${i}`;
        label.textContent = `참가자 ${i + 1}:`;
        label.classList.add('block', 'text-xs', 'font-medium', 'text-sky-300', 'mb-1');

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `participant${i}`;
        input.name = `participant${i}`;
        input.placeholder = `참가자 ${i + 1} 이름`;
        input.classList.add('participant-name-input', 'w-full', 'px-2', 'py-1.5', 'bg-slate-600', 'border', 'border-slate-500', 'rounded-md', 'shadow-sm', 'focus:outline-none', 'focus:border-sky-500', 'focus:ring-1', 'focus:ring-sky-500', 'text-slate-100', 'placeholder-slate-400', 'text-sm');
        input.required = true;

        inputDiv.appendChild(label);
        inputDiv.appendChild(input);
        fragment.appendChild(inputDiv);
    }
    participantInputsContainer.appendChild(fragment);
}

function getParticipantNames(): string[] {
    const inputs = document.querySelectorAll('.participant-name-input') as NodeListOf<HTMLInputElement>;
    const names: string[] = [];
    let allFilled = true;
    inputs.forEach(input => {
        const trimmedName = input.value.trim();
        if (trimmedName) {
            names.push(trimmedName);
        } else {
            allFilled = false;
        }
    });
    if (!allFilled && inputs.length > 0) { // 참가자 입력 필드가 하나라도 있으면 모두 채워야 함
        if (participantErrorMessage) participantErrorMessage.textContent = '모든 참가자 이름을 입력해주세요.';
        return [];
    }
    if (participantErrorMessage) participantErrorMessage.textContent = '';
    return names;
}

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- Tournament Logic ---
let initialParticipantCount = 0; // 초기 참가자 수를 저장할 변수

function initializeTournament(participantNames: string[]): void {
    initialParticipantCount = participantNames.length; // 초기 참가자 수 저장
    const shuffledParticipants = shuffleArray([...participantNames]);
    tournamentData = generateBracketData(shuffledParticipants);
    displayBracket(tournamentData);
    if (tournamentWinnerMessage) tournamentWinnerMessage.textContent = '';
}

function generateBracketData(initialParticipants: string[]): RoundData[] {
    const rounds: RoundData[] = [];
    let roundIndex = 0;

    // playersForCurrentRound 타입을 (string | null)[] 로 명시적 선언
    let playersForCurrentRound: (string | null)[] = [...initialParticipants];

    if (initialParticipants.length === 1) { // 1명 참가 시 바로 우승 처리용 데이터 생성
        const winnerName = initialParticipants[0];
        rounds.push({
            roundId: `round0`,
            matches: [{
                participants: [
                    { name: winnerName, id: `${escapeHTML(winnerName)}_r0m0p0` },
                    { name: BYE_PLAYER_NAME, id: `bye_r0m0p1` }
                ],
                winnerName: winnerName,
                matchId: `r0m0`,
                isClickable: false,
                roundIndex: 0,
                matchIndexInRound: 0
            }]
        });
        return rounds;
    }

    // 첫 라운드 참가자 수를 2의 거듭제곱으로 맞추기 (BYE 추가)
    const firstRoundSlots = Math.pow(2, Math.ceil(Math.log2(playersForCurrentRound.length)));

    const initialPlayersWithByes: (string | null)[] = [...playersForCurrentRound];
    while (initialPlayersWithByes.length < firstRoundSlots && initialPlayersWithByes.length > 0) {
        initialPlayersWithByes.push(BYE_PLAYER_NAME);
    }

    playersForCurrentRound = initialPlayersWithByes; // 타입 일치 (string | null)[]

    const totalRoundsBasedOnSlots = firstRoundSlots > 1 ? Math.log2(firstRoundSlots) : 1;


    while (playersForCurrentRound.length > 1 || (playersForCurrentRound.length === 1 && roundIndex === 0 && initialParticipants.length === 1) ) {
        if (playersForCurrentRound.length === 1 && initialParticipants.length === 1) { // 단일 플레이어 토너먼트 (위에서 이미 처리)
            break;
        }

        const roundMatches: Match[] = [];
        const playersForNextRound: (string | null)[] = [];
        let matchIndexInRound = 0;

        for (let i = 0; i < playersForCurrentRound.length; i += 2) {
            const p1Name = playersForCurrentRound[i];
            const p2Name = (i + 1 < playersForCurrentRound.length) ? playersForCurrentRound[i + 1] : BYE_PLAYER_NAME;

            const matchId = `r${roundIndex}m${matchIndexInRound}`;
            // ID 생성 시 null 가능성 고려 (escapeHTML은 null을 빈 문자열로 처리)
            const p1Id = `${escapeHTML(p1Name)}_${matchId}p0`;
            const p2Id = `${escapeHTML(p2Name)}_${matchId}p1`;

            const match: Match = {
                participants: [
                    { name: p1Name, id: p1Id },
                    { name: p2Name, id: p2Id }
                ],
                matchId: matchId,
                isClickable: false,
                roundIndex: roundIndex,
                matchIndexInRound: matchIndexInRound
            };

            if (p1Name === BYE_PLAYER_NAME && p2Name !== BYE_PLAYER_NAME && p2Name !== null) {
                match.winnerName = p2Name;
                playersForNextRound.push(p2Name);
            } else if (p2Name === BYE_PLAYER_NAME && p1Name !== BYE_PLAYER_NAME && p1Name !== null) {
                match.winnerName = p1Name;
                playersForNextRound.push(p1Name);
            } else if (p1Name !== BYE_PLAYER_NAME && p1Name !== null && p2Name !== BYE_PLAYER_NAME && p2Name !== null) {
                match.isClickable = true;
                playersForNextRound.push(null);
            } else if (p1Name && p1Name !== BYE_PLAYER_NAME && (p2Name === null || p2Name === BYE_PLAYER_NAME)) {
                match.winnerName = p1Name; // p1이 있고 p2가 BYE거나 null이면 p1이 자동 승리
                playersForNextRound.push(p1Name);
            } else if (p2Name && p2Name !== BYE_PLAYER_NAME && (p1Name === null || p1Name === BYE_PLAYER_NAME)) {
                match.winnerName = p2Name; // p2가 있고 p1이 BYE거나 null이면 p2가 자동 승리
                playersForNextRound.push(p2Name);
            } else {
                playersForNextRound.push(null); // 둘 다 BYE이거나 둘 다 null
            }
            roundMatches.push(match);
            matchIndexInRound++;
        }

        rounds.push({ roundId: `round${roundIndex}`, matches: roundMatches });
        playersForCurrentRound = playersForNextRound; // 타입 일치 (string | null)[]
        roundIndex++;

        // 모든 경기가 결정되었고 다음 라운드 진출자가 1명일 때 종료
        if (playersForCurrentRound.length === 1 && playersForCurrentRound[0] !== null && !roundMatches.some(m => m.isClickable && m.winnerName === undefined)) {
            break;
        }
        if (playersForCurrentRound.every(p => p === null) && playersForCurrentRound.length > 0 && !roundMatches.some(m=>m.isClickable && m.winnerName === undefined)) {
            // 모든 다음 라운드 슬롯이 null이고, 현재 라운드에 미결정 경기가 없으면 종료 (승자 없음)
            break;
        }
        if (roundIndex > totalRoundsBasedOnSlots + 2) break;
    }
    return rounds;
}


function displayBracket(currentTournamentData: RoundData[]): void {
    if (!bracketContainer) return;
    bracketContainer.innerHTML = '';
    bracketContainer.classList.remove('items-center', 'justify-center');

    const fragment = document.createDocumentFragment();

    currentTournamentData.forEach((round, roundIdx) => {
        const roundDiv = document.createElement('div');
        roundDiv.classList.add('round-column', 'flex', 'flex-col', 'justify-around', 'min-w-[180px]', 'md:min-w-[220px]', 'px-2', 'md:px-4', 'relative');
        roundDiv.id = round.roundId;

        round.matches.forEach((match) => {
            const matchDiv = document.createElement('div');
            matchDiv.classList.add('match', 'bg-slate-700', 'p-2', 'rounded-lg', 'shadow-lg', 'my-3', 'md:my-4', 'relative');
            matchDiv.id = match.matchId;

            match.participants.forEach((participant, participantIdxInMatch) => {
                const participantDiv = document.createElement('div');
                participantDiv.classList.add('participant', 'w-full', 'text-sm', 'truncate', 'px-3', 'py-3', 'rounded', 'transition-all', 'duration-150');

                let participantNameDisplay = escapeHTML(participant.name) || 'TBD';

                if (participant.name === BYE_PLAYER_NAME) {
                    participantDiv.innerHTML = `<span class="text-slate-500 italic">${participantNameDisplay}</span>`;
                    participantDiv.classList.add('bg-slate-600');
                } else if (!participant.name) {
                    participantDiv.innerHTML = `<span class="text-slate-500">${participantNameDisplay}</span>`;
                    participantDiv.classList.add('bg-slate-600');
                } else {
                    if (match.winnerName) {
                        if (participant.name === match.winnerName) {
                            participantDiv.innerHTML = `🏆 <strong class="font-semibold">${participantNameDisplay}</strong>`;
                            participantDiv.classList.add('bg-sky-500', 'text-white', 'shadow-md', 'ring-2', 'ring-sky-300');
                        } else {
                            participantDiv.innerHTML = `<span class="text-slate-400 line-through">${participantNameDisplay}</span>`;
                            participantDiv.classList.add('bg-slate-600', 'opacity-60');
                        }
                    } else if (match.isClickable) {
                        participantDiv.innerHTML = `<span class="cursor-pointer hover:text-sky-300">${participantNameDisplay}</span>`;
                        participantDiv.classList.add('bg-slate-500', 'hover:bg-slate-400');
                        participantDiv.addEventListener('click', () => {
                            handleParticipantClick(match.roundIndex, match.matchIndexInRound, participantIdxInMatch);
                        });
                    } else {
                        participantDiv.innerHTML = `<span class="text-slate-300">${participantNameDisplay}</span>`;
                        participantDiv.classList.add('bg-slate-600');
                    }
                }
                if (participantIdxInMatch === 0) {
                    participantDiv.classList.add('mb-1');
                }
                matchDiv.appendChild(participantDiv);
            });

            const connectorsDiv = document.createElement('div');
            connectorsDiv.classList.add('match-connectors');

            if (roundIdx < currentTournamentData.length - 1 ||
                (roundIdx === currentTournamentData.length - 1 && currentTournamentData[currentTournamentData.length-1].matches.length > 1 )) {
                if(!(currentTournamentData.length === roundIdx + 1 && round.matches.length === 1)) {
                    const outgoingLine = document.createElement('div');
                    outgoingLine.classList.add('connector-line', 'outgoing');
                    connectorsDiv.appendChild(outgoingLine);
                }
            }

            if (roundIdx > 0) {
                const incomingLineVertical = document.createElement('div');
                incomingLineVertical.classList.add('connector-line', 'incoming-vertical');
                connectorsDiv.appendChild(incomingLineVertical);

                const incomingLineTopHorizontal = document.createElement('div');
                incomingLineTopHorizontal.classList.add('connector-line', 'incoming-horizontal', 'top');
                connectorsDiv.appendChild(incomingLineTopHorizontal);

                const incomingLineBottomHorizontal = document.createElement('div');
                incomingLineBottomHorizontal.classList.add('connector-line', 'incoming-horizontal', 'bottom');
                connectorsDiv.appendChild(incomingLineBottomHorizontal);
            }
            matchDiv.appendChild(connectorsDiv);
            roundDiv.appendChild(matchDiv);
        });
        fragment.appendChild(roundDiv);
    });
    bracketContainer.appendChild(fragment);
    checkForTournamentWinner(currentTournamentData);
}

function handleParticipantClick(roundIdx: number, matchIdxInRound: number, clickedParticipantIdxInMatch: number): void {
    const match = tournamentData[roundIdx].matches[matchIdxInRound];
    if (match.winnerName || !match.isClickable) return;

    const winnerParticipant = match.participants[clickedParticipantIdxInMatch];
    if (!winnerParticipant.name || winnerParticipant.name === BYE_PLAYER_NAME) return;

    match.winnerName = winnerParticipant.name;
    match.isClickable = false;

    if (roundIdx + 1 < tournamentData.length) {
        const nextRound = tournamentData[roundIdx + 1];
        const nextMatchIdx = Math.floor(matchIdxInRound / 2);
        const positionInNextMatch = matchIdxInRound % 2;

        if (nextRound.matches[nextMatchIdx]) {
            const targetSlot = nextRound.matches[nextMatchIdx].participants[positionInNextMatch];
            targetSlot.name = winnerParticipant.name;
            targetSlot.id = `${escapeHTML(winnerParticipant.name)}_${nextRound.matches[nextMatchIdx].matchId}p${positionInNextMatch}`;

            const otherSlotInNextMatch = nextRound.matches[nextMatchIdx].participants[1 - positionInNextMatch];
            if (targetSlot.name && targetSlot.name !== BYE_PLAYER_NAME &&
                otherSlotInNextMatch.name && otherSlotInNextMatch.name !== BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].isClickable = true;
            }
            else if (targetSlot.name && targetSlot.name !== BYE_PLAYER_NAME && otherSlotInNextMatch.name === BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].winnerName = targetSlot.name;
                nextRound.matches[nextMatchIdx].isClickable = false;
                handleByeWinnerAdvancement(roundIdx + 1, nextMatchIdx);
            } else if (otherSlotInNextMatch.name && otherSlotInNextMatch.name !== BYE_PLAYER_NAME && targetSlot.name === BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].winnerName = otherSlotInNextMatch.name;
                nextRound.matches[nextMatchIdx].isClickable = false;
                handleByeWinnerAdvancement(roundIdx + 1, nextMatchIdx);
            }
        }
    }
    displayBracket(tournamentData);
}

function handleByeWinnerAdvancement(currentRoundIdx: number, currentMatchIdxInRound: number): void {
    const currentMatch = tournamentData[currentRoundIdx].matches[currentMatchIdxInRound];
    if (!currentMatch.winnerName || currentMatch.winnerName === BYE_PLAYER_NAME) return;

    if (currentRoundIdx + 1 < tournamentData.length) {
        const nextRound = tournamentData[currentRoundIdx + 1];
        const nextMatchIdx = Math.floor(currentMatchIdxInRound / 2);
        const positionInNextMatch = currentMatchIdxInRound % 2;

        if (nextRound.matches[nextMatchIdx]) {
            const targetSlot = nextRound.matches[nextMatchIdx].participants[positionInNextMatch];
            targetSlot.name = currentMatch.winnerName;
            targetSlot.id = `${escapeHTML(currentMatch.winnerName)}_${nextRound.matches[nextMatchIdx].matchId}p${positionInNextMatch}`;

            const otherSlotInNextMatch = nextRound.matches[nextMatchIdx].participants[1 - positionInNextMatch];
            if (targetSlot.name && targetSlot.name !== BYE_PLAYER_NAME &&
                otherSlotInNextMatch.name && otherSlotInNextMatch.name !== BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].isClickable = true;
            } else if (targetSlot.name && targetSlot.name !== BYE_PLAYER_NAME && otherSlotInNextMatch.name === BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].winnerName = targetSlot.name;
                nextRound.matches[nextMatchIdx].isClickable = false;
                handleByeWinnerAdvancement(currentRoundIdx + 1, nextMatchIdx);
            } else if (otherSlotInNextMatch.name && otherSlotInNextMatch.name !== BYE_PLAYER_NAME && targetSlot.name === BYE_PLAYER_NAME ) {
                nextRound.matches[nextMatchIdx].winnerName = otherSlotInNextMatch.name;
                nextRound.matches[nextMatchIdx].isClickable = false;
                handleByeWinnerAdvancement(currentRoundIdx + 1, nextMatchIdx);
            }
        }
    }
}

function checkForTournamentWinner(currentTournamentData: RoundData[]): void {
    if (!tournamentWinnerMessage) return;
    if (currentTournamentData.length === 0) {
        tournamentWinnerMessage.textContent = ''; // 데이터 없으면 메시지 클리어
        return;
    }

    const lastRound = currentTournamentData[currentTournamentData.length - 1];
    if (lastRound && lastRound.matches.length === 1) {
        const finalMatch = lastRound.matches[0];
        if (finalMatch.winnerName && finalMatch.winnerName !== BYE_PLAYER_NAME) {
            tournamentWinnerMessage.innerHTML = `🏆 <span class="font-bold text-yellow-300">${escapeHTML(finalMatch.winnerName)}</span> 선수 우승! 🏆`;
            return;
        }
    }

    if (initialParticipantCount === 1 && currentTournamentData.length > 0 &&
        currentTournamentData[0].matches.length === 1 &&
        currentTournamentData[0].matches[0].winnerName &&
        currentTournamentData[0].matches[0].winnerName !== BYE_PLAYER_NAME) {
        tournamentWinnerMessage.innerHTML = `🏆 <span class="font-bold text-yellow-300">${escapeHTML(currentTournamentData[0].matches[0].winnerName)}</span> 선수 우승! 🏆`;
        return;
    }
    tournamentWinnerMessage.textContent = '';
}

if (bracketContainer) {
    bracketContainer.innerHTML = '<p class="text-slate-500 text-center w-full self-center text-sm md:text-base">대진표를 생성하려면 위 정보를 입력하세요.</p>';
    bracketContainer.classList.add('flex', 'items-center', 'justify-center', 'min-h-[200px]');
}

if (numParticipantsInput && numParticipantsInput.value) {
    const num = parseInt(numParticipantsInput.value);
    if (validateParticipantCount(num)) {
        generateParticipantInputs(num);
        if (generateBracketButton) generateBracketButton.disabled = false;
    }
}
