import { Row, Col, Button, Card } from 'antd';
import Footer from '@/components/Footer';
import Meta from 'antd/lib/card/Meta';
import { useModel } from 'umi';
import { ethers } from 'ethers';
import Header from '@/components/Header';

const BuyNFT: React.FC = () => {
  const { V2EContract } = useModel('V2EContract');
  const { Account } = useModel('web3');

  const buyNFT = async (nftIndex: number) => {
    console.log('buyNFT: ', nftIndex, ', with Account: ', Account);
    await V2EContract?.mint(nftIndex, { value: ethers.utils.parseEther('0.1') });
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
      <Header></Header>
      <div>
        <Row type="flex" justify="center">
          {channelCards}
        </Row>
        <Row type="flex" justify="center">
          <Footer></Footer>
        </Row>
      </div>
    </>
  );
};

export default BuyNFT;
