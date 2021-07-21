import { assert } from 'chai';
import { wait } from './helper';

const TimelockWallet = artifacts.require("TimelockWallet");

require('chai')
  .use(require('chai-as-promised'))
  .should()

  contract ('Timelock Wallet', ([deployer]) => {

    let timelockWallet

    beforeEach(async() => {
        timelockWallet = await TimelockWallet.new()
    })

    describe('deploy', async() => {
        it('deploys successfully', async() => {
            assert.notEqual(timelockWallet.address, '')
            assert.notEqual(timelockWallet.address, 0x0)
            assert.notEqual(timelockWallet.address, null)
            assert.notEqual(timelockWallet.address, undefined)
        })

        it('owner equals to the 1st account', async() => {
            const accounts = await web3.eth.getAccounts()
            const owner = await timelockWallet.owner()
            assert.equal(accounts[0], owner)
        })

        it('Other get functions have correct initial values', async() => {
            const canWithdraw = await timelockWallet.canWithdraw()
            const countdown = await timelockWallet.countdown()
            const getBalance = await timelockWallet.getBalance()
            const lockTime = await timelockWallet.lockTime()
            const unlockTime = await timelockWallet.unlockTime()
            assert.equal(canWithdraw, false)
            assert.equal(countdown.toString(), 0)
            assert.equal(getBalance.toString(), 0)
            assert.equal(lockTime.toString(), 0)
            assert.equal(unlockTime.toString(), 0)
        })
    })

    describe('deposit', async() => {
        // Failure
        it('FAILURE: cannot deposit 0 ether', async() => {
            await timelockWallet.deposit(10, {value: '0', from: deployer}).should.be.rejected
        })

        it('FAILURE: cannot deposit for less than 10 seconds', async() => {
            await timelockWallet.deposit(9, {value: '1000000000000000000', from: deployer}).should.be.rejected
        })

        // SUCCESS
        it('can deposit 1 ether for 10 seconds', async() => {
            const beforeBal = await web3.eth.getBalance(deployer)
            console.log("User's Before Bal:", web3.utils.fromWei(beforeBal, 'ether'))

            // deposit 1 ether
            await timelockWallet.deposit(10, {value: '1000000000000000000', from: deployer})

            const afterBal = await web3.eth.getBalance(deployer)
            console.log("User's After Bal:", web3.utils.fromWei(afterBal, 'ether'))
            
            const canWithdraw = await timelockWallet.canWithdraw()
            const countdown = await timelockWallet.countdown()
            const getBalance = await timelockWallet.getBalance()
            const lockTime = await timelockWallet.lockTime()
            const unlockTime = await timelockWallet.unlockTime()
            
            assert.equal(canWithdraw, false)
            assert.equal(countdown.toString(), 10)
            assert.equal(web3.utils.fromWei(getBalance, 'ether'), 1)
            assert.notEqual(lockTime.toString(), 0)
            assert.notEqual(unlockTime.toString(), 0)
            // (lockTime + 10secs) should be equal to (unlockTime)
            assert.equal((new web3.utils.BN(lockTime).add(new web3.utils.BN('10'))).toString(), unlockTime.toString())

            console.log('Contract balance: ', web3.utils.fromWei(getBalance, 'ether'), ' ETH')
        }) 

        
        
    })

    describe('withdraw', async() => {
        // Failure
        it('cannot withdraw when deposited for less than 10 secs', async() => {
            const beforeBal = await web3.eth.getBalance(deployer)
            console.log("User's Before Bal:", web3.utils.fromWei(beforeBal, 'ether'))

            // deposit 1 ether for 10 secs
            await timelockWallet.deposit(10, {value: '1000000000000000000', from: deployer})

            const afterBal = await web3.eth.getBalance(deployer)
            console.log("User's After Bal:", web3.utils.fromWei(afterBal, 'ether'))

            const getBalanceBefore = await timelockWallet.getBalance()
            console.log('Contract balance before: ', web3.utils.fromWei(getBalanceBefore, 'ether'), ' ETH')
            
            // Note: MUST add 'new' function after wait() to let block.timestamp update!
            await wait(2)
            await TimelockWallet.new()

            const getBalanceAfter = await timelockWallet.getBalance()
            console.log('Contract balance after: ', web3.utils.fromWei(getBalanceAfter, 'ether'), ' ETH')

            await timelockWallet.withdraw().should.be.rejected
        })

        it('can withdraw when deposited for more than 10 secs', async() => {
            const beforeBal = await web3.eth.getBalance(deployer)
            console.log("User's Before Bal: ", web3.utils.fromWei(beforeBal, 'ether'))

            // deposit 1 ether for 10 secs
            await timelockWallet.deposit(10, {value: '1000000000000000000', from: deployer})

            const afterBal = await web3.eth.getBalance(deployer)
            console.log("User's After Bal: ", web3.utils.fromWei(afterBal, 'ether'))
            
            const getBalanceBefore = await timelockWallet.getBalance()
            console.log('Contract balance before: ', web3.utils.fromWei(getBalanceBefore, 'ether'), ' ETH')

            
            await wait(12)
            await TimelockWallet.new()
            // before withdrawing the funds, canWithdraw should be 'true'
            let canWithdraw = await timelockWallet.canWithdraw()
            assert.equal(canWithdraw, true)

            // withdraw the funds
            await timelockWallet.withdraw()

            // after withdrawing the funds, canWithdraw should be 'false'
            canWithdraw = await timelockWallet.canWithdraw()
            assert.equal(canWithdraw, false)

            // After withdrawal, the values of get functions should be reset to 0
            const countdown = await timelockWallet.countdown()
            const getBalanceAfter = await timelockWallet.getBalance()
            const lockTime = await timelockWallet.lockTime()
            const unlockTime = await timelockWallet.unlockTime()
            assert.equal(countdown.toString(), 0)
            assert.equal(getBalanceAfter.toString(), 0)
            assert.equal(lockTime.toString(), 0)
            assert.equal(unlockTime.toString(), 0)

            console.log('Contract balance after: ', web3.utils.fromWei(getBalanceAfter, 'ether'), ' ETH')

            const finalBal = await web3.eth.getBalance(deployer)
            console.log("User's Final Bal:", web3.utils.fromWei(finalBal, 'ether'))
        })
    })

  })