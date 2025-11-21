"use client";

import { useEffect } from 'react';
import AOS from 'aos';

export function AOSInit() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100,
      delay: 0,
    });

    // Refresh AOS on route changes
    AOS.refresh();
  }, []);

  return null;
}
