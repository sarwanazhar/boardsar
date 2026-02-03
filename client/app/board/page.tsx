'use client'

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, useInitAuth } from "@/lib/store"
import { useBoardStore } from "@/lib/boardStore"
import { LogoutButton } from "@/components/LogoutButton"
import { CreateBoardModal } from "@/components/CreateBoardModal"
import { DeleteBoardModal } from "@/components/DeleteBoardModal"
import { authAPI } from "@/lib/api"
import Link from "next/link"

export default function BoardPage() {
  const { user, setUser } = useAuthStore()
  // const { initAuth } = useInitAuth() // Not used anymore
  const { boards, isLoading, error, fetchBoards, createBoard, deleteBoard, clearError } = useBoardStore()
  const router = useRouter()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deleteBoardId, setDeleteBoardId] = useState<string | null>(null)
  const [deleteBoardName, setDeleteBoardName] = useState<string>('')


  // Filter boards based on search query and view mode
  const [viewMode, setViewMode] = useState<'all' | 'recent' | 'starred' | 'shared'>('all')
  // A ref to make sure we only do the auth check once
  const authCheckedRef = useRef(false)
  // We use setUser from store


  useEffect(() => {
    if (authCheckedRef.current) return
    authCheckedRef.current = true

    const checkAuth = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        setUser(null)
        setCheckingAuth(false)
        return
      }

      try {
        console.log("Verifying token...")
        const userProfile = await authAPI.getProfile()
        console.log("Auth verified:", userProfile)
        setUser(userProfile)
      } catch (err) {
        console.error("Auth check failed:", err)
        localStorage.removeItem("token")
        setUser(null)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, []) // Empty dependency array - only run once

  useEffect(() => {
    if (!checkingAuth && user) {
      fetchBoards()
    }
  }, [checkingAuth, user, fetchBoards])

  // Clear error when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      clearError()
    }
  }, [isCreateModalOpen, clearError])

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      router.replace('/login')
    }
    return null
  }

  // Format date to relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString()
  }

  const filteredBoards = (boards || []).filter(board => {
    // Basic search filter
    const matchesSearch = board && board.name && board.name.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    // View mode filters
    switch (viewMode) {
      case 'recent':
        // Show boards updated in the last 7 days
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(board.updatedAt) > weekAgo
      case 'starred':
        // Show boards that are pinned (assuming isPinned field exists)
        // For now, we'll treat all boards as non-starred since the backend doesn't have this field
        return false
      case 'shared':
        // Show boards that have collaborators
        return (board.sharedWith && board.sharedWith.length > 0) || (user && board.ownerId !== user.id)
      default:
        return true
    }
  })

  // Handle board creation
  const handleCreateBoard = async (name: string) => {
    try {
      await createBoard(name)
      setIsCreateModalOpen(false)
      fetchBoards()
    } catch (err) {
      // Error is handled by the store
      console.error('Failed to create board:', err)
    }
  }

  // Handle board deletion
  const handleDeleteBoard = async () => {
    if (!deleteBoardId) return

    try {
      await deleteBoard(deleteBoardId)
      setDeleteBoardId(null)
      setDeleteBoardName('')
    } catch (err) {
      // Error is handled by the store
      console.error('Failed to delete board:', err)
    }
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-white min-h-screen">
      <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-primary/10">
        <Link href={"/"}>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center sketchy-border text-primary">
              <span className="material-symbols-outlined">edit_square</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-display">BoardSar</h1>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <LogoutButton className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-full border border-red-500/30" />
        </div>
      </header>

      <main className="p-4 pb-8">
        <div className="mb-6">
          <label className="flex flex-col w-full">
            <div className="flex w-full items-stretch rounded-xl h-12 sketchy-border border-primary/40 bg-charcoal/50">
              <div className="text-primary flex items-center justify-center pl-4">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="flex w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/30 pl-2 text-base font-display"
                placeholder="Find a sketch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </label>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setViewMode('all')}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 font-bold ${viewMode === 'all'
              ? 'bg-primary text-background-dark sketchy-border border-primary'
              : 'bg-charcoal text-white/70 border border-white/10'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <p className="text-sm">All</p>
          </button>
          <button
            onClick={() => setViewMode('recent')}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 font-bold ${viewMode === 'recent'
              ? 'bg-primary text-background-dark sketchy-border border-primary'
              : 'bg-charcoal text-white/70 border border-white/10'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">schedule</span>
            <p className="text-sm">Recent</p>
          </button>
          <button
            onClick={() => setViewMode('starred')}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 font-bold ${viewMode === 'starred'
              ? 'bg-primary text-background-dark sketchy-border border-primary'
              : 'bg-charcoal text-white/70 border border-white/10'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">star</span>
            <p className="text-sm">Starred</p>
          </button>
          <button
            onClick={() => setViewMode('shared')}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 font-bold ${viewMode === 'shared'
              ? 'bg-primary text-background-dark sketchy-border border-primary'
              : 'bg-charcoal text-white/70 border border-white/10'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <p className="text-sm">Shared</p>
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white font-display px-1">Your Canvas</h3>
          <span className="text-xs text-primary/60 font-medium">{filteredBoards.length} BOARDS</span>
        </div>

        {isLoading && (boards?.length || 0) === 0 && (
          <div className="flex justify-center py-8">
            <div className="text-white/60">Loading boards...</div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBoards.length > 0 ? (
            <>
              <button
                className="group"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <div className="w-full aspect-[1/1] bg-charcoal/40 rounded-xl border border-dashed border-primary/50 p-4 hover:bg-charcoal/50 transition-colors">
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <span className="material-symbols-outlined text-primary text-2xl">add</span>
                    </div>
                    <span className="text-primary font-bold text-base uppercase tracking-wider">New Board</span>
                  </div>
                </div>
              </button>

              {filteredBoards.map((board) => (
                <div key={board._id} className="flex flex-col gap-2">
                  <div className="w-full aspect-[1/1] bg-charcoal rounded-xl p-4 border border-white/10 hover:bg-charcoal/80 transition-colors cursor-pointer relative group"
                    onClick={() => router.push(`/board/${board._id}`)}>
                    <div className="flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg mb-2 leading-tight">{board.name}</h3>
                          <p className="text-white/60 text-sm">{formatTime(board.updatedAt)}</p>
                        </div>
                        {/* Note: Backend doesn't have isPinned field, so we'll skip this for now */}
                      </div>
                      {/* Note: Backend doesn't have collaborators field in the same format, so we'll skip this for now */}
                      {board.sharedWith && board.sharedWith.length > 0 && (
                        <div className="flex -space-x-2 mt-2">
                          {board.sharedWith.slice(0, 3).map((userId, index) => (
                            <div key={index} className="size-6 rounded-full bg-primary/50 border-2 border-background-dark"></div>
                          ))}
                          {board.sharedWith.length > 3 && (
                            <div className="size-6 rounded-full bg-charcoal border-2 border-background-dark flex items-center justify-center text-xs">
                              +{board.sharedWith.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Delete Button - Bottom Right */}
                    <button
                      className="absolute bottom-3 right-3 size-10 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/30 hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent card click
                        setDeleteBoardId(board._id)
                        setDeleteBoardName(board.name)
                      }}
                      title="Delete Board"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            !isLoading && (
              <div className="col-span-full min-h-[60vh] flex flex-col items-center justify-center py-12">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl">edit_square</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">No boards found</h3>
                <p className="text-white/60 text-center mb-6 max-w-md">
                  {searchQuery ? 'Try adjusting your search terms or' : 'Create your first board to get started'}
                </p>
                <button
                  className="bg-primary hover:bg-primary/90 text-background-dark px-6 py-2 rounded-full font-bold"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create New Board
                </button>
              </div>
            )
          )}
        </div>
      </main>

      <div className="fixed top-24 -right-12 opacity-10 pointer-events-none rotate-12">
        <span className="material-symbols-outlined text-[200px] text-primary">gesture</span>
      </div>

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateBoard}
        isLoading={isLoading}
        error={error}
      />

      <DeleteBoardModal
        isOpen={deleteBoardId !== null}
        onClose={() => {
          setDeleteBoardId(null)
          setDeleteBoardName('')
        }}
        onConfirm={handleDeleteBoard}
        boardName={deleteBoardName}
        isLoading={isLoading}
      />
    </div>
  )
}
