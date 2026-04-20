// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract ChatApp {
    struct User {
        string name;
        string encryptionPublicKey;
        Friend[] friendList;
    }

    struct Friend {
        address pubkey;
        string name;
    }

    struct Message {
        address sender;
        uint256 timestamp;
        string message;
    }

    struct AllUsers {
        string name;
        address accountAddress;
    }

    mapping(address => User) private userList;
    mapping(bytes32 => Message[]) private allMessages;
    AllUsers[] private allUsers;

    event UserCreated(address indexed account, string name, string encryptionPublicKey);
    event FriendAdded(address indexed account, address indexed friend, string friendName);
    event MessageSent(address indexed sender, address indexed receiver, string message, uint256 timestamp);
    event EncryptionPublicKeyUpdated(address indexed account, string encryptionPublicKey);

    function checkUserExists(address pubkey) public view returns (bool) {
        return bytes(userList[pubkey].name).length > 0;
    }

    function createAccount(string calldata name, string calldata encryptionPublicKey) external {
        require(checkUserExists(msg.sender) == false, "user already exists");
        require(bytes(name).length > 0, "username cannot be empty");
        require(bytes(encryptionPublicKey).length > 0, "encryption key cannot be empty");

        userList[msg.sender].name = name;
        userList[msg.sender].encryptionPublicKey = encryptionPublicKey;
        allUsers.push(AllUsers(name, msg.sender));

        emit UserCreated(msg.sender, name, encryptionPublicKey);
    }

    function updateEncryptionPublicKey(string calldata encryptionPublicKey) external {
        require(checkUserExists(msg.sender), "create an account first");
        require(bytes(encryptionPublicKey).length > 0, "encryption key cannot be empty");

        userList[msg.sender].encryptionPublicKey = encryptionPublicKey;
        emit EncryptionPublicKeyUpdated(msg.sender, encryptionPublicKey);
    }

    function getUsername(address pubkey) external view returns (string memory) {
        require(checkUserExists(pubkey), "user is not registered");

        return userList[pubkey].name;
    }

    function getEncryptionPublicKey(address pubkey) external view returns (string memory) {
        require(checkUserExists(pubkey), "user is not registered");
        require(bytes(userList[pubkey].encryptionPublicKey).length > 0, "encryption key is not set");

        return userList[pubkey].encryptionPublicKey;
    }

    function addFriend(address friendKey, string calldata friendName) external {
        require(checkUserExists(msg.sender), "create an account first");
        require(checkUserExists(friendKey), "friend is not registered");
        require(friendKey != msg.sender, "users cannot add themselves");
        require(checkAlreadyFriends(msg.sender, friendKey) == false, "already friends");

        userList[msg.sender].friendList.push(Friend(friendKey, friendName));
        userList[friendKey].friendList.push(Friend(msg.sender, userList[msg.sender].name));

        emit FriendAdded(msg.sender, friendKey, friendName);
    }

    function getMyFriendList() external view returns (Friend[] memory) {
        require(checkUserExists(msg.sender), "user is not registered");
        return userList[msg.sender].friendList;
    }

    function getAllUsers() external view returns (AllUsers[] memory) {
        return allUsers;
    }

    function sendMessage(address friendKey, string calldata newMessage) external {
        require(checkUserExists(msg.sender), "create an account first");
        require(checkUserExists(friendKey), "friend is not registered");
        require(checkAlreadyFriends(msg.sender, friendKey), "friend connection not found");
        require(bytes(newMessage).length > 0, "message cannot be empty");

        bytes32 chatCode = _getChatCode(msg.sender, friendKey);
        uint256 timestamp = block.timestamp;
        allMessages[chatCode].push(Message(msg.sender, timestamp, newMessage));

        emit MessageSent(msg.sender, friendKey, newMessage, timestamp);
    }

    function readMessages(address friendKey) external view returns (Message[] memory) {
        require(checkUserExists(msg.sender), "create an account first");
        require(checkUserExists(friendKey), "friend is not registered");
        require(checkAlreadyFriends(msg.sender, friendKey), "friend connection not found");

        bytes32 chatCode = _getChatCode(msg.sender, friendKey);
        return allMessages[chatCode];
    }

    function checkAlreadyFriends(address user1, address user2) public view returns (bool) {
        Friend[] memory friends = userList[user1].friendList;

        for (uint256 i = 0; i < friends.length; i++) {
            if (friends[i].pubkey == user2) {
                return true;
            }
        }

        return false;
    }

    function _getChatCode(address user1, address user2) internal pure returns (bytes32) {
        if (user1 < user2) {
            return keccak256(abi.encodePacked(user1, user2));
        }

        return keccak256(abi.encodePacked(user2, user1));
    }
}
