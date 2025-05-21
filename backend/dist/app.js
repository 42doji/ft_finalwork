"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// --- 설정 ---
const BACKEND_API_BASE_URL = 'http://172.20.208.1:3000'; // 실제 백엔드 서버 주소로 변경
const FUJI_EXPLORER_URL = 'https://testnet.snowtrace.io';
// --- DOM 요소 ---
const newJsonStringInput = document.getElementById('newJsonString');
const saveNewJsonButton = document.getElementById('saveNewJsonButton');
const jsonIndexInput = document.getElementById('jsonIndex');
const getJsonByIndexButton = document.getElementById('getJsonByIndexButton');
const getLatestJsonButton = document.getElementById('getLatestJsonButton');
const statusDiv = document.getElementById('status');
const resultAreaDiv = document.getElementById('resultArea');
// --- 유틸리티 함수 ---
function updateStatus(message, isError = false, receipt // 상세 정보를 위한 객체
) {
    console.log(`UI Status: ${message}`);
    let statusContent = `<p>${escapeHtml(message)}</p>`;
    if (receipt && receipt.transactionHash) {
        statusContent += `
            <div class="mt-2 text-xs space-y-1">
                <p><strong>Tx Hash:</strong> 
                    <a href="${FUJI_EXPLORER_URL}/tx/${receipt.transactionHash}" target="_blank" rel="noopener noreferrer" 
                       class="text-blue-600 hover:text-blue-800 underline break-all">${receipt.transactionHash}</a>
                </p>`;
        if (receipt.blockNumber) {
            statusContent += `
                <p><strong>Block Number:</strong> 
                    <a href="${FUJI_EXPLORER_URL}/block/${receipt.blockNumber}" target="_blank" rel="noopener noreferrer" 
                       class="text-blue-600 hover:text-blue-800 underline">${receipt.blockNumber}</a>
                </p>`;
        }
        if (receipt.blockHash) {
            statusContent += `<p><strong>Block Hash:</strong> <span class="break-all">${escapeHtml(receipt.blockHash)}</span></p>`;
        }
        if (receipt.gasUsed) {
            statusContent += `<p><strong>Gas Used:</strong> ${escapeHtml(receipt.gasUsed)}</p>`;
        }
        statusContent += `</div>`;
    }
    statusDiv.innerHTML = statusContent;
    // Tailwind CSS 클래스로 상태 스타일링
    statusDiv.classList.remove('text-red-600', 'font-bold', 'text-gray-700', 'text-green-700');
    if (isError) {
        statusDiv.classList.add('text-red-600', 'font-bold');
    }
    else if (receipt || message.toLowerCase().includes("성공") || message.toLowerCase().includes("완료")) {
        statusDiv.classList.add('text-green-700');
    }
    else {
        statusDiv.classList.add('text-gray-700');
    }
}
function displayResult(action, data) {
    let content = `<h3 class="text-xl font-semibold text-gray-700 mb-2">${action} 결과:</h3>`;
    const preClasses = "bg-white p-3 border border-gray-300 rounded shadow-sm whitespace-pre-wrap text-sm";
    if (data === null || data === undefined) {
        content += "<p class='text-gray-600'>데이터가 없거나 조회에 실패했습니다.</p>";
    }
    else if (typeof data === 'object' && 'index' in data && 'jsonString' in data) {
        const retrievedData = data;
        content += `<p class="text-sm text-gray-600 mb-1"><strong>인덱스:</strong> ${retrievedData.index}</p>`;
        try {
            const parsed = JSON.parse(retrievedData.jsonString);
            content += `<pre class="${preClasses}">${escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`;
        }
        catch (e) {
            content += `<pre class="${preClasses}">${escapeHtml(retrievedData.jsonString)}</pre>`;
        }
    }
    else if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            content += `<pre class="${preClasses}">${escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`;
        }
        catch (e) {
            content += `<pre class="${preClasses}">${escapeHtml(data)}</pre>`;
        }
    }
    else {
        content += `<pre class="${preClasses}">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    }
    resultAreaDiv.innerHTML = content;
}
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        unsafe = JSON.stringify(unsafe);
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// --- API 호출 함수들 ---
function callAddJsonStringAPI(stringToStore) {
    return __awaiter(this, void 0, void 0, function* () {
        // 이제 백엔드가 트랜잭션 처리를 기다리므로, 초기 메시지 변경
        updateStatus('트랜잭션 전송 및 블록체인 기록 처리 중... 서버 응답을 기다립니다.');
        try {
            const response = yield fetch(`${BACKEND_API_BASE_URL}/jsons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonString: stringToStore }),
            });
            if (!response.ok) {
                const errorData = yield response.json().catch(() => ({ details: response.statusText }));
                throw new Error(`JSON 추가 실패 (서버): ${errorData.details || response.statusText}`);
            }
            const result = yield response.json();
            // 백엔드에서 받은 상세 정보를 포함하여 상태 업데이트
            updateStatus(result.message || 'JSON 기록 및 트랜잭션 처리 완료!', false, result);
            return result;
        }
        catch (error) {
            console.error('callAddJsonStringAPI 오류:', error);
            updateStatus(`JSON 추가 API 호출 오류: ${error.message}`, true);
            throw error;
        }
    });
}
function callGetJsonCountAPI() {
    return __awaiter(this, void 0, void 0, function* () {
        updateStatus('저장된 총 데이터 개수 조회 중...');
        try {
            const response = yield fetch(`${BACKEND_API_BASE_URL}/jsons/count`);
            if (!response.ok) {
                const errorData = yield response.json().catch(() => ({ details: response.statusText }));
                throw new Error(`JSON 개수 조회 실패 (서버): ${errorData.details || response.statusText}`);
            }
            const result = yield response.json();
            updateStatus(`현재 총 ${result.count}개의 기록이 있습니다.`);
            return result.count;
        }
        catch (error) {
            console.error('callGetJsonCountAPI 오류:', error);
            updateStatus(`JSON 개수 API 호출 오류: ${error.message}`, true);
            throw error;
        }
    });
}
function callGetJsonByIndexAPI(index) {
    return __awaiter(this, void 0, void 0, function* () {
        updateStatus(`인덱스 ${index}의 데이터 조회 중...`);
        try {
            const response = yield fetch(`${BACKEND_API_BASE_URL}/jsons/${index}`);
            if (!response.ok) {
                const errorData = yield response.json().catch(() => ({ details: response.statusText }));
                if (response.status === 404) {
                    throw new Error(`인덱스 ${index}에서 JSON을 찾을 수 없습니다 (서버): ${errorData.error || 'Not found'}`);
                }
                throw new Error(`인덱스 ${index}의 JSON 조회 실패 (서버): ${errorData.details || response.statusText}`);
            }
            const result = yield response.json();
            updateStatus(`인덱스 ${index}의 데이터 조회 성공!`);
            return result;
        }
        catch (error) {
            console.error('callGetJsonByIndexAPI 오류:', error);
            updateStatus(`인덱스 ${index} 조회 API 호출 오류: ${error.message}`, true);
            throw error;
        }
    });
}
// --- 기능별 핸들러 함수 ---
function handleSaveNewJson() {
    return __awaiter(this, void 0, void 0, function* () {
        const stringToStore = newJsonStringInput.value.trim();
        if (!stringToStore) {
            updateStatus('저장할 JSON 문자열을 입력하세요.', true);
            return;
        }
        try {
            JSON.parse(stringToStore);
        }
        catch (e) {
            updateStatus('입력한 문자열이 유효한 JSON 형식이 아닙니다. 확인해주세요.', true);
            return;
        }
        resultAreaDiv.innerHTML = '';
        saveNewJsonButton.disabled = true; // 중복 클릭 방지
        saveNewJsonButton.classList.add('opacity-50', 'cursor-not-allowed');
        try {
            // callAddJsonStringAPI 내부에서 모든 관련 상태 업데이트를 처리합니다.
            // (초기 메시지, 성공 시 상세 정보 포함 메시지)
            const receipt = yield callAddJsonStringAPI(stringToStore);
            // 백엔드가 tx.wait()를 하므로, 프론트엔드에서의 별도 delay는 이제 불필요합니다.
            // updateStatus는 callAddJsonStringAPI 내부에서 상세 정보를 포함해 호출됩니다.
            // 바로 최신 기록을 조회하여 UI에 반영 (선택 사항, 이미 상태 메시지로 충분할 수 있음)
            updateStatus('저장된 최신 기록을 다시 조회합니다...', false, receipt); // 이전 receipt 정보를 넘겨서 링크 유지
            yield handleGetLatestJson(true);
        }
        catch (error) {
            // callAddJsonStringAPI 내부에서 이미 오류 상태가 업데이트되었을 것입니다.
            // 여기서는 resultAreaDiv에 실패 메시지를 표시하거나 추가적인 UI 복구를 할 수 있습니다.
            displayResult("새 기록 저장 중 최종 오류", { error: error.message });
            // updateStatus는 이미 API 함수 내에서 isError=true로 호출되었을 것이므로, 여기서 중복 호출 피함
        }
        finally {
            saveNewJsonButton.disabled = false;
            saveNewJsonButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}
function handleGetJsonByIndex() {
    return __awaiter(this, void 0, void 0, function* () {
        const indexStr = jsonIndexInput.value.trim();
        // ... (이전과 동일)
        if (indexStr === '') {
            updateStatus('조회할 인덱스를 입력하세요.', true);
            return;
        }
        const index = parseInt(indexStr, 10);
        if (isNaN(index) || index < 0) {
            updateStatus('유효한 음이 아닌 정수 인덱스를 입력하세요.', true);
            return;
        }
        resultAreaDiv.innerHTML = '';
        getJsonByIndexButton.disabled = true;
        getJsonByIndexButton.classList.add('opacity-50', 'cursor-not-allowed');
        try {
            const retrievedData = yield callGetJsonByIndexAPI(index);
            displayResult(`인덱스 ${index} 기록`, retrievedData);
        }
        catch (error) {
            displayResult(`인덱스 ${index} 기록 조회 실패`, { error: error.message });
        }
        finally {
            getJsonByIndexButton.disabled = false;
            getJsonByIndexButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}
function handleGetLatestJson() {
    return __awaiter(this, arguments, void 0, function* (isAfterSave = false) {
        if (!isAfterSave) {
            resultAreaDiv.innerHTML = '';
        }
        getLatestJsonButton.disabled = true;
        getLatestJsonButton.classList.add('opacity-50', 'cursor-not-allowed');
        try {
            const count = yield callGetJsonCountAPI();
            if (count === 0) {
                updateStatus('저장된 기록이 없습니다.');
                displayResult(isAfterSave ? "저장 후 확인: 기록 없음" : "최신 기록", null);
                return;
            }
            const latestIndex = count - 1;
            // 상세 메시지 업데이트는 callGetJsonByIndexAPI 내부에서 처리
            const retrievedData = yield callGetJsonByIndexAPI(latestIndex);
            displayResult(isAfterSave ? `저장 후 확인된 최신 기록 (인덱스: ${latestIndex})` : `최신 기록 (인덱스: ${latestIndex})`, retrievedData);
        }
        catch (error) {
            displayResult(isAfterSave ? "저장 후 최신 기록 조회 실패" : "최신 기록 조회 실패", { error: error.message });
        }
        finally {
            getLatestJsonButton.disabled = false;
            getLatestJsonButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}
// --- 이벤트 리스너 ---
saveNewJsonButton.addEventListener('click', handleSaveNewJson);
getJsonByIndexButton.addEventListener('click', handleGetJsonByIndex);
getLatestJsonButton.addEventListener('click', () => handleGetLatestJson(false));
// 초기 상태 메시지
updateStatus("페이지 로드 완료. 작업을 선택하세요.");
