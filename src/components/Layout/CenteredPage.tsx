interface Props {
  children: React.ReactNode
}

export default function CenteredPage({ children }: Props) {
  return (
    <>
      <div className="bg flex flex-col items-center justify-center sm:p-4 md:p-7">
        <main>{children}</main>
      </div>
    </>
  )
}
