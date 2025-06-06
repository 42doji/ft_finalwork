// blockdata.ts (또는 블록체인 로직이 있는 TS 파일)

// --- 상단 ---
console.log('blockdata.ts (또는 해당 파일) 로드 시작'); // 스크립트 파일 로드 확인

// --- DOM 요소 ---
const newJsonStringInput = document.getElementById('newJsonString') as HTMLTextAreaElement;
console.log('newJsonStringInput 요소:', newJsonStringInput); // null 인지 확인

const saveNewJsonButton = document.getElementById('saveNewJsonButton') as HTMLButtonElement;
console.log('saveNewJsonButton 요소:', saveNewJsonButton); // null 인지 확인

const jsonIndexInput = document.getElementById('jsonIndex') as HTMLInputElement;
console.log('jsonIndexInput 요소:', jsonIndexInput); // null 인지 확인

const getJsonByIndexButton = document.getElementById('getJsonByIndexButton') as HTMLButtonElement;
console.log('getJsonByIndexButton 요소:', getJsonByIndexButton); // null 인지 확인

const getLatestJsonButton = document.getElementById('getLatestJsonButton') as HTMLButtonElement;
console.log('getLatestJsonButton 요소:', getLatestJsonButton); // null 인지 확인

const statusDiv = document.getElementById('status') as HTMLDivElement;
console.log('statusDiv 요소:', statusDiv); // null 인지 확인

const resultAreaDiv = document.getElementById('resultArea') as HTMLDivElement;
console.log('resultAreaDiv 요소:', resultAreaDiv); // null 인지 확인


// --- 이벤트 리스너 ---
// DOMContentLoaded는 스크립트가 body 끝에 있다면 필수는 아니지만, 안전하게 사용 가능
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: 이벤트 리스너 설정 시도');

    if (saveNewJsonButton) {
        saveNewJsonButton.addEventListener('click', handleSaveNewJson);
        console.log('handleSaveNewJson 리스너 추가됨: saveNewJsonButton');
    } else {
        console.error('saveNewJsonButton 요소를 찾을 수 없어 리스너를 추가할 수 없습니다.');
    }

    if (getJsonByIndexButton) {
        getJsonByIndexButton.addEventListener('click', handleGetJsonByIndex);
        console.log('handleGetJsonByIndex 리스너 추가됨: getJsonByIndexButton');
    } else {
        console.error('getJsonByIndexButton 요소를 찾을 수 없어 리스너를 추가할 수 없습니다.');
    }

    if (getLatestJsonButton) {
        getLatestJsonButton.addEventListener('click', () => handleGetLatestJson());
        console.log('handleGetLatestJson 리스너 추가됨: getLatestJsonButton');
    } else {
        console.error('getLatestJsonButton 요소를 찾을 수 없어 리스너를 추가할 수 없습니다.');
    }

    // 초기 상태 메시지 (DOMContentLoaded 내부 또는 외부 - 파일 로드 시점으로 옮겨도 무방)
    if (statusDiv) { // statusDiv가 확실히 로드된 후 호출
        updateStatus("페이지 로드 완료. 블록체인 기능을 사용하세요.");
    } else {
        console.error("statusDiv를 찾을 수 없어 초기 메시지를 설정할 수 없습니다.");
    }
});


