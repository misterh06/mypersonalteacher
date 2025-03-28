import { Inter } from 'next/font/google'
import './globals.css'
import { UserProviderWrapper } from './UserProviderWrapper'

export const metadata = {
  title: 'My Personal Teacher',
  description: 'Site éducatif pour collégiens',
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <UserProviderWrapper>
          {children}
        </UserProviderWrapper>
      </body>
    </html>
  )
}
