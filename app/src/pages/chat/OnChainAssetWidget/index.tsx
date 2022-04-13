import {useEffect, useState} from "react";
import {Assets, fetchOpenSeaAssetOf} from "@/services/opensea";
import styles from './index.less';

export const OnChainAssetWidget = ({account}: { account: string}) => {
  if (!account) {
    return null;
  }

  const [assets, setAssets] = useState<Assets>({assets:[]})

  useEffect(() => {
    fetchOpenSeaAssetOf(account, 10)
      .then(assets => {
        setAssets(assets)
      })
  }, [])

  const asset_content = assets.assets.flatMap((asset, index) => {
    const contract = asset.asset_contract;
    if (!asset.image_url) {
      return [];
    }
    const price = asset.last_sale || 0;
    return [(<div key={asset.token_id} className={styles.asset}>
        <img className={styles.asset_img} alt="asset image" src={asset.image_url}/>
      <div className={styles.asset_info}>
        <div> price: {price} </div>
        <div> contract: {contract.name}/{contract.symbol}</div></div>
    </div>)]
  })

  return (<div>
    <p>peerAccount: {account}</p>
    <div className={styles.on_chain_assets}>
    {asset_content}
    </div>
  </div>)
}
