import { WalletButton } from "../tw-blocks/wallet-kit/WalletButtons";

export const Header = () => {
  return (
    <header className="flex justify-between items-center w-full py-4">
      <h2 className="text-2xl font-bold">Trustless Work</h2>
      <WalletButton />
    </header>
  );
};
