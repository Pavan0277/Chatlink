export const CHAT_APP_ADDRESS = process.env.NEXT_PUBLIC_CHATAPP_ADDRESS || "";

export const CHAT_APP_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "friendKey", "type": "address" }, { "internalType": "string", "name": "friendName", "type": "string" }],
    "name": "addFriend",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user1", "type": "address" }, { "internalType": "address", "name": "user2", "type": "address" }],
    "name": "checkAlreadyFriends",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "pubkey", "type": "address" }],
    "name": "checkUserExists",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "name", "type": "string" }],
    "name": "createAccount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllUsers",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "address", "name": "accountAddress", "type": "address" }
        ],
        "internalType": "struct ChatApp.AllUsers[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyFriendList",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "pubkey", "type": "address" },
          { "internalType": "string", "name": "name", "type": "string" }
        ],
        "internalType": "struct ChatApp.Friend[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "pubkey", "type": "address" }],
    "name": "getUsername",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "friendKey", "type": "address" }],
    "name": "readMessages",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "sender", "type": "address" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "string", "name": "message", "type": "string" }
        ],
        "internalType": "struct ChatApp.Message[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "friendKey", "type": "address" }, { "internalType": "string", "name": "newMessage", "type": "string" }],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
