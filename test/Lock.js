const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("ChatApp", function () {
  async function deployFixture() {
    const [owner, friend, another] = await ethers.getSigners();
    const ChatApp = await ethers.getContractFactory("ChatApp");
    const chatApp = await ChatApp.deploy();
    return { chatApp, owner, friend, another };
  }

  it("creates account and resolves username", async function () {
    const { chatApp, owner } = await loadFixture(deployFixture);
    await chatApp.connect(owner).createAccount("Owner");

    expect(await chatApp.checkUserExists(owner.address)).to.equal(true);
    expect(await chatApp.getUsername(owner.address)).to.equal("Owner");
  });

  it("prevents duplicate account", async function () {
    const { chatApp } = await loadFixture(deployFixture);
    await chatApp.createAccount("Owner");
    await expect(chatApp.createAccount("Owner2")).to.be.revertedWith("user already exists");
  });

  it("adds friend bi-directionally", async function () {
    const { chatApp, owner, friend } = await loadFixture(deployFixture);
    await chatApp.connect(owner).createAccount("Owner");
    await chatApp.connect(friend).createAccount("Friend");

    await chatApp.connect(owner).addFriend(friend.address, "Friend Alias");

    const ownerFriends = await chatApp.connect(owner).getMyFriendList();
    const friendFriends = await chatApp.connect(friend).getMyFriendList();

    expect(ownerFriends).to.have.lengthOf(1);
    expect(friendFriends).to.have.lengthOf(1);
    expect(ownerFriends[0].name).to.equal("Friend Alias");
    expect(friendFriends[0].name).to.equal("Owner");
  });

  it("prevents invalid friend additions", async function () {
    const { chatApp, owner, friend } = await loadFixture(deployFixture);
    await chatApp.connect(owner).createAccount("Owner");

    await expect(chatApp.connect(owner).addFriend(owner.address, "Owner")).to.be.revertedWith(
      "users cannot add themselves"
    );

    await expect(chatApp.connect(owner).addFriend(friend.address, "Friend")).to.be.revertedWith(
      "friend is not registered"
    );
  });

  it("sends and reads messages", async function () {
    const { chatApp, owner, friend } = await loadFixture(deployFixture);
    await chatApp.connect(owner).createAccount("Owner");
    await chatApp.connect(friend).createAccount("Friend");
    await chatApp.connect(owner).addFriend(friend.address, "Friend");

    await chatApp.connect(owner).sendMessage(friend.address, "Hello");
    await chatApp.connect(friend).sendMessage(owner.address, "Hi");

    const messages = await chatApp.connect(owner).readMessages(friend.address);
    expect(messages).to.have.lengthOf(2);
    expect(messages[0].message).to.equal("Hello");
    expect(messages[1].message).to.equal("Hi");
  });

  it("prevents messaging without friendship", async function () {
    const { chatApp, owner, friend } = await loadFixture(deployFixture);
    await chatApp.connect(owner).createAccount("Owner");
    await chatApp.connect(friend).createAccount("Friend");

    await expect(chatApp.connect(owner).sendMessage(friend.address, "Nope")).to.be.revertedWith(
      "friend connection not found"
    );
  });

  it("tracks all users", async function () {
    const { chatApp, owner, friend, another } = await loadFixture(deployFixture);
    await chatApp.connect(owner).createAccount("Owner");
    await chatApp.connect(friend).createAccount("Friend");
    await chatApp.connect(another).createAccount("Another");

    const allUsers = await chatApp.getAllUsers();
    expect(allUsers).to.have.lengthOf(3);
    expect(allUsers[0].name).to.equal("Owner");
    expect(allUsers[2].accountAddress).to.equal(another.address);
  });
});
