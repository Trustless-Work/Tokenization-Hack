"use client";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import {
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { useQuery } from "@tanstack/react-query";
import { useGetEscrowFromIndexerByContractIds } from "@trustless-work/escrow";
import { GetEscrowsFromIndexerResponse as Escrow } from "@trustless-work/escrow/types";
import { RainbowButton } from "./rainbow-button";
import { ClaimROIService } from "@/features/claim-roi/services/claim.service";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { toast } from "sonner";
import { InvestDialog } from "@/features/tokens/components/InvestDialog";
import { SelectedEscrowProvider } from "@/features/tokens/context/SelectedEscrowContext";
import { signTransaction } from "../tw-blocks/wallet-kit/wallet-kit";
import { SendTransactionService } from "@/lib/sendTransactionService";
import { toastSuccessWithTx } from "@/lib/toastWithTx";

interface CarouselProps {
  items: ReactNode[];
  initialScroll?: number;
  escrowIds?: string[];
  hideInvest?: boolean;
  showClaimAction?: boolean;
}

type Card = {
  escrowId: string;
  tokenSale?: string;
  tokenFactory?: string;
  vaultContractId?: string;
  src: string;
  content: React.ReactNode;
};

// Single escrow item type from library types
type EscrowItem = Escrow;

const NOOP = () => undefined;

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
  escrowsById: Record<string, EscrowItem> | null;
  preferBulk: boolean;
  isLoadingEscrows: boolean;
  hideInvest: boolean;
  showClaimAction: boolean;
}>({
  onCardClose: NOOP,
  currentIndex: 0,
  escrowsById: null,
  preferBulk: false,
  isLoadingEscrows: false,
  hideInvest: false,
  showClaimAction: false,
});

