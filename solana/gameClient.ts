import { AnchorProvider, Program } from '@coral-xyz/anchor';
import * as web3 from '@solana/web3.js';
// Import IDL manually (copy from target/idl/riddle_vault.json after anchor build)
import { IDL } from './riddle_vault'; // Adjust path if needed

// Replace with your deployed Program ID
// For now, using a placeholder that won't cause errors
const PROGRAM_ID = new web3.PublicKey('11111111111111111111111111111112'); // System program as placeholder

// Connection to devnet (switch to mainnet later)
const connection = new web3.Connection(process.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com');

// Get the vault PDA (Program Derived Address)
export function getVaultPDA(): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID)[0];
}

// Set the winner (called by admin/team wallet after game over)
export async function setWinner(wallet: any, winner: web3.PublicKey) {
  try {
    console.log('Setting winner:', winner.toBase58());
    console.log('IDL available:', !!IDL);
    console.log('Program ID:', PROGRAM_ID.toBase58());
    
    // Check if wallet is valid
    if (!wallet || !wallet.signTransaction) {
      console.error('Wallet not connected or invalid');
      return;
    }
    
    // For now, just log the action until program is deployed
    console.log('Winner set (placeholder):', winner.toBase58());
    return Promise.resolve();
    
    // Uncomment when program is deployed:
    // const provider = new AnchorProvider(connection, wallet, {});
    // const program = new Program(IDL, PROGRAM_ID, provider);
    // const vaultPDA = getVaultPDA();
    // await program.methods.setWinner(winner).accounts({
    //   vault: vaultPDA,
    //   authority: wallet.publicKey, // Your team wallet
    // }).rpc();
    // console.log('Winner set:', winner.toBase58());
  } catch (error) {
    console.error('Set Winner Error:', error);
    throw error;
  }
}

// Claim the prize (called by winner)
export async function claimPrize(wallet: any) {
  try {
    console.log('Attempting to claim prize for:', wallet.publicKey?.toBase58());
    console.log('IDL available:', !!IDL);
    console.log('Program ID:', PROGRAM_ID.toBase58());
    
    // Check if wallet is valid
    if (!wallet || !wallet.signTransaction) {
      console.error('Wallet not connected or invalid');
      return;
    }
    
    // For now, just log the action until program is deployed
    console.log('Prize claimed (placeholder):', wallet.publicKey?.toBase58());
    return Promise.resolve();
    
    // Uncomment when program is deployed:
    // const provider = new AnchorProvider(connection, wallet, {});
    // const program = new Program(IDL, PROGRAM_ID, provider);
    // const vaultPDA = getVaultPDA();
    // await program.methods.claimPrize().accounts({
    //   vault: vaultPDA,
    //   claimer: wallet.publicKey,
    // }).rpc();
    // console.log('Prize claimed by:', wallet.publicKey.toBase58());
  } catch (error) {
    console.error('Claim Prize Error:', error);
    throw error;
  }
}

// Check vault balance (for UI display)
export async function getVaultBalance(): Promise<number> {
  try {
    console.log('Fetching vault balance...');
    const vaultPDA = getVaultPDA();
    console.log('Vault PDA:', vaultPDA.toBase58());
    
    // For now, return a placeholder balance until program is deployed
    console.log('Returning placeholder balance: 0.1 SOL');
    return 0.1;
    
    // Uncomment when program is deployed:
    // const balance = await connection.getBalance(vaultPDA);
    // return balance / 1_000_000_000; // Convert lamports to SOL
  } catch (error) {
    console.error('Error fetching vault balance:', error);
    return 0; // Return 0 if there's an error
  }
}
