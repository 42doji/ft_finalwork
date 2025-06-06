import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { ethers, Contract, Wallet, Provider, JsonRpcProvider, ContractTransactionResponse, TransactionReceipt } from 'ethers'; // TransactionReceipt 추가
import dotenv from 'dotenv';
import SimpleJsonArrayStorageABI from './src/abi/SimpleJsonArrayStorage.json';
import cors from '@fastify/cors';

// .env 파일 로드
dotenv.config();

const server: FastifyInstance = Fastify({ logger: true });

server.register(cors, {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// --- 환경 변수 및 설정 ---
const port = Number(process.env.PORT) || 3001;
const rpcUrl = process.env.FUJI_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!rpcUrl || !privateKey || !contractAddress) {
  server.log.error('Missing required environment variables: FUJI_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS');
  process.exit(1);
}

let provider: Provider;
let signer: Wallet;
let contract: Contract;

try {
  provider = new JsonRpcProvider(rpcUrl);
  signer = new ethers.Wallet(privateKey, provider);
  contract = new ethers.Contract(contractAddress, SimpleJsonArrayStorageABI.abi, signer);
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

// 응답 스키마 업데이트
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
          blockHash: { type: 'string' },         // 추가
          blockNumber: { type: 'number' },       // 추가
          gasUsed: { type: 'string' },           // 추가 (BigNumber.toString() 형태)
          // newIndex: { type: 'number' } // 필요시 이벤트 파싱
        }
      },
      // 500 등 다른 응답 스키마
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: { type: 'string' }
        }
      }
    }
  }
};

server.post<{ Body: AddJsonBody }>('/jsons', addJsonOpts, async (request, reply) => {
  const { jsonString } = request.body;
  try {
    server.log.info(`Attempting to add JSON string: "${jsonString.substring(0, 50)}..."`);

    const tx: ContractTransactionResponse = await contract.addJsonString(jsonString);
    server.log.info(`Transaction sent: ${tx.hash}. Waiting for confirmation...`);

    // 트랜잭션이 마이닝될 때까지 기다리고 결과(영수증) 확인
    const receipt: TransactionReceipt | null = await tx.wait(); // tx.wait()는 null을 반환할 수 있음 (ethers v6 기준, v5는 TransactionReceipt)
    // ethers v5에서 tx.wait()는 보통 null을 반환하지 않지만, 타입 안전성을 위해 확인

    if (!receipt) {
      server.log.error(`Transaction ${tx.hash} failed to confirm or receipt is null.`);
      return reply.status(500).send({
        error: 'Transaction failed to confirm.',
        details: `Receipt was null for transaction ${tx.hash}`
      });
    }

    server.log.info(`Transaction ${tx.hash} confirmed in block: ${receipt.blockNumber}`);

    // 여기서 이벤트 로그를 파싱하여 newIndex를 얻을 수도 있습니다.
    // 예: receipt.logs.forEach(log => { /* ... */ });

    return {
      message: 'JSON string added and transaction confirmed.',
      transactionHash: receipt.hash, // 영수증의 hash 사용 (동일하지만 명시적)
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString() // gasUsed는 BigNumber이므로 문자열로 변환
    };
  } catch (error: any) {
    server.log.error('Error calling addJsonString or waiting for receipt:', error);
    const errorMessage = error.reason || error.message || "An unknown error occurred";
    // revert된 트랜잭션의 경우 error 객체에 정보가 있을 수 있음
    if (error.receipt) { // 트랜잭션이 revert된 경우 receipt 정보가 있을 수 있음
      server.log.error('Transaction reverted. Receipt:', error.receipt);
    }
    reply.status(500).send({ error: 'Failed to add JSON string', details: errorMessage });
  }
});

// 2. 저장된 JSON 개수 조회 (Read Operation) - 변경 없음
const getCountOpts: RouteShorthandOptions = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          count: { type: 'number' }
        }
      }
    }
  }
};

server.get('/jsons/count', getCountOpts, async (request, reply) => {
  try {
    const countBigInt: bigint = await contract.getJsonCount();
    const count = Number(countBigInt);
    server.log.info(`Retrieved JSON count: ${count}`); // 로그 메시지 수정
    return { count };
  } catch (error: any) {
    server.log.error('Error calling getJsonCount:', error);
    reply.status(500).send({ error: 'Failed to get JSON count', details: error.message });
  }
});

// 3. 특정 인덱스의 JSON 문자열 조회 (Read Operation) - 변경 없음
interface GetJsonParams {
  index: string;
}

const getJsonByIndexOpts: RouteShorthandOptions = {
  schema: {
    params: {
      type: 'object',
      properties: {
        index: { type: 'string', pattern: '^[0-9]+$' }
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
    const jsonString: string = await contract.getJsonStringByIndex(index);
    server.log.info(`Found JSON string at index ${index}: "${jsonString.substring(0, 50)}..."`);
    return { index, jsonString };
  } catch (error: any) {
    server.log.error(`Error calling getJsonStringByIndex for index ${index}:`, error);
    // ethers v5에서 revert 이유는 error.reason 또는 error.error.message 등에 있을 수 있음
    // 보다 정확한 revert 이유를 확인하려면 error 객체를 자세히 조사해야 함
    const revertReason = error.reason || (error.error && error.error.message) || error.message;
    if (revertReason && revertReason.includes("Index out of bounds")) {
      reply.status(404).send({ error: `JSON string not found at index ${index}` });
    } else {
      reply.status(500).send({ error: 'Failed to get JSON string', details: revertReason });
    }
  }
});

// --- 서버 시작 ---
const start = async () => {
  try {
    await server.listen({ port: port, host: '0.0.0.0' });
    // server.log.info(`Server listening on port ${port}`); // listen에서 이미 로그 출력
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();