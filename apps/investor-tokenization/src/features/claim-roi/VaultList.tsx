import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { DummyContent } from "@/features/transparency/Carousel";

const data = [
  {
    escrowId: "CBDLIY7HAJ73E6SPAOOKZFCJH3C4H6YBWATWQTON5Z7MY5JRVIIW7LQW",
    tokenSale: "CAL7JK6HOQOW5KU7VKASIZ2RF4GFVQTZJAI7EHCX7VXTAXQ2B27QIEZL",
    vaultContractId: "CDARBSD3OVSVUJWZV4W5HA66QDHY6A3YEH5EQGZPYFGS4DPDYW2UXWX3",
    src: "/escrows/car.png",
    content: <DummyContent />,
  },
  {
    escrowId: "CC6Y3XYVB4PSPVX4XED2K4GXKPBPS4EAKTZC3BIGEPAE4V2FKMBGEQXY",
    tokenSale: "CBFTQZ3NATN6Y7PKYWGCF7OH6JOFTWUMYAJQDCBPSKGPWWQ7N23RTSNK",
    vaultContractId: "CCAPAJY44JOBHJAWVZCGAWAMK4XCST4EIZENZWI6DQHPD4RGYBKM6H7D",
    src: "/escrows/art.jpg",
    content: <DummyContent />,
  },
];

export const VaultList = () => {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
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
