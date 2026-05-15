import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="card max-w-md w-full text-center py-12">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-6">
              NexaWork encountered an unexpected error. Don't worry — your data is safe.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 mb-6 font-mono text-left">
                {this.state.error}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.reload()} className="btn-primary px-6 py-2 text-sm">
                Refresh Page
              </button>
              <a href="/" className="btn-secondary px-6 py-2 text-sm">Go Home</a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
