import { etherscanConfig } from '@/config/custom_config';
import { request } from 'umi';

interface Balance {
  result: number;
}

export async function fetchEthBalanceOf(account: string): Promise<Balance> {
  return request(etherscanConfig.endpoint, {
    method: 'GET',
    params: {
      module: 'account',
      action: 'balance',
      address: account,
      tag: 'latest',
      apikey: etherscanConfig.apiKey,
    },
  });
}

export async function fetchTokenBalanceOf(account: string, contract: string): Promise<Balance> {
  return request(etherscanConfig.endpoint, {
    method: 'GET',
    params: {
      module: 'account',
      action: 'tokenbalance',
      contractAddress: contract,
      address: account,
      tag: 'latest',
      apikey: etherscanConfig.apiKey,
    },
  });
}
