import {ethers} from "ethers";

export const makeTransactionWithMetamask = async (sender: string, receiver: string, amount: string) => {
    const transactionParameters = {
        to: receiver, // Required except during contract publications.
        from: sender, // must match user's active address.
        value: ethers.utils.parseEther(amount)._hex, // Only required to send ether to the recipient from the initiating external account.
        data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057', // Optional, but used for defining smart contract creation and interaction.
    };

    // txHash is a hex string
    // As with any RPC call, it may throw an error
    const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
    });

    return txHash
}