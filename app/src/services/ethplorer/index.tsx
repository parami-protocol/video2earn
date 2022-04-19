import { ethplorerKey, ethplorerApiEndpoint } from '@/config/custom_config';
import { request } from 'umi';

export interface Price {
  rate: number;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  price: boolean | Price;
  decimals: number;
}

export interface Token {
  balance: number;
  tokenInfo: TokenInfo;
}

export interface ETHInfo {
  balance: number;
  price: Price;
}

export interface AddressInfo {
  ETH: ETHInfo;
  tokens: [Token];
}

export async function getAddressInfo(address: string): Promise<AddressInfo> {
  return request(`${ethplorerApiEndpoint}/getAddressInfo/${address}`, {
    method: 'GET',
    params: {
      apiKey: ethplorerKey,
      showETHTotals: true,
    },
  });
}
