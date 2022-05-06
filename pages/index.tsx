import type { NextPage } from "next";
import Head from "next/head";
import { useRef, useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";

import styles from "../styles/Home.module.css";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";

const Home: NextPage = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [whiteListCount, setWhiteListCount] = useState(0);

  const web3ModalRef = useRef<any>();

  // Initiates provider, otherwise prompts signature
  const getProvider = async (requireSigner = false) => {
    // Provider required to interact with the blockchain - read balance/transactions/state/etc
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby :-)");
      throw new Error("Invalid Network. Change network to Rinkeby");
    }
    // Signer request to authorize transaction
    if (requireSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // Adds current connected wallet to the whitelist
  const addToWhitelist = async () => {
    try {
      const signer = await getProvider(true);
      const contract = new Contract(WHITELIST_CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.addToWhitelist();
      setLoadingState(true);
      // Wait for transaction to be mined
      await tx.wait();
      setLoadingState(false);
      await getWhitelistCount();
      setJoinedWhitelist(true);
      console.log(`Transaction = ${tx}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Gets number of whitelisted addresses
  const getWhitelistCount = async () => {
    const provider = await getProvider();
    const contract = new Contract(WHITELIST_CONTRACT_ADDRESS, abi, provider);
    // Call whitelisted count from contract
    const count = await contract.getWhiteListCount();
    setWhiteListCount(count);
  };

  // Checks to see if address is whitelisted
  const isWhitelisted = async () => {
    try {
      const signer: any = await getProvider(true);
      const contract = new Contract(WHITELIST_CONTRACT_ADDRESS, abi, signer);
      const address = await signer.getAddress();
      // Call whitelisted address from contract
      const _joinedWhitelist = await contract.whitelistedAddresses(address);
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };
  // Connects wallet and performs whitelist check
  const connectWallet = async () => {
    try {
      await getProvider();
      setWalletConnected(true);

      isWhitelisted();
      getWhitelistCount();
    } catch (err) {
      console.error(err);
    }
  };

  const whitelistButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loadingState) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        return (
          <button onClick={addToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
  };

  // If wallet is not connected, create a new instance of Web3Modal and connect to wallet
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Web3 Whitelist App</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Web3 Whitelist dApp</h1>
          <div className={styles.description}>Web3 whitelist waitinglist</div>
          <div className={styles.description}>
            {whiteListCount} have already joined the Whitelist
          </div>
          {whitelistButton()}
        </div>
        <div>
          <img className={styles.image} src="./stock-img.svg" />
        </div>
      </div>

      <footer className={styles.footer}>Made with &#10084;</footer>
    </div>
  );
};

export default Home;
