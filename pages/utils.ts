import { ethers } from 'ethers';

export async function payWithMetamask(sender: string, receiver: string, amount: string, privateKey: string) {
    console.log(`payWithMetamask(receiver=${receiver}, sender=${sender}, amount=${amount})`)

    const provider = new ethers.providers.InfuraProvider( "maticmum");
    const wallet = new ethers.Wallet(privateKey);
    const walletSigner = wallet.connect(provider);
    const gasPrice = await provider.getGasPrice();
    console.log('gasPrice', bigNumberToNumber(gasPrice));
    const gasLimit = 100000;
    const tx = {
        from: sender,
        to: receiver,
        value: ethers.utils.parseEther(amount),
        nonce: provider.getTransactionCount(sender, "latest"),
        gasLimit: ethers.utils.hexlify(gasLimit),
        gasPrice,
    }

    const hasBalance = await hasEnoughBalance(provider, wallet, gasPrice, amount);

    if(hasBalance) {
        return new Promise((res, rej) => {
            walletSigner.sendTransaction(tx).then((transactionHash: any) => {
                console.log('transactionHash is ' + transactionHash);
                res(transactionHash);
            }).catch((e: any) => {
                rej(e);
            })
        })
    } else {
        alert('Wallet does not have enough balance to complete transaction');
        return {};
    }
}

export const bigNumberToNumber = (bigNumber: ethers.BigNumber): number => {
    return Number(ethers.utils.formatEther(bigNumber))
}

export const hasEnoughBalance = async (
    provider: ethers.providers.InfuraProvider,
    wallet: ethers.Wallet,
    gasPrice: ethers.BigNumber,
    amount: string
): Promise<boolean> => {
    let balance: any = await provider.getBalance(wallet.address);
    balance = bigNumberToNumber(balance);
    const numberGasPrice: number = bigNumberToNumber(gasPrice);
    const numberAmount: number = Number(amount);

    console.log('balance', balance);
    console.log('totalCharges', (numberGasPrice + numberAmount))

    return balance >= (numberGasPrice + numberAmount);
}


