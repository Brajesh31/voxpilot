import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setCurrentAssistant, setPage } from '@/store/slices/assistantsSlice'
import { fetchAssistants, fetchAssistantDetail } from '@/store/slices/assistantsSlice'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, Plus, Bot, Menu, X, Radio } from 'lucide-react'
import { toast } from 'sonner'

export default function Sidebar({ onCreateAssistant }) {
  const { assistants, currentAssistantId, currentPage, itemsPerPage } = useSelector((state) => state.assistants)
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  const totalPages = Math.max(1, Math.ceil(assistants.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAssistants = assistants.slice(startIndex, endIndex)

  const loadAssistants = useCallback(async () => {
    setIsLoading(true)
    try {
      const resultAction = await dispatch(fetchAssistants())

      if (fetchAssistants.fulfilled.match(resultAction)) {
        const assistantsData = resultAction.payload
        if (assistantsData && assistantsData.length > 0 && !currentAssistantId) {
          const firstId = assistantsData[0].id
          dispatch(setCurrentAssistant(firstId))
          dispatch(fetchAssistantDetail(firstId))
        }
      } else {
        throw new Error(resultAction.payload || 'Failed to fetch assistants')
      }
    } catch {
      toast.error('Unable to load voice assistants', {
        description: 'Please verify your API key and connection.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, currentAssistantId])

  // Load assistants on component mount
  useEffect(() => {
    loadAssistants()
  }, [loadAssistants])

  const handleAssistantClick = async (assistantId) => {
    if (assistantId === currentAssistantId) return

    try {
      dispatch(setCurrentAssistant(assistantId))
      const resultAction = await dispatch(fetchAssistantDetail(assistantId))

      if (!fetchAssistantDetail.fulfilled.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to fetch assistant details')
      }
    } catch (error) {
      toast.error('Failed to load agent configuration', {
        description: error.message || 'Please try again.',
      })
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      dispatch(setPage(currentPage - 1))
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      dispatch(setPage(currentPage + 1))
    }
  }

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    try {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed))
    } catch {
      // Storage access restricted
    }
  }

  return (
    <aside 
      className={`${isCollapsed ? 'w-16' : 'w-64 lg:w-72'} bg-card border-r border-border flex flex-col h-screen min-h-screen max-h-screen transition-all duration-300 ease-in-out select-none shrink-0`}
      aria-label="VoxPilot Navigation"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm shrink-0">
                <Radio className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold tracking-tight text-foreground text-base">VoxPilot</span>
                    <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 bg-primary/10 text-primary rounded">v0.1</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Voice Agent Studio</p>
                </div>
              )}
            </div>
            <Button
              onClick={toggleCollapse}
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>

          {!isCollapsed && (
            <Button 
              onClick={onCreateAssistant}
              className="w-full shadow-sm"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Create Agent</span>
            </Button>
          )}
        </div>
      </div>

      {/* Assistants Navigation List */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-3 min-h-0">
        {isLoading && assistants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            {!isCollapsed && <span className="text-xs">Loading agents...</span>}
          </div>
        ) : assistants.length === 0 ? (
          <div className="text-center py-10 px-2">
            <Bot className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
            {!isCollapsed && (
              <>
                <p className="text-xs font-semibold text-foreground">No voice agents yet</p>
                <p className="text-[11px] text-muted-foreground mt-1">Create your first agent to begin configuring prompts and calls.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1.5" role="list">
            {currentAssistants.map((assistant) => {
              const isSelected = currentAssistantId === assistant.id
              return (
                <button
                  key={assistant.id}
                  type="button"
                  onClick={() => handleAssistantClick(assistant.id)}
                  title={assistant.name}
                  className={`w-full text-left rounded-lg transition-colors flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                  } ${
                    isSelected 
                      ? 'bg-primary/10 border border-primary/30 text-primary font-medium' 
                      : 'hover:bg-muted/70 text-foreground border border-transparent'
                  }`}
                  aria-selected={isSelected}
                >
                  <div className={`p-1.5 rounded-md shrink-0 ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Bot className="h-4 w-4" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{assistant.name || 'Unnamed Agent'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {assistant.model?.provider ? `${assistant.model.provider} • ` : ''}Active
                      </p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && !isCollapsed && (
        <div className="p-3 border-t border-border bg-card/50">
          <div className="flex items-center justify-between text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isLoading}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Prev
            </Button>
            <span className="text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className="h-7 px-2 text-xs"
            >
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  )
}
