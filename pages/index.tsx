import React, { useEffect } from 'react';
import type { NextPage } from 'next'
import { ethers } from "ethers";
import {useState} from "react";
import axios from "axios";
// This function detects most providers injected at window.ethereum
import detectEthereumProvider from '@metamask/detect-provider';
import MetaMaskOnboarding from '@metamask/onboarding';
import NodeWalletConnect from "@walletconnect/client";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import {makeTransactionWithEthers} from "./ethers";
import {makeTransactionWithWalletConnect} from "./walletConnect";
import {
    CollectionDataType,
    createNFTCollectionWithMint4All,
    getNFTCollectionWithMint4All,
    MintNftDataType,
    mintNFTFromCollection
} from "./mint4all";
import {makeTransactionWithMetamask} from "./metamask";

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
    const [transactionHash, setTransactionHash] = useState<any>('');
    const [amount, setAmount] = useState('0.1');
    const [scannedWallet, setScannedWallet] = useState<any>({});
    const [walletConnect, setWalletConnect] = useState<any>({});
    const [nftCollectionData, setNftCollectionData] = useState<any>({});
    const [retrievedNftCollectionData, setRetrievedNftCollectionData] = useState<any>({});
    const [mintedNftData, setMintedNftData] = useState<any>({});
    const [collectionId, setCollectionId] = useState<string>('62f53c198daeeb6965854401');

    useEffect(() => {
        if (!onboarding.current) {
            onboarding.current = new MetaMaskOnboarding();
        }
        let existentWallet: any = localStorage.getItem('wallet') || '{}';
        existentWallet = JSON.parse(existentWallet);

        let existentScannedWallet: any = localStorage.getItem('walletconnect') || '{}';
        existentScannedWallet = JSON.parse(existentScannedWallet);

        setAccounts(existentScannedWallet ? existentScannedWallet.accounts : existentWallet.accounts || [])
        setWallet(existentWallet);
        setWalletConnect(existentScannedWallet);
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

    // MetaMask

    const payWithMetamask = async () => {
        setTransactionHash('Pending transaction...');
        try {
            const hash = await makeTransactionWithMetamask(
                accounts[0],
                accounts[0],
                amount
            );
            console.log('transactionHash', hash);
            setTransactionHash(hash)
        } catch (e: any) {
            console.log('Transaction error', e);
            alert(`Transaction Error: ${e.message}`)
            setTransactionHash(e.message);
        }

    }

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

    // WalletConnect

    const scanQR = async () => {

        // Create connector
        const walletConnector = new NodeWalletConnect(
            {
                bridge: "https://bridge.walletconnect.org", // Required
            }
        );

        // Check if connection is already established
        if (!walletConnector.connected) {
            // create new session
            walletConnector.createSession().then(() => {
                // get uri for QR Code modal
                const uri = walletConnector.uri;
                // display QR Code modal
                WalletConnectQRCodeModal.open(
                    uri,
                    () => {
                        console.log("QR Code Modal closed");
                    }
                );
            });
        }

        // Subscribe to connection events
        walletConnector.on("connect", (error, payload) => {
            if (error) {
                console.log('connect', error);
            }

            // Close QR Code Modal
            WalletConnectQRCodeModal.close();

            // Get provided accounts and chainId
            const { accounts, chainId } = payload.params[0];

            console.log('connect', payload);

            setScannedWallet(payload);

            let existentScannedWallet: any = localStorage.getItem('walletconnect') || '{}';
            existentScannedWallet = JSON.parse(existentScannedWallet);

            setWalletConnect(existentScannedWallet);
            setAccounts(existentScannedWallet.accounts)
        });

        walletConnector.on("session_update", (error, payload) => {
            if (error) {
                console.log('session_update', error);
            }

            // Get updated accounts and chainId
            const { accounts, chainId } = payload.params[0];

            console.log('session_update', payload);
        });

        walletConnector.on("disconnect", (error, payload) => {
            if (error) {
                console.log('disconnect', error);
            }



            console.log('disconnect', payload);

            // Delete walletConnector
        });
    }

    const payWithWalletConnect = async () => {
        try {
            setTransactionHash('Pending transaction...');
            const hash = await makeTransactionWithWalletConnect(
                walletConnect.accounts[0],
                walletConnect.accounts[0],
                amount
            );
            console.log('transactionHash', hash);
            setTransactionHash(hash)
        } catch (e: any) {
            console.log('Transaction error', e);
            alert(`Transaction Error: ${e.message}`)
            setTransactionHash(e.message);
        }
    }


    // Ethers.js

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

    const pay = async () => {
        setTransactionHash('Pending transaction...');
        try {
            if(accounts && accounts[0] && amount && wallet?.signingKey?.privateKey) {
                const hash = await makeTransactionWithEthers(accounts[0], accounts[0], amount, wallet.signingKey.privateKey);
                console.log('transactionHash', hash);
                setTransactionHash(hash)
            } else {
                setTransactionHash(`Tansaction failed`);
                alert(`Missing required attrs: ${accounts[0]}, ${amount}, ${wallet?.signingKey?.privateKey}`)
            }
        } catch (e: any) {
            console.log('Transaction error', e);
            alert(`Transaction Error: ${e.message}`)
            setTransactionHash(e.message);
        }

    }

    // Minteando.me

    const createNFTCollection = async () => {
        const collectionData: CollectionDataType = {
            name: "NFT Collection Test 2",
            symbol: "NFTEST2",
            maxNFTs: 5,
            blockchain: 4, // Polygon Testnet Blockchain
            smartContractType: 0, // Smart contract types ?
            configurationNFTs : {
                whiteList: false,
                uniqueImage: "https://i.ibb.co/LddtCyv/Blog-Post-Free-Stock-Images-River-Mountain-Forest-1080x675.jpg"
            },
            attributes: [
                {
                    key: "price",
                    value: "89.99"
                },
                {
                    key: "accessType",
                    value: "normal"
                },
                {
                    key: "image",
                    value: "https://i.ibb.co/LddtCyv/Blog-Post-Free-Stock-Images-River-Mountain-Forest-1080x675.jpg"
                },
                {
                    key: "commission",
                    value: "3"
                }
            ]
        }

        const response: any = await createNFTCollectionWithMint4All(collectionData);
        setNftCollectionData(response?.data?.result)
        setCollectionId(response?.data?.result?.smartContractId)
    }

    const getNFTCollection = async () => {
        const response: any = await getNFTCollectionWithMint4All(collectionId);
        setRetrievedNftCollectionData(response?.data?.result);
    }

    const mintNFT = async () => {
        setMintedNftData('Minting NFT..')
        const nftData: MintNftDataType = {
            byUser: false,
            userWallet: accounts[0],
            smartContractId: collectionId,
            metadata: [{
                name: 'Green Mountains',
                description: 'Testing nft creation',
                image: 'https://i.ibb.co/LddtCyv/Blog-Post-Free-Stock-Images-River-Mountain-Forest-1080x675.jpg',
                attributes: [
                    {
                        key: "price",
                        value: "89.99"
                    },
                    {
                        key: "accessType",
                        value: "normal"
                    },
                    {
                        key: "image",
                        value: "https://i.ibb.co/LddtCyv/Blog-Post-Free-Stock-Images-River-Mountain-Forest-1080x675.jpg"
                    },
                    {
                        key: "commission",
                        value: "3"
                    }
                ]
            }]
        }

        const response = await mintNFTFromCollection(nftData);

        setMintedNftData(response?.data?.result);
    }

    const style = {
        backgroundColor: '#1a1a1a',
        margin: '20px',
        padding: '20px'
    }

    return (
        <div>
            <h1>Blockchain tests</h1>

            {/* Wallet Creation */}
            <div style={style}>
                <h2>Wallet creation</h2>

                <h3> 👉 With Ethers.js</h3>
                <button onClick={createWallet}>CREATE WALLET</button>
                <pre>Wallet: <span>{JSON.stringify(wallet, null, 4)}</span></pre>
            </div>

            <hr/>

            {/* Wallet Connection */}
            <div style={style}>
                <h2>Wallet connection</h2>

                <h3> 👉 Wallet conection to MetaMask via Chrome Extension</h3>
                <button onClick={connectMetamask}>CONNECT TO METAMASK</button>
                <pre>Status: {status}</pre>

                <br/>
                <br/>

                <h3> 👉 Wallet Conection via QR Code</h3>
                <h5>
                    (Multiple wallets, see{' '}
                    <a
                        style={{color: 'cyan'}}
                        target={'blank'}
                        href="https://explorer.walletconnect.com/registry?type=wallet"
                    >
                        DOCS
                    </a>
                    )
                </h5>
                <button onClick={scanQR}>CONNECT WALLET</button>
                <pre>Scanned wallet: {JSON.stringify(scannedWallet, null, 4)}</pre>
                <pre>LocalStorage wallet: {JSON.stringify(walletConnect, null, 4)}</pre>
            </div>

            <hr/>

            {/* Polygon Network */}
            <div style={style}>
                <h2>Add Polygon Network in Metamask</h2>

                <h3> 👉 Add network in chrome extension</h3>
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
                <pre></pre>

                <br/>
                <br/>

                <h3> 👉 Add network in the mobile app</h3>
                <pre>TODO - I think the network has to be manually configured in the mobile app </pre>
            </div>

            <hr/>

            {/* Transactions */}
            <div style={style}>
                <br/>

                <h2>Make Transaction</h2>
                <div>
                    <label htmlFor="testNet">Amount: </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => {setAmount(e.target.value)}}
                    />
                    <pre>{JSON.stringify({
                        from: accounts ? accounts[0] : '',
                        to: accounts ? accounts[0] : '',
                        amount
                    }, null, 4)}</pre>
                </div>
                <br/>
                <h3> 👉 With Ethers using the Private Key without confirmation</h3>
                <button onClick={() => pay()}>MAKE TRANSACTION WITHOUT CONFIRMATION</button>

                <br/>
                <br/>
                <br/>

                <h3> 👉 With Chrome Extension</h3>
                <button onClick={() => payWithMetamask()}>MAKE TRANSACTION WITH CHROME EXTENSION</button>

                <br/>
                <br/>
                <br/>

                <h3> 👉 With Wallet Connect (QR)</h3>
                <button onClick={() => payWithWalletConnect()}>MAKE TRANSACTION WITH MOBILE APP</button>
                <pre>Transaction Hash: {JSON.stringify(transactionHash, null, 4)}</pre>
            </div>

            <hr/>

            {/* Minteando.me */}
            <div style={style}>
                <h2> Minteando.me </h2>

                <h3> 👉 Create NFT Collection</h3>
                <button onClick={createNFTCollection}>CREATE NFT COLLECTION</button>
                <pre>Collection Data: {JSON.stringify(nftCollectionData, null, 4)}</pre>

                <br/>

                <h3> 👉 Get NFT Collection Data</h3>
                <div>
                    <label htmlFor="collectionId">Collection ID: </label>
                    <input
                        type="text"
                        value={collectionId}
                        onChange={(e) => {setCollectionId(e.target.value)}}
                    />
                </div>
                <br/>
                <button onClick={getNFTCollection}>GET NFT COLLECTION</button>
                <pre>Collection Data: {JSON.stringify(retrievedNftCollectionData, null, 4)}</pre>

                <br/>

                <h3> 👉 Mint NFT From Collection</h3>
                <div>
                    <label htmlFor="collectionId">Collection ID: </label>
                    <input
                        type="text"
                        value={collectionId}
                        onChange={(e) => {setCollectionId(e.target.value)}}
                    />
                    <pre>Destination wallet: {accounts ? accounts[0] : ''}</pre>
                </div>
                <br/>
                <button onClick={mintNFT}>MINT NFT FROM COLLECTION</button>
                <pre>Minted NFT Data: {JSON.stringify(mintedNftData, null, 4)}</pre>
            </div>

            <hr/>

            <div style={style}>

            </div>
        </div>
    )
}

export default Home
