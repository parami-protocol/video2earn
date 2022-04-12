import type { BigNumber } from 'ethers';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
// abi
import { useModel } from 'umi';
import Video2EarnAbi from '@/config/abi/Video2Earn.json';
import { contractAddresses } from '@/config/custom_config';

export default () => {
  const { Account, ChainId, Provider, Signer } = useModel('web3');

  // Contract instances
  const [V2EContract, setV2EContract] = useState<ethers.Contract | null>(null);

  const balanceOfCurUser = async (): Promise<BigNumber> => {
    return await V2EContract?.balanceOf(Account);
  };

  const tokenOfCurUserByIndex = async (index: number): Promise<BigNumber> => {
    try {
      return (await V2EContract?.tokenOfOwnerByIndex(Account, index)) as BigNumber;
    } catch (e) {
      console.error('when call tokenOfCurUserByIndex, error occurs, ', e);
      throw e;
    }
  };

  const loadAllTokenOfCurUserInV2E = async (): Promise<BigNumber[]> => {
    //TODO(ironman_ch): async in paralell
    const res = [];
    const tokenCountOfCurUser = await balanceOfCurUser();
    for (let i = 0; tokenCountOfCurUser.gt(i); i++) {
      res.push(await tokenOfCurUserByIndex(i));
    }

    return res;
  };

  const nftInfoOf = async (tokenId: BigNumber): Promise<[BigNumber, number]> => {
    return await V2EContract?.nftInfoOf(tokenId);
  };

  const selectTokenWithCriteriaExistOfCurUser = async (
    fn: (nftInfo: [BigNumber, number]) => boolean,
  ): Promise<BigNumber | null> => {
    //TODO(ironman_ch): async in paralell
    const tokenIds = await loadAllTokenOfCurUserInV2E();
    for (const tokenId of tokenIds) {
      const nftInfoFromRemote = await nftInfoOf(tokenId);
      console.log('nftInfo is , ', nftInfoFromRemote);
      if (fn(nftInfoFromRemote)) {
        return tokenId;
      }
    }

    return null;
  };
  // Initialize contract instances
  useEffect(() => {
    if (!!Account) {
      if (ChainId !== 1 && ChainId !== 4) {
        setV2EContract(null);
        return;
      }
      if (!Provider || !Signer) {
        return;
      }
      const v2eContract = new ethers.Contract(
        contractAddresses.v2e[ChainId],
        Video2EarnAbi,
        Signer,
      );
      setV2EContract(v2eContract);
    }
  }, [Account, Provider, Signer, ChainId]);

  return {
    V2EContract,
    tokenOfCurUserByIndex,
    selectTokenWithCriteriaExistOfCurUser,
  };
};
