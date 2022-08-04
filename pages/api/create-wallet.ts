// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from "ethers";

type Data = {
  wallet: ethers.Wallet
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { extraEntropy, locale, path } = req.body;
  console.log('ethers', ethers);

  let wallet: any = ethers.Wallet.createRandom({
    extraEntropy,
    locale,
    path
  });

  console.log('wallet', wallet);

  wallet = {
    ...wallet,
    signingKey: wallet._signingKey(),
    mnemonic: wallet._mnemonic()
  }

  res.status(200).json({ wallet })
}
