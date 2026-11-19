import { Briefcase, ChevronRight } from "lucide-react";
import { showResumeAssistant } from "./ResumeAssistant";

export default function RemyButton() {
  return (
    <div className="px-2 mb-2 w-full">
      <button
        onClick={() => showResumeAssistant.setState(() => true)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-linear-to-r from-blue-500 to-purple-800 text-white hover:opacity-90 transition-opacity"
        aria-label="Open Resume Assistant"
      >
        <div className="flex items-center gap-2">
          <Briefcase size={24} />
          <span className="text-sm">Resume Assistant</span>
        </div>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
