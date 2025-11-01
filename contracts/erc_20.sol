// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IIIToken is ERC20, Ownable {
    address public canteenAddress;

    constructor() ERC20("IIIT Token", "IIIT$") Ownable(msg.sender) {
        canteenAddress = 0xd84eF4FF10cB779077f2ECcBb982419E8b5107bA;
    }

    mapping(address => uint256) public totalRewards;
    mapping(address => string) public studentNames;

    struct Transaction {
        string reason;
        uint256 amount;
        uint256 timestamp;
    }
    mapping(address => Transaction[]) private studentHistory;

    function registerStudent(address student, string memory name) public {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(studentNames[student]).length == 0, "Student already registered");

        studentNames[student] = name;
        emit StudentRegistered(student, name);
    }

    function receivePayment(address student, uint256 amount, string memory reason) public {
    require(msg.sender == canteenAddress, "Only canteen can receive");
    bool success = transferFrom(student, canteenAddress, amount);
    require(success, "Transfer failed");
    emit PaymentReceived(student, amount, reason);
}

    function rewardStudent(address student, string memory reason) public onlyOwner {
        uint256 rewardAmount = getRewardAmount(reason);
        require(rewardAmount > 0, "Invalid reward type");
        require(bytes(studentNames[student]).length > 0, "Student not registered");

        _mint(student, rewardAmount * 10 ** decimals());
        totalRewards[student] += rewardAmount;

        studentHistory[student].push(Transaction({
            reason: reason,
            amount: rewardAmount,
            timestamp: block.timestamp
        }));

        emit RewardGiven(student, reason, rewardAmount);
    }

    function getRewardAmount(string memory reason) internal pure returns (uint256) {
        bytes32 hash = keccak256(abi.encodePacked(reason));
        if (hash == keccak256("attendance")) return 5;
        if (hash == keccak256("event")) return 5;
        if (hash == keccak256("sports")) return 10;
        if (hash == keccak256("grades")) return 15;
        return 0;
    }

    function getStudentHistory(address student) external view returns (Transaction[] memory) {
        return studentHistory[student];
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);

        if (to == canteenAddress && from != address(0)) {
            studentHistory[from].push(Transaction({
                reason: "Canteen Payment",
                amount: value / (10 ** decimals()),
                timestamp: block.timestamp
            }));
            emit StudentPayment(from, value);
        }
    }

    event RewardGiven(address indexed student, string reason, uint256 amount);
    event StudentRegistered(address indexed student, string name);
    event StudentPayment(address indexed student, uint256 amount);
}
