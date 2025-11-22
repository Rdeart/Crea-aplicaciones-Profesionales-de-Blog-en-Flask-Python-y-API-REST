import React from 'react'

const FullPagePreloader: React.FC<{visible: boolean}> = ({visible}) => {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white/10 p-8 rounded-lg text-center text-white max-w-xs w-full">
        <div className="flex items-center justify-center mb-4">
          <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Guardando favoritos...</h3>
        <p className="text-sm mt-2 text-white/80">Por favor espera mientras se actualiza tu lista de favoritos.</p>
      </div>
    </div>
  )
}

export default FullPagePreloader
