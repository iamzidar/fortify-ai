'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Navbar } from '@/components/dashboard/Navbar'
import { api } from '@/lib/api'

interface Overview {
  totalApplications: number
  totalVersions: number
  issueCounts: { Critical: number; High: number; Medium: number; Low: number; total: number }
  lastUpdated: string
}

function SeverityBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{count.toLocaleString()}</p>
    </div>
  )
}

function DashboardContent() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [apps, setApps] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [ov, appList] = await Promise.all([
          api.getDashboardOverview() as Promise<Overview>,
          api.getApplications() as Promise<unknown[]>,
        ])
        setOverview(ov)
        setApps(appList)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SeverityBadge
          label="Critical"
          count={overview?.issueCounts.Critical ?? 0}
          color="bg-red-600 text-white"
        />
        <SeverityBadge
          label="High"
          count={overview?.issueCounts.High ?? 0}
          color="bg-orange-500 text-white"
        />
        <SeverityBadge
          label="Medium"
          count={overview?.issueCounts.Medium ?? 0}
          color="bg-yellow-400 text-gray-900"
        />
        <SeverityBadge
          label="Low"
          count={overview?.issueCounts.Low ?? 0}
          color="bg-blue-100 text-blue-800"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Applications</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{overview?.totalApplications ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Versions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{overview?.totalVersions ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Issues</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{overview?.issueCounts.total ?? 0}</p>
        </div>
      </div>

      {/* Applications table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Applications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(apps as Array<{ id: number; name: string; creationDate: string }>).map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-400 font-mono">{app.id}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{app.name}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(app.creationDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {overview?.lastUpdated && (
        <p className="text-xs text-gray-400 text-right">
          Last updated: {new Date(overview.lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Fortify SSC — fortify.kikoichi.dev</p>
        </div>
        <DashboardContent />
      </main>
    </AuthGuard>
  )
}
