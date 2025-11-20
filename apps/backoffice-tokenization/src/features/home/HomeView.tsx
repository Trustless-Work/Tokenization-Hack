import { HeroSection } from "./HeroSection";

export const HomeView = () => {
  return (
    <div className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <HeroSection />
    </div>
  );
};
