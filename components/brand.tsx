import Link from "next/link";
import { Gift } from "lucide-react";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Giftly home">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral text-white shadow-soft">
        <Gift size={21} />
      </span>
      <span className="text-xl font-black tracking-normal text-ink">Giftly</span>
    </Link>
  );
}
