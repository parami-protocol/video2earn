import { Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { useIntl, useModel, history } from 'umi';
import style from './style.less';
// import { FaWallet } from 'react-icons/fa';
import { LogoutOutlined } from '@ant-design/icons';

const Header: React.FC = () => {
  const { Account, ChainId, connect, disconnect } = useModel('web3');
  const [menu, setMenu] = useState<boolean>(false);
  const [avavible, setAvavible] = useState<boolean>(false);

  const intl = useIntl();

  useEffect(() => {
    if (ChainId === 4) {
      setAvavible(true);
    } else {
      setAvavible(false);
    }
  }, [ChainId, Account]);

  return (
    <>
      <div className={style.headerContainer}>
        <div
          className={style.logo}
          onClick={() => {
            history.push('/');
          }}
        >
          <img src={'/images/background/moon.svg'} className={style.logoImg} />
          <span>MetaAstro</span>
        </div>
        <div className={style.connectWallet}>
          {!!Account && avavible ? (
            <div className={style.menuButton}>
              <Button
                type="default"
                size="large"
                shape="round"
                className={style.connectWalletBtn}
                // icon={<FaWallet className={style.icon} />}
                onClick={() => {
                  setMenu(!menu);
                }}
              >
                {`${Account.substring(0, 6)}...${Account.slice(-4)}`}
              </Button>
              <div
                className={style.headerMenu}
                style={{
                  height: menu ? '220px' : '0',
                }}
              >
                <div
                  className={style.menuItem}
                  onClick={async () => {
                    await disconnect();
                    setMenu(false);
                  }}
                >
                  <LogoutOutlined className={style.icon} />
                  {intl.formatMessage({
                    id: 'header.menu.logout',
                    defaultMessage: 'Logout',
                  })}
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="default"
              size="large"
              shape="round"
              className={style.connectWalletBtn}
              //   icon={<FaWallet className={style.icon} />}
              onClick={async () => {
                await connect();
              }}
            >
              {intl.formatMessage({
                id: 'header.connectWallet',
                defaultMessage: 'Connect Wallet',
              })}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
