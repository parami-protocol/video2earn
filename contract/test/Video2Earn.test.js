const { expect } = require('chai');

const Coin = artifacts.require('Coin');
const Video2Earn = artifacts.require('Video2Earn');

contract('Video2Earn', function (accounts) {
  beforeEach(async function () {
    this.coin = await Coin.new();
    this.v2e = await Video2Earn.new(this.coin.address,
                                    5,
                                    5,
                                    100,
                                    5);
  });

  it('mint a nft with ether and withdraw', async function () {
    // mint a nft
    await this.v2e.mint(1, {from: accounts[0], value: 200});
    const balance = await this.v2e.balanceOf(accounts[0]);

    const pendingWithdraw = await this.v2e.pendingWithdrawOf(accounts[0]);
    await this.v2e.withdraw()
    const pendingWithdrawAfter = await this.v2e.pendingWithdrawOf(accounts[0]);

    const nft = await this.v2e.nftInfoOf(0);

    assert.equal(balance, 1);
    assert.equal(pendingWithdraw, 100);
    assert.equal(pendingWithdrawAfter, 0);
    assert.equal(nft.intrest, 1);
    assert.equal(nft.value, 5);
  });

  it('happy path: start a session', async function () {
    const player1 = accounts[0]
    const player2 = accounts[1]

    await this.v2e.mint(1, {from: player1, value: 100});
    await this.v2e.mint(1, {from: player2, value: 100});

    await this.v2e.prepareChatSession(player2, 0, 1, {from: player1});
    await this.v2e.prepareChatSession(player1, 1, 1, {from: player2});

    const nft0 = await this.v2e.nftInfoOf(0);
    const nft1 = await this.v2e.nftInfoOf(1);

    const cs0 = await this.v2e.chatSessionOf(player1);
    const cs1 = await this.v2e.chatSessionOf(player2);


    assert.equal(nft0.value, 4)
    assert.equal(nft1.value, 4)
    assert.equal(cs0.state, 2)
    assert.equal(cs1.state, 2)
  });
});
