import { BigNumber, Contract, ethers } from 'ethers';

const balanceOfCurUser = async (
  v2EContract: Contract | null,
  account: string,
): Promise<BigNumber> => {
  return await v2EContract?.balanceOf(account);
};

const tokenOfCurUserByIndex = async (
  v2EContract: Contract | null,
  account: string,
  index: number,
): Promise<BigNumber> => {
  try {
    return (await v2EContract?.tokenOfOwnerByIndex(account, index)) as BigNumber;
  } catch (e) {
    console.error('when call tokenOfCurUserByIndex, error occurs, ', e);
    throw e;
  }
};

const loadAllTokenOfCurUserInV2E = async (
  v2EContract: Contract | null,
  account: string,
): Promise<BigNumber[]> => {
  //TODO(ironman_ch): async in paralell
  const res = [];
  const tokenCountOfCurUser = await balanceOfCurUser(v2EContract, account);
  for (let i = 0; tokenCountOfCurUser.gt(i); i++) {
    res.push(await tokenOfCurUserByIndex(v2EContract, account, i));
  }

  return res;
};

const nftInfoOf = async (
  v2EContract: Contract | null,
  tokenId: BigNumber,
): Promise<[BigNumber, number]> => {
  return await v2EContract?.nftInfoOf(tokenId);
};

const selectTokenWithCriteriaExistOfCurUser = async (
  v2eContract: Contract | null,
  account: string,
  fn: (nftInfo: [BigNumber, number]) => boolean,
): Promise<BigNumber | null> => {
  //TODO(ironman_ch): async in paralell
  const tokenIds = await loadAllTokenOfCurUserInV2E(v2eContract, account);
  for (const tokenId of tokenIds) {
    const nftInfoFromRemote = await nftInfoOf(v2eContract, tokenId);
    console.log('nftInfo is , ', nftInfoFromRemote);
    if (fn(nftInfoFromRemote)) {
      return tokenId;
    }
  }

  return null;
};

const mint = async (v2eContract: Contract | null, nftIndex: string) => {
  return await v2eContract?.mint(nftIndex, { value: ethers.utils.parseEther('0.1') });
};

export { selectTokenWithCriteriaExistOfCurUser, loadAllTokenOfCurUserInV2E, mint };
