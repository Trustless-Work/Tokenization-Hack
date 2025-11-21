import { HeaderHome } from "@/components/shared/Header";
import { GlowingEffectDemo } from "./HeroSection";

export const HomeView = () => {
  return (
    <>
      <HeaderHome />
      <div className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start mx-30">
        <GlowingEffectDemo />
      </div>
    </>
  );
};
