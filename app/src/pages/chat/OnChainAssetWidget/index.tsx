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
  img: string;
}

export const OnChainERC20Widget = ({ account }: { account: string }) => {
  if (!account) {
    return null;
  }
  const [accountBalances, setAccountBalance] = useState<TokenBalance[]>([]);

  useEffect(() => {
    const balancePromises: Promise<TokenBalance>[] = [
      fetchEthBalanceOf(account).then((balance) => {
        return {
          address: '',
          balance: balance.result,
          name: 'Etherum',
          symbol: 'ETH',
          decimal: 10e18,
          img: './imgs/eth.png',
        };
      }),
    ];
    balancePromises.push(
      ...erc20contracts.map(async (contract) => {
        const balance = await fetchTokenBalanceOf(account, contract.address);
        return { ...contract, balance: balance.result };
      }),
    );

    Promise.all(balancePromises).then((accountBalances) => {
      setAccountBalance(accountBalances);
    });
  }, []);

  if (!accountBalances) {
    return null;
  }

  const erc20Content = accountBalances.map((ab) => {
    return (
      <div className={styles.coin_card} key={ab.symbol}>
        <div className={styles.coin_img_container}>
          <img src={ab.img} className={styles.coin_item_img} alt={ab.name} />
        </div>
        <div className={styles.coin_item_value_text}>
          {ab.symbol} {(ab.balance / ab.decimal).toFixed(2)}
        </div>
      </div>
    );
  });

  return <div className={styles.coin_root}>{erc20Content}</div>;
};

export const OnChainERC721Widget = ({ account }: { account: string }) => {
  if (!account) {
    return null;
  }

  const [assets, setAssets] = useState<Assets>({ assets: [] });

  useEffect(() => {
    fetchOpenSeaAssetOf(account, 10).then((assets) => {
      setAssets(assets);
    });
  }, []);

  if (!assets) {
    return null;
  }

  const asset_content = assets.assets.flatMap((asset, index) => {
    if (!asset.image_url) {
      return [];
    }
    const style = {
      backgroundColor: asset.background_color,
    };

    return [
      <div key={asset.token_id} style={style} className={styles.asset}>
        <img className={styles.asset_img} alt="asset image" src={asset.image_url} />
      </div>,
    ];
  });

  return (
    <div>
      <div className={styles.on_chain_assets}>{asset_content}</div>
    </div>
  );
};
