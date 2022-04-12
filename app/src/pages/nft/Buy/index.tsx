import { Row, Col, Button, Card } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { useModel } from 'umi';
import { mint } from '@/services/contract/V2EService';

const BuyNFT: React.FC = () => {
  const { V2EContract } = useModel('V2EContract');
  const { Account } = useModel('web3');

  const buyNFT = async (nftIndex: number) => {
    console.log('buyNFT: ', nftIndex, ', with Account: ', Account);
    await mint(V2EContract, nftIndex.toString());
  };

  const channelCards = ['business channel', 'social channel'].map((name, i) => (
    <Col key={name} span="8">
      <Card
        style={{ width: 240 }}
        cover={
          <img alt="example" src="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png" />
        }
      >
        <Meta title={name} description="www.instagram.com" />
      </Card>
      <Button type="primary" size="large" onClick={() => buyNFT(i)}>
        Buy
      </Button>
    </Col>
  ));

  return (
    <>
      <div>
        <Row type="flex" justify="center">
          {channelCards}
        </Row>
      </div>
    </>
  );
};

export default BuyNFT;
