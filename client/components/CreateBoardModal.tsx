import React, { useState } from "react"

interface CreateBoardModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
  isLoading?: boolean
  error?: string | null
}

export function CreateBoardModal({ isOpen, onClose, onCreate, isLoading = false, error = null }: CreateBoardModalProps) {
  const [boardName, setBoardName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boardName.trim()) return

    try {
      await onCreate(boardName.trim())
      setBoardName("")
      onClose()
    } catch (error) {
      console.error("Failed to create board:", error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark rounded-xl border border-primary/20 sketchy-border max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">add</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Create New Board</h2>
              <p className="text-white/60 text-sm">Give your board a name to get started</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="boardName" className="block text-sm font-medium text-white/80 mb-2">
                Board Name
              </label>
              <input
                id="boardName"
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="e.g., Project Planning, Brainstorm Ideas..."
                className="w-full px-4 py-3 bg-charcoal/50 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent font-display"
                autoFocus
                maxLength={50}
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-charcoal/50 text-white border border-white/10 rounded-lg hover:bg-charcoal/70 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!boardName.trim() || isLoading}
                className="flex-1 px-4 py-3 bg-primary text-background-dark rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span>
                    Creating...
                  </span>
                ) : (
                  "Create Board"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}