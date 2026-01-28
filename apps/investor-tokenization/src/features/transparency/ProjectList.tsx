import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { DummyContent } from "./Carousel";

const data = [
  {
    escrowId: "CCZHTYVLK6R2QMIFBTEN65ZVCSFBD3L5TXYCZJT5WTXE63ABYXBBCSEB",
    tokenSale: "CC2AGB3AW5IITDIPEZGVX6XT5RTDIVINRZL7F6KZPIHEWN2GRXL5CRCT",
    tokenFactory: "CDJTII2GR2FY6Q4NDJGZI7NW2SHQ7GR5Y2H7B7Q253PTZZAZZ25TFYYU",
    src: "/escrows/car.png",
    content: <DummyContent />,
  },
];

export const ProjectList = () => {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));

  return (
    <div className="my-20">
      <Carousel items={cards} escrowIds={data.map((d) => d.escrowId)} />
    </div>
  );
};
