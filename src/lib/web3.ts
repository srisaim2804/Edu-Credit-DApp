import { ethers } from 'ethers';

export interface WalletState {
  address: string | null;
  balance: number;
  isConnected: boolean;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectWallet = async (): Promise<WalletState> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const address = accounts[0];
    
    // Get mock balance from localStorage or set default
    const storedBalance = localStorage.getItem(`balance_${address}`);
    const balance = storedBalance ? parseInt(storedBalance) : 60;
    
    if (!storedBalance) {
      localStorage.setItem(`balance_${address}`, balance.toString());
    }

    return {
      address,
      balance,
      isConnected: true,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to connect wallet');
  }
};

export const getWalletBalance = (address: string): number => {
  const storedBalance = localStorage.getItem(`balance_${address}`);
  return storedBalance ? parseInt(storedBalance) : 60;
};

export const updateWalletBalance = (address: string, newBalance: number): void => {
  localStorage.setItem(`balance_${address}`, newBalance.toString());
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const checkWalletConnection = async (): Promise<WalletState | null> => {
  if (!window.ethereum) return null;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_accounts', []);
    
    if (accounts.length > 0) {
      const address = accounts[0];
      const balance = getWalletBalance(address);
      
      return {
        address,
        balance,
        isConnected: true,
      };
    }
  } catch (error) {
    console.error('Error checking wallet connection:', error);
  }

  return null;
};
