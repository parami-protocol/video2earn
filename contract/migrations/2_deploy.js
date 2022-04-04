const Coin = artifacts.require("Coin");
const Video2Earn = artifacts.require("Video2Earn");

module.exports = function (deployer) {
  deployer.deploy(Coin)
    .then(function() {
      return deployer.deploy(Video2Earn, Coin.address,
                           /* reward coin num*/ 5,
                           /* nft initial value */ 5,
                           /* nft mint fee in eth*/ 100,
                           /* nft repair fee in coin */ 5);
  })
};
