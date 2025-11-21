import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { BentoGridThirdDemo } from "./BentoGrid";
import Link from "next/link";
import { RainbowButton } from "@/components/ui/rainbow-button";

export const HeroSection = () => {
  return (
    <div className="flex w-full gap-20 justify-between items-center">
      <div className="flex flex-col py-20 gap-4 w-full md:w-1/3">
        <div className="text-xl font-bold tracking-tight md:text-6xl">
          Project
          <PointerHighlight>
            <span>Oversight</span>
          </PointerHighlight>
        </div>

        <p className="text-lg text-muted-foreground">
          The Backoffice is where you manage the full lifecycle of a tokenized
          <br />
          project, from contract deployment to milestone execution.
        </p>

        <Link href="/manage-escrows">
          <RainbowButton variant="outline">Open App</RainbowButton>
        </Link>
      </div>

      <div className="flex-1 w-full md:w-2/3">
        <BentoGridThirdDemo />
      </div>
    </div>
  );
};
