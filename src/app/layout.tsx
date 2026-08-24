import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Laheeb Coffee', template: '%s | Laheeb Coffee' },
  description: 'Laheeb specialty coffee store.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
