const hre = require("hardhat");

async function main() {
  const ChatApp = await hre.ethers.getContractFactory("ChatApp");
  const chatApp = await ChatApp.deploy();

  await chatApp.deployed();

  console.log("ChatApp deployed to:", chatApp.address);
  console.log("Set NEXT_PUBLIC_CHATAPP_ADDRESS in .env.local to this address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
