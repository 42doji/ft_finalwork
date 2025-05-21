"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
const SimpleJsonArrayStorage_json_1 = __importDefault(require("./src/abi/SimpleJsonArrayStorage.json")); // ABI 파일 경로
// .env 파일 로드
dotenv_1.default.config();
// Fastify 인스턴스 생성
const server = (0, fastify_1.default)({ logger: true }); // 로깅 활성화
// --- 환경 변수 및 설정 ---
const port = Number(process.env.PORT) || 3000;
const rpcUrl = process.env.FUJI_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;
// 필수 환경 변수 확인
if (!rpcUrl || !privateKey || !contractAddress) {
    server.log.error('Missing required environment variables: FUJI_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS');
    process.exit(1);
}
// --- Ethers.js 설정 ---
let provider;
let signer;
let contract;
try {
    provider = new ethers_1.JsonRpcProvider(rpcUrl);
    // 🚨 중요: 프로덕션에서는 이렇게 비공개 키를 직접 사용하는 것은 안전하지 않습니다!
    signer = new ethers_1.ethers.Wallet(privateKey, provider);
    contract = new ethers_1.ethers.Contract(contractAddress, SimpleJsonArrayStorage_json_1.default.abi, signer); // <-- .abi 를 추가하세요!
    server.log.info(`Connected to contract at ${contractAddress} via RPC ${rpcUrl}`);
    server.log.info(`Using signer address: ${signer.address}`);
}
catch (error) {
    server.log.error('Failed to initialize ethers provider/signer/contract:', error);
    process.exit(1);
}
const addJsonOpts = {
    schema: {
        body: {
            type: 'object',
            required: ['jsonString'],
            properties: {
                jsonString: { type: 'string', minLength: 1 }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    transactionHash: { type: 'string' },
                    // newIndex: { type: 'number' } // 필요시 트랜잭션 결과에서 인덱스 파싱
                }
            },
            // 다른 응답 스키마 추가 가능 (e.g., 400 Bad Request, 500 Internal Server Error)
        }
    }
};
server.post('/jsons', addJsonOpts, async (request, reply) => {
    const { jsonString } = request.body;
    try {
        server.log.info(`Attempting to add JSON string: "${jsonString.substring(0, 50)}..."`);
        // 컨트랙트 함수 호출 (트랜잭션 전송)
        const tx = await contract.addJsonString(jsonString);
        server.log.info(`Transaction sent: ${tx.hash}`);
        // (선택 사항) 트랜잭션이 마이닝될 때까지 기다리고 결과 확인
        // const receipt = await tx.wait();
        // server.log.info(`Transaction mined in block: ${receipt?.blockNumber}`);
        // 여기서 이벤트 로그를 파싱하여 newIndex를 얻을 수도 있습니다.
        return {
            message: 'JSON string added successfully. Transaction sent.',
            transactionHash: tx.hash
        };
    }
    catch (error) {
        server.log.error('Error calling addJsonString:', error);
        // 가스 부족, revert 등 다양한 오류 가능
        reply.status(500).send({ error: 'Failed to add JSON string', details: error.message });
    }
});
// 2. 저장된 JSON 개수 조회 (Read Operation)
const getCountOpts = {
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    count: { type: 'number' } // BigInt를 숫자로 변환하여 반환
                }
            }
        }
    }
};
server.get('/jsons/count', getCountOpts, async (request, reply) => {
    try {
        const countBigInt = await contract.getJsonCount();
        const count = Number(countBigInt); // JSON 응답을 위해 숫자로 변환 (매우 큰 수는 BigInt로 유지 필요)
        server.log.info(`Workspaceed JSON count: ${count}`);
        return { count };
    }
    catch (error) {
        server.log.error('Error calling getJsonCount:', error);
        reply.status(500).send({ error: 'Failed to get JSON count', details: error.message });
    }
});
const getJsonByIndexOpts = {
    schema: {
        params: {
            type: 'object',
            properties: {
                index: { type: 'string', pattern: '^[0-9]+$' } // 숫자 문자열 검증
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    index: { type: 'number' },
                    jsonString: { type: 'string' }
                }
            },
            404: {
                type: 'object',
                properties: {
                    error: { type: 'string' }
                }
            }
        }
    }
};
server.get('/jsons/:index', getJsonByIndexOpts, async (request, reply) => {
    const index = parseInt(request.params.index, 10);
    if (isNaN(index) || index < 0) {
        return reply.status(400).send({ error: 'Invalid index provided. Must be a non-negative integer.' });
    }
    try {
        server.log.info(`Attempting to get JSON string at index: ${index}`);
        // getJsonStringByIndex 함수 호출 (또는 public getter 사용 가능: contract.storedJsonStrings(index))
        const jsonString = await contract.getJsonStringByIndex(index);
        server.log.info(`Found JSON string at index ${index}: "${jsonString.substring(0, 50)}..."`);
        return { index, jsonString };
    }
    catch (error) {
        // 컨트랙트에서 require 실패 시 (Index out of bounds 등) 에러 발생
        server.log.error(`Error calling getJsonStringByIndex for index ${index}:`, error);
        if (error.message.includes("Index out of bounds")) { // 에러 메시지 기반 처리 (더 나은 방법은 contract call revert 이유 확인)
            reply.status(404).send({ error: `JSON string not found at index ${index}` });
        }
        else {
            reply.status(500).send({ error: 'Failed to get JSON string', details: error.message });
        }
    }
});
// --- 서버 시작 ---
const start = async () => {
    try {
        await server.listen({ port: port, host: '0.0.0.0' }); // 모든 IP에서 접속 허용
        server.log.info(`Server listening on port ${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
