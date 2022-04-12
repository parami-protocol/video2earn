import { Card, Col, Row } from 'antd';
import Meta from 'antd/lib/card/Meta';
import type { BigNumber } from 'ethers';
import { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { loadAllTokenOfCurUserInV2E } from '@/services/contract/V2EService';

const ListNFT: React.FC = () => {
  const { V2EContract, Account } = useModel('V2EContract');
  const [tokenIdsOfCurUser, setTokenIdsOfCurUser] = useState<BigNumber[] | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      const tokenIds = await loadAllTokenOfCurUserInV2E(V2EContract, Account);
      setTokenIdsOfCurUser(tokenIds);
    };

    if (!!V2EContract && !!Account) {
      loadAll();
    }
  }, [V2EContract, Account]);

  console.log('enter list page, current tokenIds is: ', tokenIdsOfCurUser);

  return (
    <>
      <div>
        <Row type="flex" justify="center">
          {tokenIdsOfCurUser == null
            ? []
            : tokenIdsOfCurUser.map((tokenId) => {
                <Col key={tokenId.toHexString()} span="8">
                  <Card
                    style={{ width: 240 }}
                    cover={
                      <img
                        alt="example"
                        src="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png"
                      />
                    }
                  >
                    <Meta
                      title={'Video2Earn' + '#' + tokenId.toString()}
                      description="www.instagram.com"
                    />
                  </Card>
                </Col>;
              })}
        </Row>
      </div>
    </>
  );
};

export default ListNFT;
