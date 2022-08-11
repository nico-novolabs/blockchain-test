import { ethers } from 'ethers';
import NodeWalletConnect from "@walletconnect/client";
import {ITxData} from "@walletconnect/types";

export async function makeTransactionWithWalletConnect (sender: string, receiver: string, amount: string) {

    // Create connector
    const walletConnector = new NodeWalletConnect(
        {
            bridge: "https://bridge.walletconnect.org", // Required
        }
    );

    // Draft transaction
    const tx: ITxData = {
        from: sender, // Required
        to: receiver, // Required (for non contract deployments)
        data: "0x", // Required
        value: ethers.utils.parseEther(amount)._hex
    };

    // Send transaction
    return new Promise((res, rej) => {
        walletConnector
            .sendTransaction(tx)
            .then((result) => {
                // Returns transaction id (hash)
                console.log('result', result);
                res(result);
            })
            .catch((error) => {
                // Error returned when rejected
                console.error('error', error);
                rej(error);
            });
    })
}


