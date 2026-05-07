import { createContext, useContext, useState } from 'react'

const DemoModeContext = createContext({ demoMode: false, toggleDemoMode: () => {} })

export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false)
  const toggleDemoMode = () => setDemoMode(v => !v)
  return (
    <DemoModeContext.Provider value={{ demoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  return useContext(DemoModeContext)
}
