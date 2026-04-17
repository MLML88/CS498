import { useNavigate } from "react-router-dom"

function SharePage() {
  const navigate = useNavigate()

  const downloadChart = () => {
    const image = sessionStorage.getItem("chartImage")
    if (!image) {
      return
    }

    const link = document.createElement("a")
    link.href = image
    link.download = "webtrack-data.jpeg"
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const downloadCSV = () => {
    const raw = sessionStorage.getItem("chartData")
    if (!raw) {
      return
    }

    const data = JSON.parse(raw)

    // CSV header
    const header = ["Domain", "Time (ms)"]

    // Convert rows
    const rows = data.map((entry: any) => [
      entry.name,
      entry.numValue
    ])

    // Combine into CSV string
    const csvContent = [header, ...rows].map(row => row.join(",")).join("\n")

    // Create blob
    const blob = new Blob([csvContent], { type: "text/csvcharset=utf-8" })

    // Create download link
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.href = url
    link.download = "webtrack-data.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="relative p-4 bg-gray-100 dark:bg-gray-900 shadow-md w-[700px] h-[550px] text-black dark:text-white">
        {/* Header */}
        <div className="pb-2 mb-4 border-b border-black dark:border-gray-700">
          <h1 className="text-xl font-semibold text-black dark:text-white">
            WebTrack
          </h1>
        </div>

        <div className="w-full flex flex-col items-center justify-center gap-4 h-[400px]">
          <h1 className="text-3xl font-bold underline text-black dark:text-white">
            Share this!
          </h1>

          <button
            onClick={downloadChart}
            className="w-36 bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded"
          >
            Download jpeg
          </button>

          <button
            onClick={downloadCSV}
            className="w-36 bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-4 border-b-4 border-purple-800 hover:border-purple-600 rounded"
          >
            Download CSV
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-36 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
          >
            Back to Main
          </button>
        </div>
      </div>
    </>
  )
}

export default SharePage