// --- 기능별 핸들러 함수 ---
async function handleSaveNewJson(): Promise<void> {
    console.log('handleSaveNewJson 함수 호출됨'); // 핸들러 함수 시작 확인

    if (!newJsonStringInput) {
        console.error('newJsonStringInput 요소를 찾을 수 없습니다.');
        updateStatus('입력 필드를 찾을 수 없습니다.', true);
        return;
    }
    const stringToStore = newJsonStringInput.value.trim();
    console.log('저장할 문자열:', stringToStore);

    if (!stringToStore) {
        updateStatus('저장할 JSON 문자열을 입력하세요.', true);
        return;
    }
    try {
        JSON.parse(stringToStore);
    } catch (e) {
        updateStatus('입력한 문자열이 유효한 JSON 형식이 아닙니다. 확인해주세요.', true);
        return;
    }

    if (resultAreaDiv) resultAreaDiv.innerHTML = '';
    if (saveNewJsonButton) {
        saveNewJsonButton.disabled = true;
        saveNewJsonButton.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
        console.log(`callAddJsonStringAPI 호출 직전. URL: ${BACKEND_API_BASE_URL}/jsons`); // API 호출 직전 로그
        const receipt = await callAddJsonStringAPI(stringToStore); // 여기서 fetch 발생
        console.log('callAddJsonStringAPI 응답 받음:', receipt);

        // ... (이후 로직은 이전과 동일)
        const count = await callGetJsonCountAPI();
        const newIndex = count > 0 ? count - 1 : 0;
        displayResult(
            `새로 저장된 JSON (인덱스: ${newIndex}) 및 처리 정보`,
            { index: newIndex, jsonString: stringToStore },
            receipt
        );

    } catch (error: any) {
        console.error('handleSaveNewJson 내 오류:', error);
        displayResult("새 기록 저장 중 최종 오류", { error: error.message }, undefined);
    } finally {
        if (saveNewJsonButton) {
            saveNewJsonButton.disabled = false;
            saveNewJsonButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

// callAddJsonStringAPI, updateStatus, displayResult 등 다른 함수들도 필요시 내부 시작점에 console.log 추가 가능

// --- (이전에 제공된 나머지 TypeScript 코드: 인터페이스 정의, 다른 API 호출 함수, 다른 핸들러 함수 등) ---
// 인터페이스 정의
interface ApiResponseAddJsonReceipt { message: string; transactionHash: string; blockHash?: string; blockNumber?: number; gasUsed?: string; }
interface ApiResponseCount { count: number; }
interface RetrievedJsonData { index: number; jsonString: string; }
interface ApiErrorResponse { details?: string; error?: string; }

// 설정
const BACKEND_API_BASE_URL: string = '';
const FUJI_EXPLORER_URL: string = 'https://testnet.snowtrace.io';

// 유틸리티 함수 (updateStatus, displayResult, escapeHtml - 이전 답변 내용 참고)
// updateStatus 함수는 statusDiv null 체크 추가
function updateStatus(message: string, isError: boolean = false, receiptForStatus?: ApiResponseAddJsonReceipt): void {
    console.log(`UI Status Update: ${message}`, receiptForStatus);
    if (!statusDiv) {
        console.error("statusDiv is null, cannot update status.");
        return;
    }
    // ... (이전과 동일한 updateStatus 로직) ...
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
    } else if (receiptForStatus || message.toLowerCase().includes("성공") || message.toLowerCase().includes("완료")) {
        statusDiv.classList.add('text-green-800', 'border-green-400', 'bg-green-100');
    } else {
        statusDiv.classList.add('text-gray-700', 'border-gray-400', 'bg-gray-200');
    }
}

// displayResult 함수 수정

function displayResult(
    action: string,
    data: RetrievedJsonData | string | object | null,
    receiptDetails?: ApiResponseAddJsonReceipt
): void {
    console.log(`Display Result for "${action}":`, data, receiptDetails);

    // 결과 영역의 제목 스타일 변경 (더 밝은 색상, 강조)
    let content = `<h3 class="text-xl font-semibold text-sky-400 mb-3">${action}</h3>`;

    // JSON 데이터 표시 <pre> 태그의 스타일 (기존 유지 또는 테마에 맞게 변경 가능)
    // 현재: 흰색 배경에 검정 텍스트로 가독성 확보
    const preClasses = "bg-white text-slate-800 p-3 border border-gray-300 rounded shadow-sm whitespace-pre-wrap text-sm text-left";

    const detailItemClass = "py-1";
    // 상세 정보 레이블 색상 변경 (더 밝게)
    const detailLabelClass = "font-semibold text-slate-300";
    // 상세 정보 값 색상 변경 (더 밝게)
    const detailValueClass = "text-slate-100 break-all";
    // 링크 색상 변경 (테마 일관성)
    const linkClasses = "text-sky-400 hover:text-sky-300 underline";


    if (data === null || data === undefined) {
        // "데이터 없음" 메시지 색상 변경
        content += `<p class='text-slate-400 italic'>데이터가 없거나 조회에 실패했습니다.</p>`;
    } else {
        // 1. JSON 내용 표시
        if (typeof data === 'object' && 'index' in data && 'jsonString' in data) {
            const retrievedData = data as RetrievedJsonData;
            content += `<div class="${detailItemClass}"><span class="${detailLabelClass}">인덱스:</span> <span class="${detailValueClass}">${retrievedData.index}</span></div>`;
            content += `<div class="${detailItemClass}"><span class="${detailLabelClass}">저장된 JSON 내용:</span>`;
            try {
                const parsedJson = JSON.parse(retrievedData.jsonString);
                content += `<pre class="${preClasses} mt-1">${escapeHtml(JSON.stringify(parsedJson, null, 2))}</pre>`;
            } catch (e) {
                content += `<p class="text-red-400 text-xs my-1">주의: 아래 내용은 유효한 JSON 형식이 아닙니다.</p>`;
                content += `<pre class="${preClasses} mt-1">${escapeHtml(retrievedData.jsonString)}</pre>`;
            }
            content += `</div>`;
        } else if (typeof data === 'string') {
            content += `<div class="${detailItemClass}"><span class="${detailLabelClass}">저장된 JSON 내용:</span>`;
            try {
                const parsedJson = JSON.parse(data);
                content += `<pre class="${preClasses} mt-1">${escapeHtml(JSON.stringify(parsedJson, null, 2))}</pre>`;
            } catch (e) {
                content += `<p class="text-red-400 text-xs my-1">주의: 아래 내용은 유효한 JSON 형식이 아닙니다.</p>`;
                content += `<pre class="${preClasses} mt-1">${escapeHtml(data)}</pre>`;
            }
            content += `</div>`;
        } else {
            content += `<div class="${detailItemClass}"><span class="${detailLabelClass}">오류 또는 기타 정보:</span>`;
            content += `<pre class="${preClasses} mt-1">${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
        }

        // 2. 트랜잭션 상세 정보 표시 (receiptDetails가 제공된 경우)
        if (receiptDetails) {
            content += `<div class="mt-3 pt-3 border-t border-slate-700 space-y-1 text-xs">`; // 테두리 색상 변경
            content += `<h4 class="text-sm font-semibold text-sky-300 mb-1">블록체인 처리 정보:</h4>`; // 부제목 색상 변경
            if (receiptDetails.transactionHash) {
                content += `
                    <div class="${detailItemClass}">
                        <span class="${detailLabelClass}">트랜잭션 해시:</span>
                        <a href="${FUJI_EXPLORER_URL}/tx/${receiptDetails.transactionHash}" target="_blank" rel="noopener noreferrer"
                           class="${linkClasses} ${detailValueClass}">${receiptDetails.transactionHash}</a>
                    </div>`;
            }
            if (receiptDetails.blockNumber !== undefined) {
                content += `
                    <div class="${detailItemClass}">
                        <span class="${detailLabelClass}">블록 번호:</span>
                        <a href="${FUJI_EXPLORER_URL}/block/${receiptDetails.blockNumber}" target="_blank" rel="noopener noreferrer"
                           class="${linkClasses} ${detailValueClass}">${receiptDetails.blockNumber}</a>
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
    if (resultAreaDiv) { // resultAreaDiv가 null이 아닌지 확인
        resultAreaDiv.innerHTML = content;
    } else {
        console.error("resultAreaDiv를 찾을 수 없습니다. 결과를 표시할 수 없습니다.");
    }
}

function escapeHtml(unsafe: string): string {
    if (typeof unsafe !== 'string') {
        try { unsafe = JSON.stringify(unsafe); } catch (e) { unsafe = String(unsafe); }
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// API 호출 함수 (callAddJsonStringAPI, callGetJsonCountAPI, callGetJsonByIndexAPI - 이전 답변 내용 참고)
async function callAddJsonStringAPI(stringToStore: string): Promise<ApiResponseAddJsonReceipt> {
    updateStatus('트랜잭션 전송 및 블록체인 기록 처리 중... 서버 응답을 기다립니다.');
    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/jsons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonString: stringToStore }),
        });
        const resultData = await response.json() as ApiResponseAddJsonReceipt | ApiErrorResponse;
        if (!response.ok) {
            const errorResult = resultData as ApiErrorResponse;
            throw new Error(`JSON 추가 실패 (서버): ${errorResult.details || errorResult.error || response.statusText}`);
        }
        const successResult = resultData as ApiResponseAddJsonReceipt;
        updateStatus(successResult.message || 'JSON 기록 및 트랜잭션 처리 완료!', false, successResult);
        return successResult;
    } catch (error: any) {
        console.error('callAddJsonStringAPI 오류:', error);
        updateStatus(`JSON 추가 API 호출 오류: ${error.message}`, true);
        throw error;
    }
}

async function callGetJsonCountAPI(): Promise<number> {
    updateStatus('저장된 총 데이터 개수 조회 중...');
    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/jsons/count`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ details: response.statusText })) as ApiErrorResponse;
            throw new Error(`JSON 개수 조회 실패 (서버): ${errorData.details || response.statusText}`);
        }
        const result = await response.json() as ApiResponseCount;
        updateStatus(`현재 총 ${result.count}개의 기록이 있습니다.`);
        return result.count;
    } catch (error: any) {
        console.error('callGetJsonCountAPI 오류:', error);
        updateStatus(`JSON 개수 API 호출 오류: ${error.message}`, true);
        throw error;
    }
}

async function callGetJsonByIndexAPI(index: number): Promise<RetrievedJsonData> {
    updateStatus(`인덱스 ${index}의 데이터 조회 중...`);
    try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/jsons/${index}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ details: response.statusText })) as ApiErrorResponse;
            if (response.status === 404) {
                throw new Error(`인덱스 ${index}에서 JSON을 찾을 수 없습니다 (서버): ${errorData.error || 'Not found'}`);
            }
            throw new Error(`인덱스 ${index}의 JSON 조회 실패 (서버): ${errorData.details || response.statusText}`);
        }
        const result = await response.json() as RetrievedJsonData;
        updateStatus(`인덱스 ${index}의 데이터 조회 성공!`);
        return result;
    } catch (error: any) {
        console.error('callGetJsonByIndexAPI 오류:', error);
        updateStatus(`인덱스 ${index} 조회 API 호출 오류: ${error.message}`, true);
        throw error;
    }
}

// 다른 핸들러 함수 (handleGetJsonByIndex, handleGetLatestJson - 이전 답변 내용 참고)
async function handleGetJsonByIndex(): Promise<void> {
    console.log('handleGetJsonByIndex 함수 호출됨');
    if (!jsonIndexInput) {
        console.error('jsonIndexInput 요소를 찾을 수 없습니다.');
        updateStatus('인덱스 입력 필드를 찾을 수 없습니다.', true);
        return;
    }
    const indexStr = jsonIndexInput.value.trim();
    if (indexStr === '') {
        updateStatus('조회할 인덱스를 입력하세요.', true);
        if (resultAreaDiv) resultAreaDiv.innerHTML = '';
        return;
    }
    const index = parseInt(indexStr, 10);
    if (isNaN(index) || index < 0) {
        updateStatus('유효한 음이 아닌 정수 인덱스를 입력하세요.', true);
        if (resultAreaDiv) resultAreaDiv.innerHTML = '';
        return;
    }

    if (resultAreaDiv) resultAreaDiv.innerHTML = '';
    if (getJsonByIndexButton) {
        getJsonByIndexButton.disabled = true;
        getJsonByIndexButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
    try {
        console.log(`callGetJsonByIndexAPI 호출 직전. Index: ${index}`);
        const retrievedData = await callGetJsonByIndexAPI(index);
        console.log('callGetJsonByIndexAPI 응답 받음:', retrievedData);
        displayResult(`인덱스 ${index} 기록`, retrievedData, undefined);
        updateStatus(`인덱스 ${index}의 데이터 조회가 완료되었습니다.`);
    } catch (error: any) {
        console.error('handleGetJsonByIndex 내 오류:', error);
        displayResult(`인덱스 ${index} 기록 조회 실패`, { error: error.message }, undefined);
    } finally {
        if (getJsonByIndexButton) {
            getJsonByIndexButton.disabled = false;
            getJsonByIndexButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

async function handleGetLatestJson(): Promise<void> {
    console.log('handleGetLatestJson 함수 호출됨');
    if (resultAreaDiv) resultAreaDiv.innerHTML = '';
    if (getLatestJsonButton) {
        getLatestJsonButton.disabled = true;
        getLatestJsonButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
    try {
        console.log('callGetJsonCountAPI 호출 직전 (최신 기록 조회용)');
        const count = await callGetJsonCountAPI();
        console.log('callGetJsonCountAPI 응답 받음 (최신 기록 조회용):', count);
        if (count === 0) {
            updateStatus('저장된 기록이 없습니다.');
            displayResult("최신 기록", null, undefined);
            return;
        }
        const latestIndex = count - 1;
        console.log(`callGetJsonByIndexAPI 호출 직전 (최신 기록 조회용). Index: ${latestIndex}`);
        const retrievedData = await callGetJsonByIndexAPI(latestIndex);
        console.log('callGetJsonByIndexAPI 응답 받음 (최신 기록 조회용):', retrievedData);
        displayResult(`최신 기록 (인덱스: ${latestIndex})`, retrievedData, undefined);
        updateStatus(`최신 기록(인덱스: ${latestIndex}) 조회가 완료되었습니다.`);

    } catch (error: any) {
        console.error('handleGetLatestJson 내 오류:', error);
        displayResult("최신 기록 조회 실패", { error: error.message }, undefined);
    } finally {
        if (getLatestJsonButton) {
            getLatestJsonButton.disabled = false;
            getLatestJsonButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}


console.log('blockdata.ts (또는 해당 파일) 로드 완료. DOMContentLoaded 대기 중...');