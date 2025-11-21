import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { DummyContent } from "./Carousel";

const data = [
  {
    escrowId: "CCFGXOK4F7XVFEJB6V7FPNVDKBEI37QUJ6KXJMZALE4WUTXKM63C25EX",
    src: "/escrows/car.png",
    content: <DummyContent />,
  },
  {
    escrowId: "CAGXRXTY3NC5N74QLQP57UQKEIUSXYVOLQZ2DYLDADHJ4JA6A4TZEFFW",
    src: "/escrows/art.jpg",
    content: <DummyContent />,
  },
  {
    escrowId: "CAGXRXTY3NC5N74QLQP57UQKEIUSXYVOLQZ2DYLDADHJ4JA6A4TZEFFW",
    src: "/escrows/hotel.png",
    content: <DummyContent />,
  },
  {
    escrowId: "CAGXRXTY3NC5N74QLQP57UQKEIUSXYVOLQZ2DYLDADHJ4JA6A4TZEFFW",
    src: "/escrows/clock.jpg",
    content: <DummyContent />,
  },
  {
    escrowId: "CAGXRXTY3NC5N74QLQP57UQKEIUSXYVOLQZ2DYLDADHJ4JA6A4TZEFFW",
    src: "/escrows/building.png",
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
