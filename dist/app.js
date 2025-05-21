"use strict";
// app.ts
let tournamentData = [];
const BYE_PLAYER_NAME = "BYE";
// --- DOM Elements ---
const numParticipantsInput = document.getElementById('numParticipants');
const participantInputsContainer = document.getElementById('participantInputsContainer');
const generateBracketButton = document.getElementById('generateBracketButton');
const bracketContainer = document.getElementById('bracketContainer');
const participantErrorMessage = document.getElementById('participantErrorMessage');
const tournamentWinnerMessage = document.getElementById('tournamentWinnerMessage');
// --- Event Listeners ---
numParticipantsInput.addEventListener('input', () => {
    const num = parseInt(numParticipantsInput.value);
    if (validateParticipantCount(num)) {
        generateParticipantInputs(num);
        generateBracketButton.disabled = false;
        if (participantErrorMessage)
            participantErrorMessage.textContent = '';
    }
    else {
        generateBracketButton.disabled = true;
        if (participantInputsContainer)
            participantInputsContainer.innerHTML = '<p class="text-slate-400 text-sm">참가자 수를 먼저 유효하게 선택하세요.</p>';
    }
});
generateBracketButton.addEventListener('click', () => {
    const participantNames = getParticipantNames();
    if (participantNames.length > 0) {
        initializeTournament(participantNames);
    }
    else {
        if (participantErrorMessage)
            participantErrorMessage.textContent = '모든 참가자 이름을 입력해주세요.';
    }
});
// --- Utility Functions ---
function validateParticipantCount(num) {
    if (isNaN(num) || num < 2 || num > 64) {
        if (participantErrorMessage)
            participantErrorMessage.textContent = '참가자 수는 2명 이상 64명 이하여야 합니다.';
        return false;
    }
    // While powers of two are ideal, the logic will handle others with byes.
    // Forcing power of two:
    // if ((num & (num - 1)) !== 0) {
    //     if (participantErrorMessage) participantErrorMessage.textContent = '참가자 수는 2의 거듭제곱이어야 합니다 (2, 4, 8, ...).';
    //     return false;
    // }
    if (participantErrorMessage)
        participantErrorMessage.textContent = '';
    return true;
}
function generateParticipantInputs(num) {
    if (!participantInputsContainer)
        return;
    participantInputsContainer.innerHTML = ''; // Clear previous inputs
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
function getParticipantNames() {
    const inputs = document.querySelectorAll('.participant-name-input');
    const names = [];
    let allFilled = true;
    inputs.forEach(input => {
        const trimmedName = input.value.trim();
        if (trimmedName) {
            names.push(trimmedName);
        }
        else {
            allFilled = false;
        }
    });
    if (!allFilled) {
        if (participantErrorMessage)
            participantErrorMessage.textContent = '모든 참가자 이름을 입력해주세요.';
        return [];
    }
    if (participantErrorMessage)
        participantErrorMessage.textContent = '';
    return names;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
// --- Tournament Logic ---
function initializeTournament(participantNames) {
    const shuffledParticipants = shuffleArray([...participantNames]);
    tournamentData = generateBracketData(shuffledParticipants);
    displayBracket(tournamentData);
    if (tournamentWinnerMessage)
        tournamentWinnerMessage.textContent = '';
}
function generateBracketData(participants) {
    const rounds = [];
    let currentParticipants = [...participants];
    let roundIndex = 0;
    // Calculate number of rounds and total slots for the first round (power of 2)
    const numPlayers = currentParticipants.length;
    const totalRounds = Math.ceil(Math.log2(numPlayers));
    const firstRoundSlots = Math.pow(2, totalRounds); // This is the size of a "full" bracket for this many players
    const byes = firstRoundSlots - numPlayers;
    // Distribute byes: players who get a bye advance automatically.
    // For simplicity in this model, we'll make the first `numPlayers - byes` players play,
    // and the remaining `byes` players will be paired with actual players if possible,
    // or effectively get a bye if they are at the end.
    // A more standard bye distribution is complex; this aims for playability.
    let playersForNextRound = [...currentParticipants];
    // Pad with nulls if not a power of two for easier processing, these are essentially byes
    // that will be resolved.
    const idealSize = Math.pow(2, Math.ceil(Math.log2(playersForNextRound.length)));
    while (playersForNextRound.length < idealSize && playersForNextRound.length > 0) { // Add BYEs if not power of 2
        playersForNextRound.push(BYE_PLAYER_NAME);
    }
    let activePlayersInRound = [...playersForNextRound];
    while (activePlayersInRound.length > 1 || (activePlayersInRound.length === 1 && roundIndex === 0 && participants.length === 1)) {
        if (activePlayersInRound.length === 1 && participants.length === 1) { // Single player tournament
            rounds.push({
                roundId: `round${roundIndex}`,
                matches: [{
                        participants: [
                            { name: activePlayersInRound[0], id: `${activePlayersInRound[0]}_r${roundIndex}m0p0` },
                            { name: BYE_PLAYER_NAME, id: `bye_r${roundIndex}m0p1` }
                        ],
                        winnerName: activePlayersInRound[0],
                        matchId: `r${roundIndex}m0`,
                        isClickable: false,
                        roundIndex: roundIndex,
                        matchIndexInRound: 0
                    }]
            });
            break; // Tournament ends
        }
        const roundMatches = [];
        const nextRoundParticipants = [];
        let matchIndexInRound = 0;
        for (let i = 0; i < activePlayersInRound.length; i += 2) {
            const p1Name = activePlayersInRound[i];
            const p2Name = (i + 1 < activePlayersInRound.length) ? activePlayersInRound[i + 1] : BYE_PLAYER_NAME;
            const matchId = `r${roundIndex}m${matchIndexInRound}`;
            const p1Id = `${p1Name}_${matchId}p0`;
            const p2Id = `${p2Name}_${matchId}p1`;
            const match = {
                participants: [
                    { name: p1Name, id: p1Id },
                    { name: p2Name, id: p2Id }
                ],
                matchId: matchId,
                isClickable: false, // Will be set true if both are actual players
                roundIndex: roundIndex,
                matchIndexInRound: matchIndexInRound
            };
            if (p1Name === BYE_PLAYER_NAME && p2Name !== BYE_PLAYER_NAME) { // p2 gets a bye
                match.winnerName = p2Name;
                nextRoundParticipants.push(p2Name);
            }
            else if (p2Name === BYE_PLAYER_NAME && p1Name !== BYE_PLAYER_NAME) { // p1 gets a bye
                match.winnerName = p1Name;
                nextRoundParticipants.push(p1Name);
            }
            else if (p1Name !== BYE_PLAYER_NAME && p2Name !== BYE_PLAYER_NAME) { // Actual match
                match.isClickable = true;
                nextRoundParticipants.push(null); // Winner TBD
            }
            else { // Both are BYE or became null, should not happen in normal flow if padded correctly
                nextRoundParticipants.push(null);
            }
            roundMatches.push(match);
            matchIndexInRound++;
        }
        rounds.push({ roundId: `round${roundIndex}`, matches: roundMatches });
        activePlayersInRound = nextRoundParticipants.filter(p => p !== null || roundMatches.some(m => m.isClickable && m.winnerName === undefined)); // Filter out nulls unless there are pending matches
        // If all remaining are placeholders for winners, pad for next round structure
        if (activePlayersInRound.every(p => p === null) && activePlayersInRound.length > 0) {
            // This means all matches in the current round are undecided.
            // The length of activePlayersInRound is correct for the next round's slots.
        }
        else if (activePlayersInRound.length === 0 && roundMatches.some(m => m.winnerName === undefined && m.isClickable)) {
            // This means the current round is not finished, but we have no one to pass to next round yet.
            // We need placeholders for the next round.
            activePlayersInRound = new Array(roundMatches.length / 2).fill(null);
        }
        roundIndex++;
        if (roundIndex > totalRounds + 2)
            break; // Safety break for too many rounds
        if (nextRoundParticipants.length === 1 && !roundMatches.some(m => m.winnerName === undefined && m.isClickable)) {
            // If only one participant remains and all matches that could produce them are decided.
            // This single participant is the winner of the tournament if they are not null.
            if (nextRoundParticipants[0] !== null) {
                // This logic is handled after the loop by checking the final round.
            }
            break;
        }
        if (nextRoundParticipants.length === 0 && !rounds[rounds.length - 1].matches.some(m => m.winnerName === undefined && m.isClickable)) {
            break; // No more players or undecided matches
        }
    }
    return rounds;
}
function displayBracket(currentTournamentData) {
    if (!bracketContainer)
        return;
    bracketContainer.innerHTML = ''; // Clear previous bracket
    bracketContainer.classList.remove('items-center', 'justify-center'); // Remove initial placeholder styling
    const fragment = document.createDocumentFragment();
    currentTournamentData.forEach((round, roundIdx) => {
        const roundDiv = document.createElement('div');
        roundDiv.classList.add('round-column', 'flex', 'flex-col', 'justify-around', 'min-w-[180px]', 'md:min-w-[200px]');
        roundDiv.id = round.roundId;
        round.matches.forEach((match) => {
            const matchDiv = document.createElement('div');
            matchDiv.classList.add('match', 'relative', 'bg-slate-800', 'p-2', 'rounded-md', 'shadow-md'); // Added more styling
            matchDiv.id = match.matchId;
            // Connector lines (basic attempt)
            if (roundIdx > 0) {
                // This is a simple placeholder for where more complex connector logic would go.
                // True SVG connectors are better for this.
            }
            match.participants.forEach((participant, participantIdxInMatch) => {
                const participantDiv = document.createElement('div');
                participantDiv.classList.add('participant', 'w-full', 'text-sm', 'truncate', 'px-2', 'py-3'); // py-3 for more height
                participantDiv.textContent = participant.name || 'TBD';
                if (participant.name === BYE_PLAYER_NAME) {
                    participantDiv.classList.add('participant-bye');
                }
                else if (!participant.name) {
                    participantDiv.classList.add('participant-empty');
                }
                else {
                    if (match.winnerName) {
                        if (participant.name === match.winnerName) {
                            participantDiv.classList.add('participant-winner');
                        }
                        else {
                            participantDiv.classList.add('participant-loser');
                        }
                    }
                    else if (match.isClickable) {
                        participantDiv.classList.add('participant-clickable');
                        participantDiv.addEventListener('click', () => {
                            handleParticipantClick(match.roundIndex, match.matchIndexInRound, participantIdxInMatch);
                        });
                    }
                }
                matchDiv.appendChild(participantDiv);
            });
            roundDiv.appendChild(matchDiv);
        });
        fragment.appendChild(roundDiv);
    });
    bracketContainer.appendChild(fragment);
    // Check for tournament winner after display
    checkForTournamentWinner(currentTournamentData);
}
function handleParticipantClick(roundIdx, matchIdxInRound, clickedParticipantIdxInMatch) {
    const match = tournamentData[roundIdx].matches[matchIdxInRound];
    if (match.winnerName || !match.isClickable)
        return; // Match already decided or not ready
    const winnerParticipant = match.participants[clickedParticipantIdxInMatch];
    // const loserParticipant = match.participants[1 - clickedParticipantIdxInMatch]; // Not strictly needed by name
    if (!winnerParticipant.name || winnerParticipant.name === BYE_PLAYER_NAME)
        return; // Clicked on BYE or empty slot
    match.winnerName = winnerParticipant.name;
    match.isClickable = false; // Match decided
    // Advance winner to the next round
    if (roundIdx + 1 < tournamentData.length) {
        const nextRound = tournamentData[roundIdx + 1];
        const nextMatchIdx = Math.floor(matchIdxInRound / 2);
        const positionInNextMatch = matchIdxInRound % 2;
        if (nextRound.matches[nextMatchIdx]) {
            const targetSlot = nextRound.matches[nextMatchIdx].participants[positionInNextMatch];
            targetSlot.name = winnerParticipant.name; // Set winner name in the next round's slot
            targetSlot.id = `${winnerParticipant.name}_r${roundIdx + 1}m${nextMatchIdx}p${positionInNextMatch}`;
            // Check if the *other* participant for the next match is now known, making it clickable
            const otherSlotInNextMatch = nextRound.matches[nextMatchIdx].participants[1 - positionInNextMatch];
            if (targetSlot.name && targetSlot.name !== BYE_PLAYER_NAME &&
                otherSlotInNextMatch.name && otherSlotInNextMatch.name !== BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].isClickable = true;
            }
            // If one participant is known and the other is a BYE that auto-advanced earlier
            else if (targetSlot.name && targetSlot.name !== BYE_PLAYER_NAME && otherSlotInNextMatch.name === BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].winnerName = targetSlot.name;
                nextRound.matches[nextMatchIdx].isClickable = false;
                // Recursively advance this new winner if it was a bye match
                handleByeWinnerAdvancement(roundIdx + 1, nextMatchIdx);
            }
            else if (otherSlotInNextMatch.name && otherSlotInNextMatch.name !== BYE_PLAYER_NAME && targetSlot.name === BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].winnerName = otherSlotInNextMatch.name;
                nextRound.matches[nextMatchIdx].isClickable = false;
                handleByeWinnerAdvancement(roundIdx + 1, nextMatchIdx);
            }
        }
    }
    displayBracket(tournamentData); // Re-render the entire bracket
}
function handleByeWinnerAdvancement(currentRoundIdx, currentMatchIdxInRound) {
    const currentMatch = tournamentData[currentRoundIdx].matches[currentMatchIdxInRound];
    if (!currentMatch.winnerName)
        return; // Should have a winner if this function is called
    if (currentRoundIdx + 1 < tournamentData.length) {
        const nextRound = tournamentData[currentRoundIdx + 1];
        const nextMatchIdx = Math.floor(currentMatchIdxInRound / 2);
        const positionInNextMatch = currentMatchIdxInRound % 2;
        if (nextRound.matches[nextMatchIdx]) {
            const targetSlot = nextRound.matches[nextMatchIdx].participants[positionInNextMatch];
            targetSlot.name = currentMatch.winnerName;
            targetSlot.id = `${currentMatch.winnerName}_r${currentRoundIdx + 1}m${nextMatchIdx}p${positionInNextMatch}`;
            const otherSlotInNextMatch = nextRound.matches[nextMatchIdx].participants[1 - positionInNextMatch];
            if (targetSlot.name && targetSlot.name !== BYE_PLAYER_NAME &&
                otherSlotInNextMatch.name && otherSlotInNextMatch.name !== BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].isClickable = true;
            }
            else if (targetSlot.name && targetSlot.name !== BYE_PLAYER_NAME && otherSlotInNextMatch.name === BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].winnerName = targetSlot.name;
                nextRound.matches[nextMatchIdx].isClickable = false;
                handleByeWinnerAdvancement(currentRoundIdx + 1, nextMatchIdx);
            }
            else if (otherSlotInNextMatch.name && otherSlotInNextMatch.name !== BYE_PLAYER_NAME && targetSlot.name === BYE_PLAYER_NAME) {
                nextRound.matches[nextMatchIdx].winnerName = otherSlotInNextMatch.name;
                nextRound.matches[nextMatchIdx].isClickable = false;
                handleByeWinnerAdvancement(currentRoundIdx + 1, nextMatchIdx);
            }
        }
    }
}
function checkForTournamentWinner(currentTournamentData) {
    if (!tournamentWinnerMessage)
        return;
    const lastRound = currentTournamentData[currentTournamentData.length - 1];
    if (lastRound && lastRound.matches.length === 1) {
        const finalMatch = lastRound.matches[0];
        if (finalMatch.winnerName && finalMatch.winnerName !== BYE_PLAYER_NAME) {
            tournamentWinnerMessage.textContent = `🏆 ${finalMatch.winnerName} 선수 우승! 🏆`;
        }
        else if (currentTournamentData.length === 1 && lastRound.matches[0].participants[0].name && lastRound.matches[0].participants[1].name === BYE_PLAYER_NAME) {
            // Single player tournament scenario
            tournamentWinnerMessage.textContent = `🏆 ${lastRound.matches[0].participants[0].name} 선수 우승! 🏆`;
        }
    }
}
// --- Pong Game (2D Modal - Placeholder, as primary interaction is now direct winner selection) ---
// The PongGame class and its instantiation might exist from previous code.
// For now, clicking a match cell directly handles winner selection.
// If the Pong game needs to be triggered, `handleParticipantClick` would need to
// initiate the game and then use its result to set the winner.
// Example of how PongGame might have been structured (for reference, not active in new flow):
/*
class PongGame {
    // ... existing Pong game class ...
    constructor(canvasId: string, private onGameEnd: (winnerName: string) => void) {
        // ...
    }
    startGame(player1: string, player2: string) {
        // ...
        // When game ends, call this.onGameEnd(winner);
    }
}
*/
// Initial placeholder message in bracket container
if (bracketContainer) {
    bracketContainer.innerHTML = '<p class="text-slate-500 text-center w-full self-center text-sm md:text-base">대진표를 생성하려면 위 정보를 입력하세요.</p>';
    bracketContainer.classList.add('flex', 'items-center', 'justify-center');
}
// Auto-generate inputs if a number is already in the field on load (e.g. after refresh)
if (numParticipantsInput.value) {
    const num = parseInt(numParticipantsInput.value);
    if (validateParticipantCount(num)) {
        generateParticipantInputs(num);
        generateBracketButton.disabled = false;
    }
}
//# sourceMappingURL=app.js.map