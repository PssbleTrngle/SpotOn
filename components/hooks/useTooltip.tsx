import { useEffect, useState } from 'react'
import ReactTooltip, { TooltipProps } from 'react-tooltip'

export default function useTooltip(id?: string, props: TooltipProps = {}) {
   const [mounted, setMounted] = useState(false)

   useEffect(() => {
      setMounted(true)
      return () => setMounted(false)
   }, [setMounted])

   const tooltip = <ReactTooltip id={id} backgroundColor='#000' insecure={false} effect='solid' {...props} />

   return mounted ? tooltip : null
}
