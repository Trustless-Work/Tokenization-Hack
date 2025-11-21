import { Header } from "@/components/shared/Header";
import { EscrowsByRoleCards } from "@/components/tw-blocks/escrows/escrows-by-role/cards/EscrowsCards";

export const ProjectUpdatesView = () => {
  return (
    <>
      <Header />
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="container">
          <EscrowsByRoleCards />
        </div>
      </main>
    </>
  );
};
