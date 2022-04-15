import { Card, Row, Col, Button } from 'antd';
import { CheckCard } from '@ant-design/pro-card';
import type { CheckGroupValueType } from '@ant-design/pro-card/lib/components/CheckCard/Group';
import { useModel } from 'umi';
import type { BigNumber } from 'ethers';
import { selectTokenWithCriteriaExistOfCurUser } from '@/services/contract/V2EService';
import { message } from 'antd';
import { history } from 'umi';

const { Meta } = Card;

const Index: React.FC = () => {
  const { V2EContract, Account } = useModel('V2EContract');

  const enterChannel = async (selectedChannel: CheckGroupValueType) => {
    //TODO(ironman_ch): add pre-check if user has corresponding nft
    if (!Account) {
      throw new Error('wallet not connected');
    }

    if (!V2EContract) {
      throw new Error('no v2e contract found');
    }

    if (!selectedChannel) {
      throw new Error('please select a channel');
    }

    const selectedTokenId = await selectTokenWithCriteriaExistOfCurUser(
      V2EContract,
      Account,
      (nftInfo: [BigNumber, number]) => {
        return nftInfo[0].gt(0) && nftInfo[1] == parseInt(selectedChannel as string);
      },
    );

    if (!selectedTokenId) {
      throw new Error('no tokenId selected');
    }

    console.log('enter channel: ', selectedChannel, ', with selectTokenId: ', selectedTokenId);
    history.push({
      pathname: '/chat-room',
      query: {
        channel: selectedChannel.toString(),
        tokenId: selectedTokenId.toString(),
      },
    });
  };

  const channelCards = ['business channel', 'social channel'].map((name, i) => (
    <Col key={name} span="8">
      <CheckCard
        style={{ width: 240 }}
        cover={
          <img alt="example" src="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png" />
        }
        value={i}
      >
        <Meta title={name} description="www.instagram.com" />
      </CheckCard>
    </Col>
  ));

  let selectedChannel: CheckGroupValueType = '0';

  return (
    <>
      <div>
        <Row type="flex" justify="center">
          <CheckCard.Group
            onChange={(value) => {
              console.log('value', value);
              selectedChannel = value;
            }}
            defaultValue={selectedChannel}
          >
            {channelCards}
          </CheckCard.Group>
        </Row>
        <Row type="flex" justify="center">
          <Button
            type="primary"
            size="large"
            onClick={() =>
              enterChannel(selectedChannel).catch((error) => {
                message.error(error.message);
              })
            }
          >
            Let's Chat
          </Button>
        </Row>
      </div>
    </>
  );
};

export default Index;
