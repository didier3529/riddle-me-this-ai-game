import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import * as web3 from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
// Import IDL manually (copy from target/idl/riddle_vault.json after anchor build)
import { IDL } from './riddle_vault'; // Adjust path if needed

// Replace with your deployed Program ID
const PROGRAM_ID = new web3.PublicKey('YourProgramIDFromStep3');

// Connection to devnet (switch to mainnet later)
const connection = new web3.Connection(process.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com');

// Get the vault PDA (Program Derived Address)
export function getVaultPDA(): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID)[0];
}

// Set the winner (called by admin/team wallet after game over)
export async function setWinner(wallet: any, winner: web3.PublicKey) {
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program(IDL, PROGRAM_ID, provider);
  const vaultPDA = getVaultPDA();
  await program.methods.setWinner(winner).accounts({
    vault: vaultPDA,
    authority: wallet.publicKey, // Your team wallet
  }).rpc();
  console.log('Winner set:', winner.toBase58());
}

// Claim the prize (called by winner)
export async function claimPrize(wallet: any) {
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program(IDL, PROGRAM_ID, provider);
  const vaultPDA = getVaultPDA();
  await program.methods.claimPrize().accounts({
    vault: vaultPDA,
    claimer: wallet.publicKey,
  }).rpc();
  console.log('Prize claimed by:', wallet.publicKey.toBase58());
}

// Check vault balance (for UI display)
export async function getVaultBalance(): Promise<number> {
  const vaultPDA = getVaultPDA();
  const balance = await connection.getBalance(vaultPDA);
  return balance / 1_000_000_000; // Convert lamports to SOL
}
