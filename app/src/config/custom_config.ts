import { config } from 'dotenv';

config();
export const defaultChainId = 4;

export const contractAddresses = {
  v2e: {
    1: '0x05A7ee38C917aEF5557A1A20c0f2976D571cc822',
    4: '0x05A7ee38C917aEF5557A1A20c0f2976D571cc822',
  },
  coin: {
    1: '0x69459536E930D570DC166c780F6F416dF0eb9CEC',
    4: '0x69459536E930D570DC166c780F6F416dF0eb9CEC',
  },
};

export const openSeaApiKey = '';
export const openSeaEndpoint = 'https://testnets-api.opensea.io';

export const etherscanConfig = {
  endpoint: 'https://api.etherscan.io/api',
  apiKey: 'G5IZJQGRVT5KDR8718WQX5B71DMFK3MT8S',
};

export const erc20contracts = [
  {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    name: 'Tether USD',
    symbol: 'USDT',
    decimal: 10e6,
  },
  {
    address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
    name: 'BNB',
    symbol: 'BNB',
    decimal: 10e18,
  },
];
