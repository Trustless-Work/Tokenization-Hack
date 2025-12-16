"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

/**
 * Type definition for the wallet context
 * Contains wallet address, name, and functions to manage wallet state
 */
type WalletContextType = {
  walletAddress: string | null;
  walletName: string | null;
  setWalletInfo: (address: string, name: string) => void;
  clearWalletInfo: () => void;
};

/**
 * Create the React context for wallet state management
 */
const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Wallet Provider component that wraps the application
 * Manages wallet state and provides wallet information to child components
 * Automatically loads saved wallet information from localStorage on initialization
 */
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // IMPORTANT (SSR/Hydration):
  // Don't read localStorage during the initial render. Server render always
  // has no access to it, and reading it on the first client render causes
  // hydration mismatches (server HTML != client HTML).
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setWalletAddress(localStorage.getItem("walletAddress"));
    setWalletName(localStorage.getItem("walletName"));
  }, []);

  /**
   * Set wallet information and save it to localStorage
   * This function is called when a wallet is successfully connected
   *
   * @param address - The wallet's public address
   * @param name - The name/identifier of the wallet (e.g., "Freighter", "Albedo")
   */
  const setWalletInfo = (address: string, name: string) => {
    setWalletAddress(address);
    setWalletName(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("walletAddress", address);
      localStorage.setItem("walletName", name);
    }
  };

  /**
   * Clear wallet information and remove it from localStorage
   * This function is called when disconnecting a wallet
   */
  const clearWalletInfo = () => {
    setWalletAddress(null);
    setWalletName(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletName");
    }
  };

  return (
    <WalletContext.Provider
      value={{ walletAddress, walletName, setWalletInfo, clearWalletInfo }}
    >
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Custom hook to access the wallet context
 * Provides wallet state and functions to components
 * Throws an error if used outside of WalletProvider
 */
export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within WalletProvider");
  }
  return context;
};
