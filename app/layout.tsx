import './styles/globals.css';
import React from 'react';

export const metadata = {
  title: 'Alpine Signal Rating',
  description: 'GTM infrastructure diagnostic wizard'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
