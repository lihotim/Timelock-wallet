// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TimelockWallet{
    
    address payable public owner;
    
    // the moment user deposits (in Unix timestamp)
    uint public lockTime;
    
    // the moment user withdraws his funds (in Unix timestamp)
    uint public unlockTime;
    
    // the duration the user wants to lock his funds
    uint public countdown;
    
    constructor(){
        owner = payable(msg.sender);
    }
    
    modifier onlyOwner{
        require(msg.sender == owner, 'You are NOT the owner!');
        _;
    }
    
    event Deposited(uint lockTime, uint countdown, uint unlockTime, uint amount);
    event Withdrawn(uint withdrawTime);
    
    // This returns the CONTRACTS's ether balance, NOT this USER's ether balance!
    function getBalance() public view onlyOwner returns (uint) {
        return address(this).balance;
    }
    
    function deposit(uint _countdown) public payable onlyOwner {
        
        // require a certain period of time, say 10 secs, 1 day or 1 month
        require(_countdown >= 10, 'You must store the funds for at least 10 secs!');
        
        // require the amount to be greater than 0
        require(msg.value > 0, 'You must deposit some funds!');
        
        // require the owner has not deposited any funds yet
        require(lockTime == 0, 'You have already deposited!');
        
        // input how long we want to lock the funds
        countdown = _countdown;
        
        // record this moment's Unix timestamp
        lockTime = block.timestamp;
        
        // calculate unlock time
        unlockTime = lockTime + _countdown;
        
        emit Deposited(block.timestamp, _countdown, unlockTime, msg.value);
    }
    
    // Transfer ALL ether FROM smart contract TO owner.
    function withdraw() public onlyOwner {
        
        // require the countdown time and deposit time are not zero
        require(countdown !=0 && lockTime !=0, 'You did NOT deposit before!');
        
        // require the current time has already passed the coundown time
        require(block.timestamp >= lockTime+countdown, 'The funds CANNOT be unlocked yet!');

        // require there has some funds in the smart contract
        require(address(this).balance > 0, 'You have no funds to withdraw!');
        
        // reset countdown FIRST, to prevent re-entrancy attack
        countdown = 0;
        
        // reset deposit time FIRST, to prevent re-entrancy attack
        lockTime = 0;
        
        // reset unlock time FIRST, to prevent re-entrancy attack
        unlockTime = 0;
        
        // send owner all the funds back
        payable(msg.sender).transfer(address(this).balance);
        
        // emit the moment when the user withdraws
        emit Withdrawn(block.timestamp);
    }
    
    function canWithdraw() public view returns(bool) {
        
        if(lockTime!=0 && countdown!=0 && block.timestamp >= lockTime+countdown && address(this).balance > 0){
            // if it has already passed the coundown time now, return true
            return true;
            
        } else {
            // if it has not passed the coundown time yet, return 
            return false;
        }
    }
    
}


//   10**18 = 1000000000000000000


