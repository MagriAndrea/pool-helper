import Hero from "@/components/home/Hero";
import FeaturesGrid from "@/components/home/FeaturesGrid";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      <Hero />
      <FeaturesGrid />
    </main>
  );
}
