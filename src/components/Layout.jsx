import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      {/* Desktop - ml-64, Mobile - mt-14 */}
      <main className="flex-1 md:ml-64 mt-14 md:mt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
