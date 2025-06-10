import Header from "./Header"
import Footer from "./Footer"
import { Roboto } from 'next/font/google'
 
const font = Roboto({
  subsets: ['latin'],
})

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <>
      <div className={`h-dvh ${font.className}`}>
        <div className="flex h-full flex-col">
          <Header />
          <main>{children}</main>

          <div className="flex">
            <Footer />
          </div>
        </div>
      </div>
    </>
  )
}
