const TimelockWallet = artifacts.require("TimelockWallet");

module.exports = function(deployer) {
  deployer.deploy(TimelockWallet);
};
