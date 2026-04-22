import Hero from "@/components/home/Hero";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import GuideScrolling from "@/components/home/GuideScrolling";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background">
      <Hero />
      <FeaturesGrid />
      <GuideScrolling />
    </div>
  );
}
