import {request} from "umi";
import {openSeaEndpoint, openSeaApiKey} from "@/config/custom_config";

export interface AssetContract {
  name: string,
  symbol: string,
  image_url: string,
  description: string,
  external_link: string,
}

export interface  Asset {
  token_id: string,
  image_url: string,
  name: string,
  background_color: string,
  external_link: string,
  asset_contract: AssetContract
  last_sale?: number
}

export interface Assets {
  assets: Asset[]
}

export async function fetchOpenSeaAssetOf(account: string, limit: number): Promise<Assets> {
  return request(openSeaEndpoint + "/api/v1/assets", {
    method: "GET",
    header: {
      'X-API-KEY': openSeaApiKey,
    },
    params: {
      "owner": account,
      "limit": limit,
    }
  })
}
