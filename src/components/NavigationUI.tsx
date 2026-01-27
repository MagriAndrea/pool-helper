'use client';

import { Navbar } from './Navbar';
import { MobileMenu } from './MobileMenu';

export function NavigationUI() {
  return (
    <>
      <div className="hidden md:block">
        <Navbar />
      </div>
      <MobileMenu />
    </>
  );
}
