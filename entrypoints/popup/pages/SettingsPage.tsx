import { useNavigate } from "react-router-dom";

function SettingsPage({
  darkMode,
  setDarkMode,
}: {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();

  return (
    <div className="fit-content p-4 bg-gray-100 rounded-lg shadow-md w-175 h-138 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold underline">Settings</h1>

      {/*Toggle Switch*/}
      <label className="flex items-center gap-3 cursor-pointer">
        <span className="text-lg">Dark Mode</span>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
          className="w-5 h-5"
        />
      </label>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">
        <button
          type="button"
          onClick={() => navigate("/tags")}
          className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
        >
          Manage Tags
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-4 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded w-full"
      >
        Back to Main
      </button>
    </div>
  );
}

export default SettingsPage