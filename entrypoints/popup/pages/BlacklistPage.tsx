import { useNavigate } from "react-router-dom";

function BlacklistPage() {
  const navigate = useNavigate();

  return (
    <div className="fit-content p-4 bg-gray-100 rounded-lg shadow-md w-175 h-138 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold underline">Blacklist</h1>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-4 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded w-full"
      >
        Back to Main
      </button>
    </div>
  )
}

export default BlacklistPage