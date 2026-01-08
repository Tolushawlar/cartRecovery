'use client'

import { useState, useEffect } from 'react'

interface RecoveryStats {
  totalAbandoned: number
  totalCompleted: number
  totalCalls: number
  successfulCalls: number
  carts: any[]
  calls: any[]
}

export default function RecoveryDashboard() {
  const [stats, setStats] = useState<RecoveryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recovery')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const triggerProcessAll = async () => {
    try {
      const response = await fetch('/api/recovery?processAll=true', {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('All webhooks processed successfully')
        fetchStats()
      } else {
        alert('Failed to process all webhooks')
      }
    } catch (error) {
      alert('Error processing all webhooks')
    }
  }

  const triggerManualRun = async () => {
    try {
      const response = await fetch('/api/recovery', {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Manual recovery run triggered successfully')
        fetchStats()
      } else {
        alert('Failed to trigger manual run')
      }
    } catch (error) {
      alert('Error triggering manual run')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Cart Recovery Dashboard</h1>
        
        <div className="flex gap-4 items-center mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={triggerManualRun}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
          >
            Trigger Manual Run
          </button>
          <button
            onClick={() => triggerProcessAll()}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Process All Webhooks
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Abandoned Carts</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAbandoned}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Completed Orders</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalCompleted}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Total Calls</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.totalCalls}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Successful Calls</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.successfulCalls}</p>
            </div>
          </div>

          {/* Abandoned Carts Table */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Abandoned Carts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calls Made</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.carts.map((cart) => (
                    <tr key={cart.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cart.customer_name}</div>
                          <div className="text-sm text-gray-500">{cart.customer_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cart.customer_phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cart.currency} {cart.total_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cart.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-1">
                          {cart.call_2_hour && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">2h</span>}
                          {cart.call_4_hour && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">4h</span>}
                          {cart.call_8_hour && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">8h</span>}
                          {cart.call_16_hour && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">16h</span>}
                          {cart.call_24_hour && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">24h</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cart.is_completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cart.is_completed ? 'Completed' : 'Abandoned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Call Logs Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Calls</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Call Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.calls.map((call) => (
                    <tr key={call.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Call Log
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${
                          call.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {call.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(call.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}