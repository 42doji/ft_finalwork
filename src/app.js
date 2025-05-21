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
const BACKEND_API_BASE_URL = 'http://172.20.208.1:3000';
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
function updateStatus(message, isError = false, receiptForStatus // 상태 영역에 간략히 표시할 영수증 정보
) {
    console.log(`UI Status Update: ${message}`, receiptForStatus);
    let statusContent = `<p class="font-medium">${escapeHtml(message)}</p>`;
    if (receiptForStatus && receiptForStatus.transactionHash) {
        statusContent += `
            <div class="mt-1 text-xs">
                <span>Tx: 
                    <a href="${FUJI_EXPLORER_URL}/tx/${receiptForStatus.transactionHash}" target="_blank" rel="noopener noreferrer" 
                       class="text-blue-600 hover:text-blue-800 underline break-all">${receiptForStatus.transactionHash.substring(0, 12)}...</a>
                </span>`;
        if (receiptForStatus.blockNumber !== undefined) {
            statusContent += `
                <span class="ml-2">Block: 
                    <a href="${FUJI_EXPLORER_URL}/block/${receiptForStatus.blockNumber}" target="_blank" rel="noopener noreferrer" 
                       class="text-blue-600 hover:text-blue-800 underline">${receiptForStatus.blockNumber}</a>
                </span>`;
        }
        statusContent += `</div>`;
    }
    statusDiv.innerHTML = statusContent;
    statusDiv.classList.remove('text-red-700', 'border-red-400', 'bg-red-100', 'text-green-800', 'border-green-400', 'bg-green-100', 'text-gray-700', 'border-gray-400', 'bg-gray-200', 'font-semibold');
    if (isError) {
        statusDiv.classList.add('text-red-700', 'border-red-400', 'bg-red-100', 'font-semibold');
    }
    else if (receiptForStatus || message.toLowerCase().includes("성공") || message.toLowerCase().includes("완료")) {
        statusDiv.classList.add('text-green-800', 'border-green-400', 'bg-green-100');
    }
    else {
        statusDiv.classList.add('text-gray-700', 'border-gray-400', 'bg-gray-200');
    }
}
// displayResult 함수 수정: 선택적으로 receiptDetails를 받아 함께 표시
function displayResult(action, data, receiptDetails // 새로 저장된 항목의 트랜잭션 상세 정보
) {
    console.log(`Display Result for "${action}":`, data, receiptDetails);
    let content = `<h3 class="text-xl font-semibold text-gray-700 mb-3">${action}</h3>`;
    const preClasses = "bg-white p-3 border border-gray-300 rounded shadow-sm whitespace-pre-wrap text-sm text-left";
    const detailItemClass = "py-1"; // 각 상세 정보 항목을 위한 클래스
    const detailLabelClass = "font-semibold text-gray-600";
    const detailValueClass = "text-gray-800 break-all";
    if (data === null || data === undefined) {
        content += "<p class='text-gray-600'>데이터가 없거나 조회에 실패했습니다.</p>";
    }
    else {
        // 1. JSON 내용 표시
        if (typeof data === 'object' && 'index' in data && 'jsonString' in data) {
            const retrievedData = data;
            content += `<div class="${detailItemClass}"><span class="${detailLabelClass}">인덱스:</span> <span class="${detailValueClass}">${retrievedData.index}</span></div>`;
            content += `<div class="${detailItemClass}"><span class="${detailLabelClass}">저장된 JSON 내용:</span>`;
            try {
                const parsedJson = JSON.parse(retrievedData.jsonString);
                content += `<pre class="${preClasses} mt-1">${escapeHtml(JSON.stringify(parsedJson, null, 2))}</pre>`;
            }
            catch (e) {
                content += `<p class="text-red-500 text-xs my-1">주의: 아래 내용은 유효한 JSON 형식이 아닙니다.</p>`;
                content += `<pre class="${preClasses} mt-1">${escapeHtml(retrievedData.jsonString)}</pre>`;
            }
            content += `</div>`;
        }
        else if (typeof data === 'string') { // 직접 JSON 문자열이 전달된 경우 (예: 저장 시)
            content += `<div class="${detailItemClass}"><span class="${detailLabelClass}">저장된 JSON 내용:</span>`;
            try {
                const parsedJson = JSON.parse(data);
                content += `<pre class="${preClasses} mt-1">${escapeHtml(JSON.stringify(parsedJson, null, 2))}</pre>`;
            }
            catch (e) {
                content += `<p class="text-red-500 text-xs my-1">주의: 아래 내용은 유효한 JSON 형식이 아닙니다.</p>`;
                content += `<pre class="${preClasses} mt-1">${escapeHtml(data)}</pre>`;
            }
            content += `</div>`;
        }
        else { // 기타 객체 (오류 등)
            content += `<div class="${detailItemClass}"><span class="${detailLabelClass}">오류 또는 기타 정보:</span>`;
            content += `<pre class="${preClasses} mt-1">${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
        }
        // 2. 트랜잭션 상세 정보 표시 (receiptDetails가 제공된 경우)
        if (receiptDetails) {
            content += `<div class="mt-3 pt-3 border-t border-gray-300 space-y-1 text-xs">`;
            content += `<h4 class="text-sm font-semibold text-gray-700 mb-1">블록체인 처리 정보:</h4>`;
            if (receiptDetails.transactionHash) {
                content += `
                    <div class="${detailItemClass}">
                        <span class="${detailLabelClass}">트랜잭션 해시:</span>
                        <a href="${FUJI_EXPLORER_URL}/tx/${receiptDetails.transactionHash}" target="_blank" rel="noopener noreferrer"
                           class="text-blue-600 hover:text-blue-800 underline ${detailValueClass}">${receiptDetails.transactionHash}</a>
                    </div>`;
            }
            if (receiptDetails.blockNumber !== undefined) {
                content += `
                    <div class="${detailItemClass}">
                        <span class="${detailLabelClass}">블록 번호:</span>
                        <a href="${FUJI_EXPLORER_URL}/block/${receiptDetails.blockNumber}" target="_blank" rel="noopener noreferrer"
                           class="text-blue-600 hover:text-blue-800 underline ${detailValueClass}">${receiptDetails.blockNumber}</a>
                    </div>`;
            }
            if (receiptDetails.blockHash) {
                content += `
                    <div class="${detailItemClass}">
                        <span class="${detailLabelClass}">블록 해시:</span>
                        <span class="${detailValueClass}">${escapeHtml(receiptDetails.blockHash)}</span>
                    </div>`;
            }
            if (receiptDetails.gasUsed) {
                content += `
                    <div class="${detailItemClass}">
                        <span class="${detailLabelClass}">사용된 가스:</span>
                        <span class="${detailValueClass}">${escapeHtml(receiptDetails.gasUsed)}</span>
                    </div>`;
            }
            content += `</div>`;
        }
    }
    resultAreaDiv.innerHTML = content;
}
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        try {
            unsafe = JSON.stringify(unsafe);
        }
        catch (e) {
            unsafe = String(unsafe);
        }
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// --- API 호출 함수들 ---
// callAddJsonStringAPI는 ApiResponseAddJsonReceipt를 반환하도록 이미 수정되어 있어야 함
function callAddJsonStringAPI(stringToStore) {
    return __awaiter(this, void 0, void 0, function* () {
        updateStatus('트랜잭션 전송 및 블록체인 기록 처리 중... 서버 응답을 기다립니다.');
        try {
            const response = yield fetch(`${BACKEND_API_BASE_URL}/jsons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonString: stringToStore }),
            });
            const resultData = yield response.json(); // 응답 먼저 파싱
            if (!response.ok) {
                const errorResult = resultData;
                throw new Error(`JSON 추가 실패 (서버): ${errorResult.details || errorResult.error || response.statusText}`);
            }
            const successResult = resultData;
            // 상세 정보를 포함하여 상태 업데이트 (statusDiv 용)
            updateStatus(successResult.message || 'JSON 기록 및 트랜잭션 처리 완료!', false, successResult);
            return successResult; // 전체 receipt 반환
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
            updateStatus(`인덱스 ${index}의 데이터 조회 성공!`); // 간단한 성공 메시지
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
            resultAreaDiv.innerHTML = ''; // 결과 영역도 비워주기
            return;
        }
        let parsedJsonForCheck;
        try {
            parsedJsonForCheck = JSON.parse(stringToStore); // 실제 저장될 내용 확인용
        }
        catch (e) {
            updateStatus('입력한 문자열이 유효한 JSON 형식이 아닙니다. 확인해주세요.', true);
            resultAreaDiv.innerHTML = ''; // 결과 영역도 비워주기
            return;
        }
        resultAreaDiv.innerHTML = ''; // 이전 결과 초기화
        saveNewJsonButton.disabled = true;
        saveNewJsonButton.classList.add('opacity-50', 'cursor-not-allowed');
        try {
            const receipt = yield callAddJsonStringAPI(stringToStore); // 상세 정보가 포함된 receipt 받음
            // #status 에는 callAddJsonStringAPI 내부에서 이미 간략한 정보가 표시됨
            // 이제 #resultArea 에 저장된 JSON 내용과 함께 상세 receipt 정보 표시
            // 새로 저장된 항목의 인덱스를 가져오기 위해 count를 다시 호출
            // 참고: 동시성 문제가 발생할 수 있으므로, 이상적으로는 addJsonStringAPI가 새 인덱스를 반환해야 함
            const count = yield callGetJsonCountAPI();
            const newIndex = count > 0 ? count - 1 : 0; // 방금 추가했으므로 count - 1
            // displayResult에 저장된 문자열(파싱된 객체 대신 원본 또는 재파싱된 객체)과 receipt 전달
            // stringToStore는 사용자가 입력한 원본 문자열
            displayResult(`새로 저장된 JSON (인덱스: ${newIndex}) 및 처리 정보`, { index: newIndex, jsonString: stringToStore }, // RetrievedJsonData 형태로 전달
            receipt // 상세 블록체인 정보 전달
            );
        }
        catch (error) {
            // callAddJsonStringAPI 내부에서 updateStatus가 이미 오류를 표시했을 수 있음
            // resultAreaDiv에는 displayResult를 통해 오류 객체를 표시
            displayResult("새 기록 저장 중 최종 오류", { error: error.message }, undefined);
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
        if (indexStr === '') {
            updateStatus('조회할 인덱스를 입력하세요.', true);
            resultAreaDiv.innerHTML = '';
            return;
        }
        const index = parseInt(indexStr, 10);
        if (isNaN(index) || index < 0) {
            updateStatus('유효한 음이 아닌 정수 인덱스를 입력하세요.', true);
            resultAreaDiv.innerHTML = '';
            return;
        }
        resultAreaDiv.innerHTML = '';
        getJsonByIndexButton.disabled = true;
        getJsonByIndexButton.classList.add('opacity-50', 'cursor-not-allowed');
        try {
            const retrievedData = yield callGetJsonByIndexAPI(index);
            // 기존에 저장된 데이터를 조회하는 것이므로, 여기서는 receiptDetails를 전달하지 않음
            // (백엔드 GET /jsons/:index 라우트가 해당 정보를 반환하지 않기 때문)
            displayResult(`인덱스 ${index} 기록`, retrievedData, undefined);
            updateStatus(`인덱스 ${index}의 데이터 조회가 완료되었습니다.`); // 조회 완료 메시지 추가
        }
        catch (error) {
            // updateStatus는 callGetJsonByIndexAPI 내부에서 이미 오류를 표시했을 수 있음
            displayResult(`인덱스 ${index} 기록 조회 실패`, { error: error.message }, undefined);
        }
        finally {
            getJsonByIndexButton.disabled = false;
            getJsonByIndexButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}
function handleGetLatestJson() {
    return __awaiter(this, void 0, void 0, function* () {
        resultAreaDiv.innerHTML = '';
        getLatestJsonButton.disabled = true;
        getLatestJsonButton.classList.add('opacity-50', 'cursor-not-allowed');
        try {
            const count = yield callGetJsonCountAPI(); // count API는 내부에서 status 업데이트
            if (count === 0) {
                updateStatus('저장된 기록이 없습니다.');
                displayResult("최신 기록", null, undefined);
                return;
            }
            const latestIndex = count - 1;
            const retrievedData = yield callGetJsonByIndexAPI(latestIndex); // 내부에서 status 업데이트
            // 기존에 저장된 데이터를 조회하는 것이므로, 여기서는 receiptDetails를 전달하지 않음
            displayResult(`최신 기록 (인덱스: ${latestIndex})`, retrievedData, undefined);
            updateStatus(`최신 기록(인덱스: ${latestIndex}) 조회가 완료되었습니다.`); // 조회 완료 메시지 추가
        }
        catch (error) {
            displayResult("최신 기록 조회 실패", { error: error.message }, undefined);
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
getLatestJsonButton.addEventListener('click', () => handleGetLatestJson()); // isAfterSave 인자 제거
// 초기 상태 메시지
updateStatus("페이지 로드 완료. 작업을 선택하세요.");
