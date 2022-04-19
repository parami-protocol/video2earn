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
  apiKey: 'AUXAI7C81WNTM24SMTYFCGC853HX47VJPW',
};

export const erc20contracts = [
  {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    name: 'Tether USD',
    symbol: 'USDT',
    decimal: 10e6,
    img: './imgs/usdt.png',
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimal: 10e8,
    img: './imgs/btc.png',
  },
];

export const ethplorerApiEndpoint = 'https://api.ethplorer.io';
export const ethplorerKey = 'freekey';

export const matchServerAddress = 'http://44.242.150.190:6699';
