import { useEffect, useState } from 'react';
import { Assets, fetchOpenSeaAssetOf } from '@/services/opensea';
import styles from './index.less';
import { fetchEthBalanceOf, fetchTokenBalanceOf } from '@/services/etherscan';
import { erc20contracts } from '@/config/custom_config';

interface TokenBalance {
  name: string;
  symbol: string;
  balance: number;
  decimal: number;
}

export const OnChainAssetWidget = ({ account }: { account: string }) => {
  if (!account) {
    return null;
  }

  const [assets, setAssets] = useState<Assets>({ assets: [] });
  const [etherBalance, setEtherBalance] = useState<string | number>('unknown');
  const [accountBalances, setAccountBalance] = useState<TokenBalance[]>([]);

  useEffect(() => {
    fetchOpenSeaAssetOf(account, 10).then((assets) => {
      setAssets(assets);
    });
    fetchEthBalanceOf(account).then((balance) => {
      setEtherBalance(balance.result / 10e18);
    });
    Promise.all(
      erc20contracts.map(async (contract) => {
        const balance = await fetchTokenBalanceOf(account, contract.address);
        return { ...contract, balance: balance.result };
      }),
    ).then((accountBalances) => {
      setAccountBalance(accountBalances);
    });
  }, []);

  const erc20Content = accountBalances.map((ab) => {
    return (
      <div key={ab.symbol}>
        {ab.name}({ab.symbol}): {ab.balance}
      </div>
    );
  });

  const asset_content = assets.assets.flatMap((asset, index) => {
    const contract = asset.asset_contract;
    if (!asset.image_url) {
      return [];
    }
    const price = asset.last_sale || 0;
    return [
      <div key={asset.token_id} className={styles.asset}>
        <img className={styles.asset_img} alt="asset image" src={asset.image_url} />
        <div className={styles.asset_info}>
          <div> price: {price} </div>
          <div>
            {' '}
            contract: {contract.name}/{contract.symbol}
          </div>
        </div>
      </div>,
    ];
  });

  return (
    <div>
      <div>peer account: {account}</div>
      <div>ether balance: {etherBalance}</div>
      <div>{erc20Content}</div>
      <div className={styles.on_chain_assets}>{asset_content}</div>
    </div>
  );
};
