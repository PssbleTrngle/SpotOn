import { ThemeProvider } from '@emotion/react'
import { Queries, queries, render } from '@testing-library/react'
import { FC, ReactElement } from 'react'
import theme from '../lib/theme'

const Providers: FC = ({ children }) => {
   return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

function customRender<Q extends Queries = typeof queries, C extends Element | DocumentFragment = HTMLElement>(ui: ReactElement, options = {}) {
   return render<Q, C>(ui, { wrapper: Providers, ...options })
}

// re-export everything
export * from '@testing-library/react'
// override render method
export { customRender as render }
