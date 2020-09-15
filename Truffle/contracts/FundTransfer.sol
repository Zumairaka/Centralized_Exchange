pragma solidity ^0.5.0;

contract FundTransfer {
    
    // state variable
    
    constructor() public {
    }
    
    //event to alert after successful transaction
    event TransferEvent(address indexed toAddress, uint amount);
    
    // function to transfer the amount
    function fundTransfer(address payable toAddress) public payable{
        toAddress.transfer(msg.value);
        emit TransferEvent(toAddress, msg.value);
    }
    
}
