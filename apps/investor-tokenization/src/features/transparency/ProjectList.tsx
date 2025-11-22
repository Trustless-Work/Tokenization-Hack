import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { DummyContent } from "./Carousel";

const data = [
  {
    escrowId: "CBDLIY7HAJ73E6SPAOOKZFCJH3C4H6YBWATWQTON5Z7MY5JRVIIW7LQW",
    tokenSale: "CAL7JK6HOQOW5KU7VKASIZ2RF4GFVQTZJAI7EHCX7VXTAXQ2B27QIEZL",
    src: "/escrows/car.png",
    content: <DummyContent />,
  },
  {
    escrowId: "CC6Y3XYVB4PSPVX4XED2K4GXKPBPS4EAKTZC3BIGEPAE4V2FKMBGEQXY",
    tokenSale: "CBFTQZ3NATN6Y7PKYWGCF7OH6JOFTWUMYAJQDCBPSKGPWWQ7N23RTSNK",
    src: "/escrows/art.jpg",
    content: <DummyContent />,
  },
  {
    escrowId: "CDB6F6FLFM3VOGNU3FWETULM4QVPWNSJCZQNVQLWU6B4XYVOZVI3YD6X",
    tokenSale: "CA5DPVX6YWUYUASZOQK3WJYDWHYEMRHGCOQGQTDUSDJLB6EQNDRS3FOG",
    src: "/escrows/hotel.png",
    content: <DummyContent />,
  },
  {
    escrowId: "CDEDNEQEXSUYTAKHT7VS47F2VKSN4PWENXU5U7SXVPEGXLVD3U7LIZI3",
    tokenSale: "CB4XSZUQF2TF7OYOZY55CICXBNAL6RIZOJP7TITFA2PKCSZBHYSSRSNY",
    src: "/escrows/clock.jpg",
    content: <DummyContent />,
  },
  {
    escrowId: "CAO6ZONKBYQGE7E3OIPJTMSE2J2PKNROSXGGC3VQOO7JF2LXY47XG6QV",
    tokenSale: "CDWR6Q4D46V62EW3XUDXM4H2GSDIPUZY7U67OXYEFKPUMCOIDP6VZTP3",
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
