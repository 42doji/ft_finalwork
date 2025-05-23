import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { ethers, Contract, Wallet, Provider, JsonRpcProvider, ContractTransactionResponse } from 'ethers';
import dotenv from 'dotenv';
import SimpleJsonArrayStorageABI from '../dist/src/abi/SimpleJsonArrayStorage.json' with { type: 'json' };
import cors from '@fastify/cors';
import path from 'path'; // path 모듈 추가
import { fileURLToPath } from 'url'; // ESM 환경에서 __dirname 대신 사용
import fastifyStatic from '@fastify/static'; // fastifyStatic 임포트

// .env 파일 로드
dotenv.config();


// ESM 환경에서 __filename, __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Fastify 인스턴스 생성
const server: FastifyInstance = Fastify({ logger: true }); // 로깅 활성화

server.register(cors, {
  origin: "*", // 모든 출처 허용 (개발 중에는 "*" 또는 특정 origin 'null' 사용 가능)
               // 프로덕션 환경에서는 실제 프론트엔드 도메인을 지정하는 것이 좋습니다.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메소드
  // allowedHeaders: ['Content-Type', 'Authorization'] // 필요시 허용할 헤더 추가
});

server.register(fastifyStatic, {
  root: path.join(__dirname, '..'), // 👈 현재 server.ts 파일 위치에서 한 단계 상위 폴더 (프로젝트 루트)를 가리킵니다.
  // index.html 파일이 프로젝트 루트에 있는지 확인하세요.
  // 만약 index.html이 다른 폴더 (예: 'public')에 있다면 경로를 수정해야 합니다.
  // 예: path.join(__dirname, '..', 'public')
  prefix: '/',                     // '/' 경로로 요청 시 static 파일 제공
  index: "index.html"              // 👈 이 옵션을 추가하거나 확인하세요!
});

// server.register(fastifyStatic, { ... }); 의 다음에 추가
server.get('/', async (request, reply) => {
  // static 플러그인에 설정된 root를 기준으로 파일을 전송합니다.
  // index.html이 staticRootPath 바로 아래에 있어야 합니다.
  return reply.sendFile('index.html');
});


// --- 환경 변수 및 설정 ---
const port = Number(process.env.PORT) || 3001;
const rpcUrl = process.env.FUJI_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

// 필수 환경 변수 확인
if (!rpcUrl || !privateKey || !contractAddress) {
  server.log.error('Missing required environment variables: FUJI_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS');
  process.exit(1);
}

// --- Ethers.js 설정 ---
let provider: Provider;
let signer: Wallet;
let contract: Contract;

try {
  provider = new JsonRpcProvider(rpcUrl);
  // 🚨 중요: 프로덕션에서는 이렇게 비공개 키를 직접 사용하는 것은 안전하지 않습니다!
  signer = new ethers.Wallet(privateKey, provider);
  contract = new ethers.Contract(contractAddress, SimpleJsonArrayStorageABI.abi, signer); // <-- .abi 를 추가하세요!
  server.log.info(`Connected to contract at ${contractAddress} via RPC ${rpcUrl}`);
  server.log.info(`Using signer address: ${signer.address}`);
} catch (error) {
  server.log.error('Failed to initialize ethers provider/signer/contract:', error);
  process.exit(1);
}

// --- API 라우트 정의 ---

// 1. JSON 문자열 추가 (Write Operation)
interface AddJsonBody {
  jsonString: string;
}

const addJsonOpts: RouteShorthandOptions = {
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

server.post<{ Body: AddJsonBody }>('/jsons', addJsonOpts, async (request, reply) => {
  const { jsonString } = request.body;
  try {
    server.log.info(`Attempting to add JSON string: "${jsonString.substring(0, 50)}..."`);
    // 컨트랙트 함수 호출 (트랜잭션 전송)
    const tx: ContractTransactionResponse = await contract.addJsonString(jsonString);
    server.log.info(`Transaction sent: ${tx.hash}`);

    // (선택 사항) 트랜잭션이 마이닝될 때까지 기다리고 결과 확인
    // const receipt = await tx.wait();
    // server.log.info(`Transaction mined in block: ${receipt?.blockNumber}`);
    // 여기서 이벤트 로그를 파싱하여 newIndex를 얻을 수도 있습니다.

    return {
      message: 'JSON string added successfully. Transaction sent.',
      transactionHash: tx.hash
    };
  } catch (error: any) {
    server.log.error('Error calling addJsonString:', error);
    // 가스 부족, revert 등 다양한 오류 가능
    reply.status(500).send({ error: 'Failed to add JSON string', details: error.message });
  }
});

// 2. 저장된 JSON 개수 조회 (Read Operation)
const getCountOpts: RouteShorthandOptions = {
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
    const countBigInt: bigint = await contract.getJsonCount();
    const count = Number(countBigInt); // JSON 응답을 위해 숫자로 변환 (매우 큰 수는 BigInt로 유지 필요)
    server.log.info(`Workspaceed JSON count: ${count}`);
    return { count };
  } catch (error: any) {
    server.log.error('Error calling getJsonCount:', error);
    reply.status(500).send({ error: 'Failed to get JSON count', details: error.message });
  }
});

// 3. 특정 인덱스의 JSON 문자열 조회 (Read Operation)
interface GetJsonParams {
  index: string;
}

const getJsonByIndexOpts: RouteShorthandOptions = {
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

server.get<{ Params: GetJsonParams }>('/jsons/:index', getJsonByIndexOpts, async (request, reply) => {
  const index = parseInt(request.params.index, 10);
  if (isNaN(index) || index < 0) {
      return reply.status(400).send({ error: 'Invalid index provided. Must be a non-negative integer.' });
  }

  try {
    server.log.info(`Attempting to get JSON string at index: ${index}`);
    // getJsonStringByIndex 함수 호출 (또는 public getter 사용 가능: contract.storedJsonStrings(index))
    const jsonString: string = await contract.getJsonStringByIndex(index);
    server.log.info(`Found JSON string at index ${index}: "${jsonString.substring(0, 50)}..."`);
    return { index, jsonString };
  } catch (error: any) {
    // 컨트랙트에서 require 실패 시 (Index out of bounds 등) 에러 발생
    server.log.error(`Error calling getJsonStringByIndex for index ${index}:`, error);
    if (error.message.includes("Index out of bounds")) { // 에러 메시지 기반 처리 (더 나은 방법은 contract call revert 이유 확인)
      reply.status(404).send({ error: `JSON string not found at index ${index}` });
    } else {
      reply.status(500).send({ error: 'Failed to get JSON string', details: error.message });
    }
  }
});

// --- 서버 시작 ---
const start = async () => {
  try {
    await server.listen({ port: port, host: '0.0.0.0' });
    server.log.info(`Server listening on http://localhost:<span class="math-inline">\{port\} or http\://<your\-ip\-address\>\:</span>{port}`);
    server.log.info(`Frontend should be accessible at http://localhost:<span class="math-inline">\{port\}/index\.html \(or just http\://localhost\:</span>{port}/ if default file serving is set up)`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
