import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Architecture } from '@/components/landing/Architecture';
import { WhySentinelX } from '@/components/landing/WhySentinelX';
import { TechStack } from '@/components/landing/TechStack';
import { Screenshots } from '@/components/landing/Screenshots';
import { FAQ } from '@/components/landing/FAQ';
import { Contact } from '@/components/landing/Contact';

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Architecture />
        <WhySentinelX />
        <TechStack />
        <Screenshots />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
