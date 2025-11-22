import { Suspense } from "react";
import { ManageEscrowsView } from "@/features/manage-escrows/ManageEscrowsView";

export default function ManageEscrows() {
  return (
    <Suspense fallback={null}>
      <ManageEscrowsView />
    </Suspense>
  );
}
