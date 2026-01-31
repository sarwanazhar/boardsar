import React from "react"

interface DeleteBoardModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  boardName: string
  isLoading?: boolean
}

export function DeleteBoardModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  boardName, 
  isLoading = false 
}: DeleteBoardModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark rounded-xl border border-red-500/30 sketchy-border max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400">warning</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Delete Board</h2>
              <p className="text-white/60 text-sm">This action cannot be undone</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-white/80 mb-2">Are you sure you want to delete this board?</p>
            <div className="bg-charcoal/50 border border-white/10 rounded-lg p-3">
              <p className="text-white font-medium">{boardName}</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-charcoal/50 text-white border border-white/10 rounded-lg hover:bg-charcoal/70 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-red-500 text-background-dark rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Deleting...
                </span>
              ) : (
                "Delete Board"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}