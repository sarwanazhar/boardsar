'use client'

import React, { useEffect, useState } from "react"
import { useAuthStore, useInitAuth } from "@/lib/store"
import { boardAPI, authAPI } from "@/lib/api"

export default function DebugPage() {
  const { user } = useAuthStore()
  const { initAuth } = useInitAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const debugAuth = async () => {
      setLoading(true)
      try {
        console.log('=== DEBUGGING AUTH ===')
        
        // Test auth init
        console.log('1. Testing auth init...')
        await initAuth()
        console.log('2. Auth init completed')
        
        // Test profile
        console.log('3. Testing profile...')
        const profile = await authAPI.getProfile()
        console.log('4. Profile response:', profile)
        
        // Test boards
        console.log('5. Testing boards...')
        const boards = await boardAPI.getBoards()
        console.log('6. Boards response:', boards)
        
        setDebugInfo({
          user: user,
          profile: profile,
          boards: boards,
          success: true
        })
      } catch (error: any) {
        console.error('Debug error:', error)
        setDebugInfo({
          error: error.message,
          errorResponse: error.response,
          errorStatus: error.response?.status,
          errorData: error.response?.data
        })
      } finally {
        setLoading(false)
      }
    }

    debugAuth()
  }, [initAuth, user])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      {loading && <p>Loading...</p>}
      
      {debugInfo && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Debug Info:</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Current User:</h2>
            <pre className="bg-gray-100 p-4 rounded-lg">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}