export const Carousel = ({
  items,
  initialScroll = 0,
  escrowIds,
  hideInvest = false,
  showClaimAction = false,
}: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();

  // Fetch all escrows at once if a list of ids is provided
  const { data: escrowsList, isLoading: isEscrowsLoading } = useQuery<
    EscrowItem[]
  >({
    queryKey: ["escrows-by-ids", escrowIds],
    queryFn: async () => {
      const list = (await getEscrowByContractIds({
        contractIds: escrowIds ?? [],
        validateOnChain: true,
      })) as unknown as EscrowItem[];
      return Array.isArray(list) ? list : [];
    },
    enabled: Array.isArray(escrowIds) && escrowIds.length > 0,
  });

  const escrowsById = React.useMemo(() => {
    if (!Array.isArray(escrowIds) || !Array.isArray(escrowsList)) return null;
    const map: Record<string, EscrowItem> = {};
    escrowsList.forEach((item, idx) => {
      const key =
        (item as unknown as { contractId?: string })?.contractId ??
        escrowIds[idx];
      if (key) {
        map[key] = item;
      }
    });
    return map;
  }, [escrowIds, escrowsList]);

  const checkScrollability = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll, checkScrollability]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384; // (md:w-96)
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const isMobile = () => {
    return typeof window !== "undefined" && window.innerWidth < 768;
  };

  return (
    <CarouselContext.Provider
      value={{
        onCardClose: handleCardClose,
        currentIndex,
        escrowsById,
        preferBulk: Array.isArray(escrowIds) && escrowIds.length > 0,
        isLoadingEscrows: isEscrowsLoading,
        hideInvest,
        showClaimAction,
      }}
    >
      <div className="relative w-full mb-10">
        <div className="mr-10 flex justify-end gap-2 mb-4">
          <button
            type="button"
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <IconArrowNarrowLeft className="h-6 w-6 text-gray-500" />
          </button>
          <button
            type="button"
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <IconArrowNarrowRight className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth [scrollbar-width:none]"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div
            className={cn(
              "absolute right-0 z-1000 h-auto w-[5%] overflow-hidden bg-linear-to-l"
            )}
          ></div>

          <div
            className={cn(
              "flex flex-row justify-start gap-4",
              "max-w-7xl" // remove max-w-4xl if you want the carousel to span the full width of its container
            )}
          >
            {(() => {
              const isBulkLoading =
                Array.isArray(escrowIds) && isEscrowsLoading;
              const itemsToRender: ReactNode[] = isBulkLoading
                ? Array.from({ length: Math.max(items.length, 3) }, () => (
                    <div className="relative z-10 flex h-80 w-56 md:h-160 md:w-96 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 dark:bg-neutral-900">
                      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-linear-to-b from-black/40 via-transparent to-transparent" />
                      <div className="relative z-40 p-8 w-full">
                        <div className="h-6 w-2/3 rounded-md bg-white/70 animate-pulse mb-3" />
                        <div className="h-4 w-full rounded-md bg-white/50 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 z-10 bg-neutral-800/20 animate-pulse" />
                    </div>
                  ))
                : items;
              return itemsToRender;
            })().map((item, index) => (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.2 * index,
                    ease: "easeOut",
                  },
                }}
                key={"card" + index}
                className="rounded-3xl last:pr-[5%] md:last:pr-[33%]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: Card;
  index: number;
  layout?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    onCardClose,
    escrowsById,
    preferBulk,
    isLoadingEscrows,
    hideInvest,
    showClaimAction,
  } = useContext(CarouselContext);
  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();
  const { walletAddress } = useWalletContext();

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    onCardClose(index);
  }, [index, onCardClose]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  const escrowFromContext = escrowsById?.[card.escrowId];

  const { data: fetchedEscrow } = useQuery<EscrowItem | undefined>({
    queryKey: ["escrow", card.escrowId],
    queryFn: async () => {
      const list = (await getEscrowByContractIds({
        contractIds: [card.escrowId],
        validateOnChain: true,
      })) as unknown as EscrowItem[];
      return Array.isArray(list) ? (list[0] as EscrowItem) : undefined;
    },
    // Only allow per-card fetch if we are NOT using bulk mode
    enabled:
      !preferBulk &&
      !escrowFromContext &&
      Boolean(card.escrowId) &&
      !isLoadingEscrows,
  });

  const escrow = escrowFromContext ?? fetchedEscrow;

  useOutsideClick(containerRef as React.RefObject<HTMLDivElement>, handleClose);

  const handleClaim = async () => {
    try {
      if (!card.vaultContractId) {
        toast.error("Vault contract ID not available for this card");
        return;
      }

      if (!walletAddress) {
        toast.error("Connect your wallet to claim");
        return;
      }

      setIsClaiming(true);

      const svc = new ClaimROIService();
      const claimResponse = await svc.claimROI({
        vaultContractId: card.vaultContractId,
        beneficiaryAddress: walletAddress,
      });

      if (!claimResponse?.success || !claimResponse?.xdr) {
        throw new Error(
          claimResponse?.message ?? "Failed to build claim transaction."
        );
      }

      const signedTxXdr = await signTransaction({
        unsignedTransaction: claimResponse.xdr ?? "",
        address: walletAddress ?? "",
      });

      const sender = new SendTransactionService();
      const submitResponse = await sender.sendTransaction({
        signedXdr: signedTxXdr,
      });

      if (submitResponse.status !== "SUCCESS") {
        throw new Error(
          submitResponse.message ?? "Transaction submission failed."
        );
      }

      toastSuccessWithTx("ROI claimed successfully", submitResponse.hash);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected error";
      toast.error(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={containerRef}
              layoutId={layout ? `card-${escrow?.title}` : undefined}
              className="relative z-60 mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10 dark:bg-neutral-900"
            >
              <div className="flex w-full justify-between">
                <div className="flex items-center gap-2">
                  {!hideInvest &&
                    (card.tokenSale ? (
                      <SelectedEscrowProvider
                        value={{
                          escrow,
                          escrowId: card.escrowId,
                          tokenSaleContractId: card.tokenSale,
                          imageSrc: card.src,
                        }}
                      >
                        <InvestDialog tokenSaleContractId={card.tokenSale} />
                      </SelectedEscrowProvider>
                    ) : (
                      <RainbowButton variant="outline">Invest</RainbowButton>
                    ))}

                  {showClaimAction ? (
                    <button
                      type="button"
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black cursor-pointer"
                    >
                      {isClaiming ? "Claiming..." : "Claim ROI"}
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="sticky top-4 right-0 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-white"
                  onClick={handleClose}
                >
                  <IconX className="h-6 w-6 text-neutral-100 dark:text-neutral-900" />
                </button>
              </div>
              <motion.p
                layoutId={layout ? `title-${escrow?.title}` : undefined}
                className="mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white"
              >
                {escrow?.title}
              </motion.p>
              <motion.p
                layoutId={layout ? `description-${escrow?.title}` : undefined}
                className="mt-2 text-sm md:text-base font-medium text-black dark:text-white break-all whitespace-pre-line"
              >
                {escrow?.description}
              </motion.p>
              <div className="py-10">
                {React.isValidElement(card.content)
                  ? React.cloneElement(
                      card.content as React.ReactElement<any>,
                      {
                        details: escrow,
                        tokenFactory: card.tokenFactory,
                      }
                    )
                  : card.content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${escrow?.title}` : undefined}
        onClick={handleOpen}
        className="group relative z-10 flex h-80 w-56 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 md:h-160 md:w-96 dark:bg-neutral-900 cursor-pointer"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-linear-to-b from-black/50 via-transparent to-transparent" />
        <div className="relative z-40 p-8">
          <motion.p
            layoutId={layout ? `title-${escrow?.title}` : undefined}
            className="mt-2 max-w-xs text-left font-sans text-xl font-semibold text-balance text-white md:text-3xl"
          >
            {escrow?.title}
          </motion.p>
          <motion.p
            layoutId={layout ? `category-${escrow?.description}` : undefined}
            className="text-left font-sans text-xs font-medium text-white md:text-base break-all whitespace-normal"
          >
            {escrow?.description.slice(0, 100)}
          </motion.p>
        </div>
        <BlurImage
          src={card.src}
          alt={escrow?.title}
          className="absolute inset-0 z-10 object-cover"
        />
      </motion.button>
    </>
  );
};

type BlurImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt?: string;
};

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}: BlurImageProps) => {
  return (
    <img
      className={cn(
        "h-full w-full transition duration-300 object-cover",
        className
      )}
      src={src as string}
      loading="lazy"
      decoding="async"
      alt={alt ? alt : "Background of a beautiful view"}
      {...rest}
    />
  );
};
