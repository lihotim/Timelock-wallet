import React, { Component } from 'react';
import Web3 from 'web3'
import TimelockWallet from '../abis/TimelockWallet.json'
import timelock2 from '../timelock2.png'
import './App.css';

class App extends Component {

  async componentDidMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {

    const web3 = window.web3

    //load accounts, fetch account's ETH balance
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })

    // fetch the '5777' value
    const networdId = await web3.eth.net.getId()

    // Load TimelockWallet smart contract
    const networkData = TimelockWallet.networks[networdId]
    if(networkData){
      const timelockWallet = new web3.eth.Contract(TimelockWallet.abi, networkData.address)
      this.setState({ timelockWallet })

      // Fetch all the 6 getter functions
      const canWithdraw = await new timelockWallet.methods.canWithdraw().call()
      this.setState({ canWithdraw })

      const countdown = await timelockWallet.methods.countdown().call()
      this.setState({ countdown: countdown.toString() })

      const getBalance = await timelockWallet.methods.getBalance().call()
      this.setState({ getBalance: web3.utils.fromWei(getBalance.toString(), 'ether') })
      // this.setState({ getBalance: getBalance.toString() })

      const lockTime = await timelockWallet.methods.lockTime().call()
      if(lockTime.toString()!=='0'){
        let lockDate = new Date( lockTime.toNumber() *1000);
        this.setState({ lockTime: lockDate.toLocaleString() })
      } else {
        this.setState({ lockTime: lockTime.toString() })
      }
      
      const owner = await timelockWallet.methods.owner().call()
      this.setState({ owner })

      const unlockTime = await timelockWallet.methods.unlockTime().call()
      if(unlockTime.toString()!=='0'){
        let unlockDate = new Date( unlockTime.toNumber() *1000);
        this.setState({ unlockTime: unlockDate.toLocaleString() })
      } else {
        this.setState({ unlockTime: unlockTime.toString() })
      }

      // Fetch the current time
      let myDate = new Date();
      this.setState({ now: myDate.toLocaleString() })
      
      // If current time has passed unlockTime, set 'canWithdraw' to 'true'
      let timeInMs = Date.now();
      if( unlockTime.toNumber()!==0 && timeInMs > unlockTime.toNumber()*1000){
        this.setState({ canWithdraw: true })
      }
      
    }else{
      window.alert('TimelockWallet contract not deployed to detected network.')
    }

    this.setState({loading:false})
  }

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      account:'0x0',
      timelockWallet: {},
      canWithdraw: false,
      countdown: 0,
      getBalance: 0,
      lockTime: 0,
      owner: '',
      unlockTime: 0,
      now: 0,
    };
  }

  deposit = (amount, countdown) => {
    this.setState({ loading: true })
    this.state.timelockWallet.methods.deposit(countdown).send({value: amount, from: this.state.account })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  withdraw = () => {
    this.setState({ loading: true })
    this.state.timelockWallet.methods.withdraw().send({from: this.state.account })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  render() {

    let content
    if(this.state.loading){
      content = <p id="loader" className="text-center"> Loading... </p>
    }else{
      content = 
      <div>
        <p>Owner: {this.state.owner}</p>
        <p>Contract's Balance: {this.state.getBalance} ETH</p>
        <p>Countdown: {this.state.countdown} seconds</p>
        <p>LockTime: {this.state.lockTime}</p>
        <p>UnlockTime: {this.state.unlockTime}</p>
        <p>Current time: {this.state.now}</p>
        <p>Can you withdraw now: {this.state.canWithdraw ? "Yes":"No"}</p>
        <hr/>

        <form onSubmit={(event) => {
            event.preventDefault()
            let input1, input2
            input1 = this.depositAmt.value
            input1 = input1 * 10**18
            input1 = input1.toString()
            // console.log(input1)

            input2 = this.depositTime.value
            input2 = input2.toString()
            // console.log(input2)
            this.deposit(input1, input2)
        }}>
          <h4> Minimum deposit time is 10 seconds. </h4>
          <p> Enter the amount and duration you want to deposit: </p>
             <label>Amount (ETH): </label>
              <input id="depositAmount"
                  type="number" 
                  step="0.01"
                  placeholder="Min: 0.01"
                  ref={(input) => { this.depositAmt = input }}
              />
              <br/>
              <label>Duration (seconds): </label>
              <input id="depositTime"
                  type="number" 
                  step="1"
                  placeholder="Min: 10 seconds"
                  ref={(input) => { this.depositTime = input }}
              />
              
              <br/>
            <input type="submit" value="Deposit" className="btn btn-danger my-3" />
        </form>

        <div id="withdrawButton">
           <button type="button" className="btn btn-success" onClick = {this.withdraw}>Withdraw</button>
        </div>

      </div>
    }

    return (
      <div>

        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://google.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            My Timelock Wallet
          </a>

          <div>
                <ul className="navbar-nav px-3">
                    <li className="nav-item flex-nowrap d-none d-sm-none d-sm-block">
                        <small className="navbar-text">
                            Your account: {this.state.account}
                        </small>
                    </li>
                </ul>

            </div>
        </nav>

        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <a
                  href="http://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={timelock2} className="App-logo" alt="logo" width="300"/>
                </a>
                <h1>My Timelock Wallet</h1>
                <hr/>
                    {content}
              </div>
            </main>
          </div>
        </div>

      </div>
    );
  }
}

export default App;
