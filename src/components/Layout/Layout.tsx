import Header from "./Header"
import Footer from "./Footer"

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <>
      <div className="h-screen">
        <div className="flex h-full flex-col justify-between">
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
