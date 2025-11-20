import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { BentoGridThirdDemo } from "./BentoGrid";
import Link from "next/link";
import { RainbowButton } from "@/components/ui/rainbow-button";

export const HeroSection = () => {
  return (
    <div className="flex gap-20 mx-20 justify-between items-center">
      <div className="flex flex-col py-20 gap-4">
        <div className="text-xl font-bold tracking-tight md:text-6xl">
          Project Oversight &
          <PointerHighlight>
            <span>Release Management</span>
          </PointerHighlight>
        </div>

        <p className="text-lg text-muted-foreground">
          The Backoffice is where you manage the full lifecycle of a tokenized
          <br />
          project, from contract deployment to milestone execution.
        </p>

        <Link href="/manage-escrows">
          <RainbowButton variant="outline">Get Unlimited Access</RainbowButton>
        </Link>
      </div>

      <div className="flex-1">
        <BentoGridThirdDemo />
      </div>
    </div>
  );
};
