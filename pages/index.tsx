import type { NextPage } from "next";
import Head from "next/head";
import { useRef, useState, useEffect } from "react";
import Web3Provider from "web3modal";
import { providers, Contract } from "ethers";

import styles from "../styles/Home.module.css";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";

const Home: NextPage = () => {
  const [walletState, setWalletState] = useState(false);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [whiteListCount, setWhiteListCount] = useState(0);

  const web3ModalRef = useRef<any>();

  // Connects user to metamask, otherwise prompts signature
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
      const signer = await getProvider(true);
      const contract = new Contract(WHITELIST_CONTRACT_ADDRESS, abi, signer);
      const address = await signer.getAddress<any>();
      // Call whitelisted address from contract
      const _joinedWhitelist = await contract.whitelistedAddresses(address);
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    try {
      await getProvider();
      setWalletState(true);

      isWhitelisted();
      getWhitelistCount();
    } catch (err) {
      console.error(err);
    }
  };

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
          {renderButton()}
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
