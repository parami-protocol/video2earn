import { useEffect, useState } from 'react';
import { Assets, fetchOpenSeaAssetOf } from '@/services/opensea';
import styles from './index.less';
import { getAddressInfo } from '@/services/ethplorer';
import { message } from 'antd';

interface ERC20Info {
  ethBalance: number;
  ethValueInUSD: number;
  erc20ValueInUSD: number;
}

async function getERC20Info(address: string): Promise<ERC20Info> {
  const addressInfo = await getAddressInfo(address);

  const ethBalance = addressInfo.ETH.balance;
  const ethValueInUSD = ethBalance * addressInfo.ETH.price.rate;

  const erc20ValueInUSD = addressInfo.tokens
    .filter((token) => {
      return token.tokenInfo.price != false;
    })
    .map((token) => {
      if (typeof token.tokenInfo.price === 'boolean') {
        throw Error('token price is boolean type');
      }
      const rate = token.tokenInfo.price.rate;
      return (token.balance / Math.pow(10, token.tokenInfo.decimals)) * rate;
    })
    .reduce((prev, current) => prev + current, 0);

  return { ethBalance, ethValueInUSD, erc20ValueInUSD };
}

export const OnChainERC20Widget = ({ account }: { account: string }) => {
  if (!account) {
    return null;
  }
  const [erc20Info, setERC20Info] = useState<ERC20Info | null>(null);

  useEffect(() => {
    getERC20Info(account)
      .then((erc20Info) => setERC20Info(erc20Info))
      .catch((error) => message.error(error.message));
  }, []);

  if (erc20Info == null) {
    return null;
  }

  return (
    <div className={styles.coin_root}>
      <div className={styles.coin_title}>
        <img alt="eth" className={styles.coin_item_img} src="imgs/eth.png" />
      </div>
      <div className={styles.coin_title}>ERC20</div>
      <div className={styles.coin_value}>
        <div>{erc20Info.ethBalance.toFixed(2)}</div>
        <div>${erc20Info.ethValueInUSD.toFixed(2)}</div>
      </div>
      <div className={styles.coin_value}>${erc20Info.erc20ValueInUSD.toFixed(2)}</div>
    </div>
  );
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

  const sorted_assets = assets.assets
    .flatMap((asset, index) => {
      if (!asset.image_url) {
        return [];
      }
      return [asset];
    })
    .sort((a, b) => {
      return (a.last_sale || 0) - (b.last_sale || 0);
    });

  const total_eth = sorted_assets.map((a) => a.last_sale || 0.0).reduce((a, b) => a + b, 0);

  const asset_content = sorted_assets.map((asset) => {
    const style = {
      backgroundColor: asset.background_color,
    };

    return (
      <div>
        <div key={asset.token_id} style={style} className={styles.asset}>
          <img className={styles.asset_img} alt="asset image" src={asset.image_url} />
        </div>
        <div className={styles.asset_value}> ${asset.last_sale || 0}</div>
      </div>
    );
  });

  return (
    <div className={styles.on_chain_assets}>
      <div className={styles.on_chain_assets_title}>${total_eth}</div>
      <div className={styles.on_chain_assets_content}>{asset_content}</div>
    </div>
  );
};
