//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// interface with the deposit and withdraw functions that we'll call from this contract
interface IETHTornado {

  function deposit (bytes32 commitment) external payable;

  function withdraw (
    bytes calldata _proof,
    bytes32 _root,
    bytes32 _nullifierHash,
    address payable _recipient,
    address payable _relayer,
    uint256 _fee,
    uint256 _refund
  ) external payable;

}

// Juicebox ETH terminal contract
interface IJuiceboxETHPay {

  function pay (
    uint256 _projectId, 
    uint256 _amount, 
    address _token, 
    address _beneficiary, 
    uint256 _minReturnedTokens, 
    bool _preferClaimedTokens, 
    string memory _memo, 
    bytes memory _metadata
  ) external payable;

}

contract YourContract {

  // we instantiate the different Tornado cash ETH instances
  IETHTornado public immutable zeroPointOneEther;
  IETHTornado public immutable oneEther;
  IETHTornado public immutable tenEther;
  IETHTornado public immutable hundredEther;

  // JB instance
  IJuiceboxETHPay public immutable jb;

  constructor (
    address _zeroPointOneEther,
    address _oneEther,
    address _tenEther,
    address _hundredEther,
    address _jbETHTerminal
  ) {

    zeroPointOneEther = IETHTornado(_zeroPointOneEther);
    oneEther = IETHTornado(_oneEther);
    tenEther = IETHTornado(_tenEther);
    hundredEther = IETHTornado(_hundredEther);
    jb = IJuiceboxETHPay(_jbETHTerminal);

  }

  // deposits ETH into the tornado mixer
  function deposit(bytes32 commitment) external payable {
    require(msg.value > 0, "Invalid payment!");

    if(msg.value == 100000000000000000) { // 0.1 ETH
      zeroPointOneEther.deposit{value: msg.value}(commitment);
    }
    else if(msg.value == 1 ether) { // 1 ETH
      oneEther.deposit{value: msg.value}(commitment);
    }
    else if(msg.value == 10 ether) { // 10 ETH
      tenEther.deposit{value: msg.value}(commitment);
    }
     else if(msg.value == 100 ether) { // 100 ETH
      hundredEther.deposit{value: msg.value}(commitment);
    }
    
  }

  function withdraw(
    bytes calldata _proof,
    bytes32 _root,
    bytes32 _nullifierHash,
    address payable _recipient,
    address payable _relayer,
    uint256 _fee,
    uint256 _refund
  ) external payable {

  }


  // to support receiving ETH by default
  // shold only receive ETH from the ETHTornado contract
  receive() external payable {}
  fallback() external payable {}
}
