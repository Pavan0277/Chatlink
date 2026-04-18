import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { ethers } from "ethers";
import styles from "../styles/Home.module.css";
import { CHAT_APP_ABI, CHAT_APP_ADDRESS } from "../constants/chatApp";

const toShortAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const formatTime = (timestamp) => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const HARDHAT_CHAIN_ID = 31337;
const HARDHAT_CHAIN_ID_HEX = "0x7a69";

const toReadableError = (err) => {
  if (!err) {
    return "Unexpected error.";
  }

  if (err.code === "CALL_EXCEPTION") {
    return "Contract call failed. Usually this means wrong network or contract not deployed on current chain.";
  }

  return err.reason || err.message || "Unexpected error.";
};

export default function ChatApp() {
  const [provider, setProvider] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("Connect wallet to start.");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [friendAddressInput, setFriendAddressInput] = useState("");
  const [friendNameInput, setFriendNameInput] = useState("");
  const [search, setSearch] = useState("");
  const [composerText, setComposerText] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedFriendAddress, setSelectedFriendAddress] = useState("");
  const [messages, setMessages] = useState([]);

  const getContract = (signerOrProvider) => new ethers.Contract(CHAT_APP_ADDRESS, CHAT_APP_ABI, signerOrProvider);
  const toReader = (signerOrProvider) => (typeof signerOrProvider?.getSigner === "function" ? signerOrProvider.getSigner() : signerOrProvider);

  const ensureHardhatNetwork = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not found. Install MetaMask and refresh.");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: HARDHAT_CHAIN_ID_HEX,
              chainName: "Hardhat Local",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
            },
          ],
        });

        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
        });
      } else {
        throw switchError;
      }
    }
  };

  const validateChainAndContract = async (web3Provider) => {
    const network = await web3Provider.getNetwork();

    if (Number(network.chainId) !== HARDHAT_CHAIN_ID) {
      throw new Error("Wrong MetaMask network. Switch to Hardhat Local (Chain ID 31337).");
    }

    const code = await web3Provider.getCode(CHAT_APP_ADDRESS);
    if (!code || code === "0x") {
      throw new Error("No contract code found at configured address. Keep local chain running and redeploy contract.");
    }
  };

  const isContractConfigured = Boolean(CHAT_APP_ADDRESS);

  const filteredConversations = useMemo(
    () => friends.filter((chat) => chat.name.toLowerCase().includes(search.trim().toLowerCase()) || chat.pubkey.toLowerCase().includes(search.trim().toLowerCase())),
    [friends, search]
  );

  const activeFriend = useMemo(() => friends.find((friend) => friend.pubkey === selectedFriendAddress) || null, [friends, selectedFriendAddress]);

  const loadMessages = async (friendAddress, signerOrProvider = provider) => {
    if (!signerOrProvider || !friendAddress) {
      setMessages([]);
      return;
    }

    const contract = getContract(toReader(signerOrProvider));
    const chainMessages = await contract.readMessages(friendAddress);
    const normalized = chainMessages.map((item) => ({
      text: item.message,
      side: item.sender.toLowerCase() === walletAddress.toLowerCase() ? "right" : "left",
      meta: `${toShortAddress(item.sender)} ${formatTime(item.timestamp)}`,
    }));

    setMessages(normalized);
  };

  const loadFriends = async (signerOrProvider = provider) => {
    if (!signerOrProvider) {
      return;
    }

    const contract = getContract(toReader(signerOrProvider));
    const friendList = await contract.getMyFriendList();
    const normalizedFriends = friendList.map((item) => ({
      pubkey: item.pubkey,
      name: item.name || toShortAddress(item.pubkey),
      preview: "On-chain friend",
      time: "",
    }));

    setFriends(normalizedFriends);

    if (!selectedFriendAddress && normalizedFriends.length > 0) {
      setSelectedFriendAddress(normalizedFriends[0].pubkey);
    }
  };

  const loadProfile = async (signerOrProvider = provider, account = walletAddress) => {
    if (!signerOrProvider || !account) {
      return;
    }

    const contract = getContract(signerOrProvider);
    const exists = await contract.checkUserExists(account);

    if (!exists) {
      setAccountName("");
      setStatus("Create your account name to start chatting.");
      setFriends([]);
      setSelectedFriendAddress("");
      setMessages([]);
      return;
    }

    const username = await contract.getUsername(account);
    setAccountName(username);
    setStatus(`Welcome ${username}.`);
    await loadFriends(signerOrProvider);
  };

  const connectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        setError("MetaMask not found. Install MetaMask and refresh.");
        return;
      }

      if (!isContractConfigured) {
        setError("Contract address missing. Set NEXT_PUBLIC_CHATAPP_ADDRESS in .env.local.");
        return;
      }

      setIsBusy(true);
      setError("");
      await ensureHardhatNetwork();
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await validateChainAndContract(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const account = accounts[0];
      setProvider(web3Provider);
      setWalletAddress(account);
      await loadProfile(web3Provider, account);
    } catch (connectError) {
      setError(toReadableError(connectError));
    } finally {
      setIsBusy(false);
    }
  };

  const createAccount = async () => {
    try {
      const cleanName = nameInput.trim();
      if (!provider || !cleanName) {
        return;
      }

      setIsBusy(true);
      setError("");
      const signer = provider.getSigner();
      const contract = getContract(signer);
      const tx = await contract.createAccount(cleanName);
      await tx.wait();
      setNameInput("");
      await loadProfile(provider, walletAddress);
    } catch (txError) {
      setError(toReadableError(txError));
    } finally {
      setIsBusy(false);
    }
  };

  const addFriend = async () => {
    try {
      const address = friendAddressInput.trim();
      const alias = friendNameInput.trim();
      if (!provider || !ethers.utils.isAddress(address) || !alias) {
        setError("Enter a valid friend wallet address and a name.");
        return;
      }

      setIsBusy(true);
      setError("");
      const signer = provider.getSigner();
      const contract = getContract(signer);
      const tx = await contract.addFriend(address, alias);
      await tx.wait();
      setFriendAddressInput("");
      setFriendNameInput("");
      await loadFriends(provider);
      setStatus("Friend added successfully.");
    } catch (txError) {
      setError(toReadableError(txError));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      const cleanText = composerText.trim();
      if (!provider || !selectedFriendAddress || !cleanText) {
        return;
      }

      setIsBusy(true);
      setError("");
      const signer = provider.getSigner();
      const contract = getContract(signer);
      const tx = await contract.sendMessage(selectedFriendAddress, cleanText);
      await tx.wait();
      setComposerText("");
      await loadMessages(selectedFriendAddress, provider);
    } catch (txError) {
      setError(toReadableError(txError));
    } finally {
      setIsBusy(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (!provider || !selectedFriendAddress) {
      return;
    }

    loadMessages(selectedFriendAddress, provider).catch((loadError) => {
      setError(toReadableError(loadError));
    });
  }, [provider, selectedFriendAddress]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return undefined;
    }

    const handleAccountsChanged = (accounts) => {
      const nextAccount = accounts[0] || "";
      setWalletAddress(nextAccount);
      setAccountName("");
      setFriends([]);
      setMessages([]);
      setSelectedFriendAddress("");
      if (!nextAccount) {
        setStatus("Connect wallet to start.");
      } else {
        setStatus("Wallet changed. Syncing profile...");
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  useEffect(() => {
    if (!provider || !walletAddress) {
      return;
    }

    loadProfile(provider, walletAddress).catch((loadError) => {
      setError(toReadableError(loadError));
    });
  }, [provider, walletAddress]);

  return (
    <>
      <Head>
        <title>ChatLink</title>
        <meta name="description" content="Decentralized chat interface" />
      </Head>

      <main className={styles.page}>
        <div className={styles.bgGlowOne} />
        <div className={styles.bgGlowTwo} />

        <section className={styles.shell}>
          <aside className={styles.sidebar}>
            <div className={styles.brandRow}>
              <span className={styles.brandDot} />
              <h1>ChatLink</h1>
            </div>
            <p className={styles.tagline}>Encrypted conversations for Web3 teams</p>

            <p className={styles.statusText}>{status}</p>
            {error ? <p className={styles.walletError}>{error}</p> : null}

            {!walletAddress ? (
              <button className={styles.actionBtn} onClick={connectWallet} disabled={isBusy}>
                {isBusy ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : null}

            {walletAddress && !accountName ? (
              <div className={styles.formBlock}>
                <input type="text" value={nameInput} onChange={(event) => setNameInput(event.target.value)} className={styles.searchInput} placeholder="Create username" />
                <button className={styles.actionBtn} onClick={createAccount} disabled={isBusy || !nameInput.trim()}>
                  Create Account
                </button>
              </div>
            ) : null}

            {walletAddress && accountName ? (
              <div className={styles.formBlock}>
                <input type="text" value={friendAddressInput} onChange={(event) => setFriendAddressInput(event.target.value)} className={styles.searchInput} placeholder="Friend wallet address" />
                <input type="text" value={friendNameInput} onChange={(event) => setFriendNameInput(event.target.value)} className={styles.searchInput} placeholder="Friend display name" />
                <button className={styles.actionBtn} onClick={addFriend} disabled={isBusy || !friendAddressInput.trim() || !friendNameInput.trim()}>
                  Add Friend
                </button>
              </div>
            ) : null}

            <div className={styles.searchWrap}>
              <input type="text" placeholder="Search friends" className={styles.searchInput} value={search} onChange={(event) => setSearch(event.target.value)} disabled={!accountName} />
            </div>

            <div className={styles.list}>
              {filteredConversations.map((chat) => (
                <button key={chat.pubkey} className={`${styles.chatItem} ${chat.pubkey === activeFriend?.pubkey ? styles.chatItemActive : ""}`} onClick={() => setSelectedFriendAddress(chat.pubkey)}>
                  <div className={styles.avatar}>{chat.name.slice(0, 1)}</div>
                  <div className={styles.chatMeta}>
                    <div className={styles.chatTopLine}>
                      <strong>{chat.name}</strong>
                      <span>{toShortAddress(chat.pubkey)}</span>
                    </div>
                    <p>{chat.preview}</p>
                  </div>
                </button>
              ))}
              {filteredConversations.length === 0 ? <p className={styles.emptyState}>No friend found. Add a friend wallet to start chat.</p> : null}
            </div>
          </aside>

          <section className={styles.chatPanel}>
            <header className={styles.chatHeader}>
              <div>
                <h2>{activeFriend?.name || "No Active Chat"}</h2>
                <p>{walletAddress ? `Wallet: ${toShortAddress(walletAddress)}` : "Connect wallet"}</p>
              </div>
              <button className={styles.walletBtn} onClick={connectWallet} disabled={isBusy}>
                {walletAddress ? toShortAddress(walletAddress) : "Connect Wallet"}
              </button>
            </header>

            <div className={styles.messages}>
              {messages.map((message, index) => (
                <article key={`${message.meta}-${index}`} className={`${styles.bubble} ${message.side === "right" ? styles.bubbleRight : styles.bubbleLeft}`}>
                  <p>{message.text}</p>
                  <span>{message.meta}</span>
                </article>
              ))}
              {messages.length === 0 ? <p className={styles.emptyState}>No messages yet for this chat.</p> : null}
            </div>

            <footer className={styles.composer}>
              <input type="text" placeholder="Type a message..." className={styles.composerInput} value={composerText} onChange={(event) => setComposerText(event.target.value)} onKeyDown={handleComposerKeyDown} disabled={!activeFriend || isBusy} />
              <button className={styles.sendBtn} onClick={handleSendMessage} disabled={!activeFriend || isBusy || !composerText.trim()}>
                Send
              </button>
            </footer>
          </section>
        </section>
      </main>
    </>
  );
}