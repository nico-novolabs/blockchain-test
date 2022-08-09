import React, { useEffect, useRef } from 'react';
import type { NextPage } from 'next'
import { ethers } from "ethers";
import {useState} from "react";
import axios from "axios";
// This function detects most providers injected at window.ethereum
import detectEthereumProvider from '@metamask/detect-provider';
import MetaMaskOnboarding from '@metamask/onboarding';
import crypto from "crypto";
import {payWithMetamask} from "./utils";

type ResponseType = {
    status: number,
    data: {
        wallet: ethers.Wallet;
    }
}

const Home: NextPage = () => {
    const [wallet, setWallet] = useState<any>({});
    const [status, setStatus] = useState('Not connected to MetaMask');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isTestNet, setIsTestNet] = useState<boolean>(false);
    const onboarding: any = React.useRef<MetaMaskOnboarding>();
    const [provider, setProvider] = useState<any>({});
    const [transactionHash, setTransactionHash] = useState<any>('');
    const [amount, setAmount] = useState('0.1');

    useEffect(() => {
        if (!onboarding.current) {
            onboarding.current = new MetaMaskOnboarding();
        }
        let existentWallet = localStorage.getItem('wallet') || '{}';
        existentWallet = JSON.parse(existentWallet);
        setWallet(existentWallet);
        getProvider();
    }, []);

    useEffect(() => {
        const detectMetamask = async () => {
            if (MetaMaskOnboarding.isMetaMaskInstalled() || await detectMetamaskInstallation()) {
                if (accounts.length > 0) {
                    setStatus(`Connected to MetaMask: ${JSON.stringify(accounts)}`);
                    onboarding.current.stopOnboarding();
                } else {
                    setStatus('Not connected to MetaMask');
                }
            } else {
                setStatus('Please install MetaMask')
            }
        }

        detectMetamask();
    }, [accounts]);

    const addPolygonNetwork = async () => {

        try {
            if (await detectMetamaskInstallation() && typeof window.ethereum !== 'undefined') {
                let params;

                if (!isTestNet) {
                    params = [{
                        chainId: '0x89',
                        chainName: 'Matic Mainnet',
                        nativeCurrency: {
                            name: 'MATIC',
                            symbol: 'MATIC',
                            decimals: 18
                        },
                        rpcUrls: ['https://polygon-rpc.com/'],
                        blockExplorerUrls: ['https://polygonscan.com/']
                    }]
                } else {
                    params = [{
                        chainId: '0x13881',
                        chainName: 'Polygon Testnet',
                        nativeCurrency: {
                            name: 'MATIC',
                            symbol: 'MATIC',
                            decimals: 18
                        },
                        rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
                        blockExplorerUrls: ['https://mumbai.polygonscan.com/']
                    }]
                }

                (window as any).ethereum
                    .request({
                        method: 'wallet_addEthereumChain',
                        params
                    })
                    .then((a: any, b: any) => console.log('Success', a, b))
                    .catch((error: any) => console.log("Error", error.message));
            } else {
                alert('Unable to locate a compatible web3 browser!');
            }
        } catch (e: any) {
            console.log('Error', e);
        }
    }

    const createWallet = async () => {
      try {
          const response: ResponseType = await axios.post(
              'api/create-wallet',
              {
                  extraEntropy: '',
                  locale: 'en',
                  path: ''
              }
          )
          console.log('response', response);

          if (response && response.status === 200) {
              setWallet(response.data.wallet);
              localStorage.setItem('wallet', JSON.stringify(response.data.wallet));
          } else {
              console.log('error', response);
          }
      } catch (e) {
          console.log('error', e);
      }
  }

    const connectMetamask = async () => {
        setStatus('Connecting to MetaMask..');
        if (MetaMaskOnboarding.isMetaMaskInstalled() || await detectMetamaskInstallation()) {
            console.log('MetaMask installed!');
            (window as any).ethereum
                .request({ method: 'eth_requestAccounts' })
                .then((newAccounts: any[]) => setAccounts(newAccounts));
        } else {
            try {
                onboarding.current.startOnboarding();
            } catch(e) {
                console.log('error', e);
            }
        }
        setStatus(`Connected to MetaMask: ${JSON.stringify(accounts)}`);
    }

    const detectMetamaskInstallation = async () => {
        return await detectEthereumProvider();
    }

    const getProvider = async () => {
        const polygonProvider = new ethers.providers.InfuraProvider( "maticmum")
        console.log('polygonProvider', polygonProvider);
        setProvider(polygonProvider);
    }

    const pay = async () => {
        setTransactionHash('Pending transaction...');
        if(accounts && accounts[0] && amount && wallet?.signingKey?.privateKey) {
            const hash = await payWithMetamask(accounts[0], accounts[0], amount, wallet.signingKey.privateKey);
            console.log('transactionHash', hash);
            setTransactionHash(hash)
        } else {
            setTransactionHash(`Tansaction failed`);
            alert(`Missing required attrs: ${accounts[0]}, ${amount}, ${wallet?.signingKey?.privateKey}`)
        }

    }

    return (
        <div>
            <h1>Metamask wallet creation test</h1>
            <br/>
            <h3>1. Wallet creation</h3>
            <button onClick={createWallet}>CREATE WALLET</button>
            <pre>Wallet: <span>{JSON.stringify(wallet, null, 4)}</span></pre>

            <br/>
            <p>---------------------------</p>
            <br/>

            <h3>2. Wallet conection to MetaMask</h3>
            <button onClick={connectMetamask}>CONNECT TO METAMASK</button>
            <pre>Status: {status}</pre>

            <br/>
            <p>---------------------------</p>
            <br/>

            <h3>3. Add Polygon Network</h3>
            <div>
                <label htmlFor="testNet">Polygon TestNet ? </label>
                <input
                    type="checkbox"
                    checked={isTestNet}
                    onChange={(e) => {setIsTestNet(e.target.checked)}}
                />
            </div>
            <br/>
            <button onClick={() => addPolygonNetwork()}>ADD POLYGON NETWORK</button>

            <br/>
            <p>---------------------------</p>
            <br/>
            <h3>Make Transaction</h3>
            <div>
                <label htmlFor="testNet">Amount: </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => {setAmount(e.target.value)}}
                />
            </div>
            <br/>
            <button onClick={() => pay()}>MAKE TRANSACTION</button>
            <pre>Transaction Hash: {JSON.stringify(transactionHash, null, 4)}</pre>

            <br/>
            <p>---------------------------</p>
            <br/>
            <h3>Provider</h3>
            <pre>Provider: {JSON.stringify(provider, null, 4)}</pre>
        </div>
    )
}

export default Home
