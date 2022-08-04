// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from "ethers";
import * as crypto from "crypto";

type Data = {
  wallet: ethers.Wallet
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { extraEntropy, locale, path } = req.body;
  console.log('ethers', ethers);

  let entropy = crypto.createHash('sha256').update(extraEntropy).digest('hex');
  entropy = `0x${entropy}`;

  console.log('entropy', entropy);

  let wallet: any = ethers.Wallet.createRandom({
    extraEntropy: entropy,
    locale,
    path
  });

  console.log('wallet', wallet);

  wallet = {
    ...wallet,
    signingKey: wallet._signingKey(),
    mnemonic: wallet._mnemonic()
  }

  console.log(ethers.utils.mnemonicToEntropy(wallet.mnemonic.phrase))

  res.status(200).json({ wallet })
}
