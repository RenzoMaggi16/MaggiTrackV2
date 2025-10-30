import { Navbar } from "@/components/Navbar";
import { TradesTable } from "@/components/TradesTable";

const TradesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <TradesTable />
      </main>
    </div>
  );
};

export default TradesPage;


