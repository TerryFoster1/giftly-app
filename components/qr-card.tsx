"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download } from "lucide-react";
import { Button } from "./ui";

export function QrCard({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, {
      margin: 2,
      width: 240,
      color: { dark: "#272425", light: "#FFF4F0" }
    }).then(setDataUrl);
  }, [url]);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
      <div className="grid place-items-center rounded-3xl bg-blush p-4">
        {dataUrl ? <img src={dataUrl} alt="Public wishlist QR code" className="h-52 w-52" /> : <div className="h-52 w-52" />}
      </div>
      <p className="mt-3 break-all rounded-2xl bg-cloud p-3 text-xs font-bold text-ink/70">{url}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" onClick={copyLink}>
          <Copy size={16} />
          {copied ? "Copied" : "Copy"}
        </Button>
        <a
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-spruce transition hover:bg-spruce hover:text-white"
          href={dataUrl}
          download="giftly-qr.png"
        >
          <Download size={16} />
          QR
        </a>
      </div>
    </section>
  );
}
