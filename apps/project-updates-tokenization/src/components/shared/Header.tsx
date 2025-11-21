import Link from "next/link";
import { WalletButton } from "../tw-blocks/wallet-kit/WalletButtons";
import Image from "next/image";
import { RainbowButton } from "../ui/rainbow-button";

export const HeaderHome = () => {
  return (
    <header className="flex justify-between items-center w-full py-4">
      <Link href="/">
        <Image src="/favicon.ico" alt="logo" width={50} height={50} />
      </Link>

      <Link href="/project-updates">
        <RainbowButton variant="outline">Open App</RainbowButton>
      </Link>
    </header>
  );
};

export const Header = () => {
  return (
    <header className="flex justify-between items-center w-full py-4">
      <Link href="/">
        <Image src="/favicon.ico" alt="logo" width={50} height={50} />
      </Link>

      <WalletButton />
    </header>
  );
};
