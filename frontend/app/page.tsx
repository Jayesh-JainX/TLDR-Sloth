"use client";

import { useState } from "react";
import {
  Leaf,
  Loader2,
  Send,
  MessageSquare,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function Home() {
  const [chatLog, setChatLog] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{
    tldr: string;
    action_items: string[];
    drama: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary(null);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/api/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatLog }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(
        "An error occurred while communicating with the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7f4] text-gray-800 font-sans selection:bg-green-200">
      {/* Header */}
      <header className="bg-white border-b border-[#e2ece2] sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#4b6b4b] p-2 rounded-xl" aria-hidden="true">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2d402d]">
              TL;DR Sloth
            </h1>
          </div>
          <div
            className="flex items-center gap-2 bg-[#edf3ed] text-[#3a533a] px-4 py-1.5 rounded-full text-sm font-medium border border-[#c3d6c3]"
            role="status"
          >
            <span>Open-Weight Privacy Mode</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
        {/* Left Column - Input Form */}
        <section
          className="bg-white rounded-3xl shadow-sm border border-[#e2ece2] p-8"
          aria-labelledby="input-heading"
        >
          <div className="mb-6">
            <h2
              id="input-heading"
              className="text-2xl font-semibold mb-2 text-[#2d402d]"
            >
              Paste Group Chat
            </h2>
            <p className="text-sm text-gray-500">
              Paste your chaotic 200+ message log here. Processing runs entirely
              in memory and is instantly destroyed to protect your friends'
              privacy.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <textarea
                id="chatLog"
                rows={16}
                required
                className="w-full px-4 py-3 bg-[#fafbfa] border border-[#d1ded1] rounded-2xl focus:ring-4 focus:ring-[#d1ded1] focus:border-[#4b6b4b] outline-none transition-all resize-none font-mono text-sm text-gray-700"
                placeholder="[10:42 AM] Sarah: Are we still on for Friday?&#10;[10:45 AM] Mike: I can't, my dog is sick.&#10;[10:46 AM] Alex: Omg what happened??"
                value={chatLog}
                onChange={(e) => setChatLog(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !chatLog.trim()}
              className="w-full bg-[#4b6b4b] hover:bg-[#3a533a] text-white font-medium py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    aria-hidden="true"
                  />
                  Reading chaos... (approx. 4s)
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" aria-hidden="true" />
                  Summarize for me
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Column - Results Display */}
        <section
          className="flex flex-col h-full"
          aria-live="polite"
          aria-atomic="true"
        >
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-4"
              role="alert"
            >
              {error}
            </div>
          )}

          {!summary && !loading && !error && (
            <div className="flex-1 bg-white rounded-3xl border border-[#e2ece2] border-dashed flex flex-col items-center justify-center text-center p-12 text-gray-400">
              <Leaf
                className="w-20 h-20 text-[#e2ece2] mb-6"
                aria-hidden="true"
              />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Be lazy. Let the sloth read it.
              </h3>
              <p className="max-w-sm text-sm">
                Paste the chat on the left. You'll get a 3-bullet summary so you
                don't have to scroll for 10 minutes.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-[#e2ece2] flex flex-col items-center justify-center text-center p-8">
              <Loader2
                className="w-12 h-12 text-[#4b6b4b] animate-spin mb-4"
                aria-hidden="true"
              />
              <p className="text-[#4b6b4b] font-medium animate-pulse">
                Running stateless inference...
              </p>
            </div>
          )}

          {summary && !loading && (
            <div className="bg-white rounded-3xl shadow-sm border border-[#e2ece2] overflow-hidden flex flex-col h-full">
              <div className="bg-[#fafbfa] border-b border-[#e2ece2] px-8 py-5 flex justify-between items-center">
                <h2 className="font-semibold text-xl text-[#2d402d]">
                  Morning Briefing
                </h2>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-8">
                {/* TL;DR Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-[#4b6b4b]" />
                    <h3 className="font-semibold text-gray-700">The TL;DR</h3>
                  </div>
                  <div className="bg-[#edf3ed] border border-[#d1ded1] text-[#2d402d] p-4 rounded-2xl text-md leading-relaxed">
                    {summary.tldr}
                  </div>
                </div>

                {/* Action Items Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-700">
                      Plans & Mentions
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {summary.action_items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-blue-900 text-sm"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Drama Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-gray-700">The Drama</h3>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 text-amber-900 p-4 rounded-2xl text-sm italic">
                    "{summary.drama}"
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
