import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { DummyContent } from "@/features/transparency/Carousel";

const data = [
  {
    escrowId: "CBDLIY7HAJ73E6SPAOOKZFCJH3C4H6YBWATWQTON5Z7MY5JRVIIW7LQW",
    tokenSale: "CAL7JK6HOQOW5KU7VKASIZ2RF4GFVQTZJAI7EHCX7VXTAXQ2B27QIEZL",
    vaultContractId: "CAS56N75A3KYYON72ELM65FVEOV36VGLTQAOFQJIRYN7HM4L2H6TFOWD",
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
    {
    escrowId: "CAO6ZONKBYQGE7E3OIPJTMSE2J2PKNROSXGGC3VQOO7JF2LXY47XG6QV",
    tokenSale: "CBW4W4GEGD5MNXCUHGOAJ64IXLFHDMDDD65ITVM3HVIYSK22PGSHIJ5N",
    tokenFactory: "CC5ESBB3DK2H6IRPHPJMAU5SOAVLWHY2TPJ2XTLJLXVHUZ6ZMW4QCYFA",
    src: "/escrows/building.png",
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
