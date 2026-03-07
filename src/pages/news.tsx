import Header from "@/components/header";
import { WorldTradePulse } from "@/components/world-trade-pulse";

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-[#0A1929] flex flex-col font-sans">
      <Header />
      <WorldTradePulse />
    </div>
  );
}
