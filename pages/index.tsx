import React, { useEffect, useRef } from 'react';
import type { NextPage } from 'next'
import { ethers } from "ethers";
import {useState} from "react";
import axios from "axios";
// This function detects most providers injected at window.ethereum
import detectEthereumProvider from '@metamask/detect-provider';
import MetaMaskOnboarding from '@metamask/onboarding';

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
    const [disabled, setDisabled] = useState<boolean>(false);
    const onboarding: any = React.useRef<MetaMaskOnboarding>();

    useEffect(() => {
        if (!onboarding.current) {
            onboarding.current = new MetaMaskOnboarding();
        }
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
          } else {
              console.log('error', response);
          }
      } catch (e) {
          console.log('error', e);
      }
  }

    const connectMetamask = async () => {
        setStatus('Connecting to MetaMask..');
        setDisabled(true);
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

    return (
        <div>
            <h1>Metamask wallet creation test</h1>
            <pre>
                In order to test the <strong>wallet creation</strong> & <strong>connection to metamask</strong>,
                press the buttons <strong>in order</strong>
            </pre>
            <br/>
            <h3>1. Wallet creation</h3>
            <button onClick={createWallet}>CREATE WALLET</button>
            <pre>Wallet: <span>{JSON.stringify(wallet, null, 4)}</span></pre>

            <br/>
            <p>---------------------------</p>
            <br/>

            <h3>2. Wallet conection to MetaMask</h3>
            <button disabled={disabled} onClick={connectMetamask}>CONNECT TO METAMASK</button>
            <pre>Status: {status}</pre>

            <br/>
        </div>
    )
}

export default Home
