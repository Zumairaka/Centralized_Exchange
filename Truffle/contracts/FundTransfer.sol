pragma solidity ^0.5.0;

contract FundTransfer {
    
    // state variable
    address companyAddress;
    
    constructor() public {
        companyAddress = msg.sender;
    }
    
    //event to alert after successful transaction
    event TransferEvent(address indexed toAddress, uint amount);
    
    // function to transfer the amount
    function fundTransfer(address payable toAddress) public payable{
        require(msg.sender == companyAddress, "Access Denied");
        toAddress.transfer(msg.value);
        emit TransferEvent(toAddress, msg.value);
    }
    
}
