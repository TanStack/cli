import { ChefHat, ChevronRight } from "lucide-react";
import { showRemyAssistant } from "./RemyAssistant";

export default function RemyButton() {
  return (
    <button
      onClick={() => showRemyAssistant.setState(() => true)}
      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-linear-to-r from-orange-500 to-red-600 text-white hover:opacity-90 transition-opacity"
      aria-label="Open Remy Assistant"
    >
      <div className="flex items-center gap-2">
        <ChefHat size={24} />
        <span className="text-sm">Remy</span>
      </div>
      <ChevronRight className="w-4 h-4" />
    </button>
  );
}
