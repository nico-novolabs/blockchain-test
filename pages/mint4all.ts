import axios from "axios";

const MINT4ALL_URL = 'http://api.mint4all.xyz/api/mint4All/v1';
const API_KEY = '60129374-59cd-40d9-aa8e-e90e81fff8e3';

export type AttributesType = {
    key: string,
    value: string
}

export type CollectionDataType = {
    name: string,
    symbol: string,
    maxNFTs: number,
    blockchain: 4,
    smartContractType: 0,
    configurationNFTs?: {
        uniqueImage?: string,
        folderImages?: string,
        whiteList?: boolean,
        dateInitMint?: Date,
        dateEndMint?: Date,
        dateInitWhiteList?: Date,
        dateEndWhiteList?: Date
    },
    attributes?: Array<AttributesType>
}

export const createNFTCollectionWithMint4All = async (collectionData: CollectionDataType) => {
    try {
        const response = await axios.post(
            `${MINT4ALL_URL}/smart-contract`,
            collectionData,
            {
                headers: {
                    'API_KEY': API_KEY
                }
            }
        )

        console.log('response', response);

        return response;
    } catch (e: any) {
        console.log('Error', e);
        alert(e.message);
    }

}

export const getNFTCollectionWithMint4All = async (smartContractId: string) => {
    try {
        const response = await axios.get(
            `${MINT4ALL_URL}/company/details/${smartContractId}`,
            {
                headers: {
                    'API_KEY': API_KEY
                }
            }
        )

        console.log('response', response);

        return response;
    } catch (e: any) {
        console.log('Error', e);
        alert(e.message);
    }
}

export type MetadataNftType =  {
    name: string, // NFT Name
    description: string, // NFT Description
    image?: string, // NFT Image (In case it's not configured in the nft collection)
    attributes?: Array<AttributesType> // Custom details for NFT
}

export type MintNftDataType = {
    smartContractId: string, // NFT Collection id
    byUser: boolean, // True if the user pays the gas for the transaction
    userWallet: string, // Destination wallet for the NFT
    metadata: Array<MetadataNftType> // NFT Metadata
}

export const mintNFTFromCollection = async (mintNftData: MintNftDataType) => {
    try {
        const response = await axios.post(
            `${MINT4ALL_URL}/nft/generate-nft/${mintNftData.smartContractId}`,
            [{
                userWallet: mintNftData.userWallet,
                byUser: mintNftData.byUser,
                metadata: mintNftData.metadata
            }],
            {
                headers: {
                    'API_KEY': API_KEY
                }
            }
        )

        console.log('response', response);

        return response;
    } catch (e: any) {
        console.log('Error', e);
        alert(e.message);
    }
}