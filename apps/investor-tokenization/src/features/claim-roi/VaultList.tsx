import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { DummyContent } from "@/features/transparency/Carousel";
import VaultCard from "./VaultCard";


const data = [
  {
    escrowId: "CCZHTYVLK6R2QMIFBTEN65ZVCSFBD3L5TXYCZJT5WTXE63ABYXBBCSEB",
    tokenSale: "CC2AGB3AW5IITDIPEZGVX6XT5RTDIVINRZL7F6KZPIHEWN2GRXL5CRCT",
    vaultContractId: "CC2AGB3AW5IITDIPEZGVX6XT5RTDIVINRZL7F6KZPIHEWN2GRXL5CRCT", 
    src: "/escrows/car.png",
    content: <DummyContent />,
  },
  {
    escrowId: "CD775STBXITO4GNNIS7GO3KV6SYMFNBQXW536SWXOPUOO36Z64N3XBFI",
    tokenSale: "CD64ILP3SXCCY67QIVPCOVUX5Z5Q42CMKU7LK4RNAPCWD5QGBS6G7LPA",
    vaultContractId: "CBFXUH4PIGABJSRIN3GOAPH2FYL4P443UQQM3RIUV2W2EHZDNX2I4ZMA", 
    src: "/escrows/car.png",
    content: <DummyContent />,
  },
];

export const VaultList = () => {
  const cards = data.map((vault, index) => (
    <VaultCard key={vault.vaultContractId} vault={vault} index={index} />
  ));

  return (
    <div className="my-20">
      <Carousel
        items={cards}
        escrowIds={data.map((d) => d.escrowId)}
        hideInvest
        showClaimAction
      />
    </div>
  );
};
