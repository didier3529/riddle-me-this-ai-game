import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import React from 'react';

interface WalletWrapperProps {
  children: React.ReactNode;
}

const WalletWrapper: React.FC<WalletWrapperProps> = ({ children }) => {
  const wallets = [new PhantomWalletAdapter()];
  const network = 'devnet';
  const endpoint = clusterApiUrl(network);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletWrapper;
