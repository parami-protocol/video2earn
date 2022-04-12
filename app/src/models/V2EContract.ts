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

  // Initialize contract instances
  useEffect(() => {
    if (!Account) {
      setV2EContract(null);
    }
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
    Account,
  };
};
