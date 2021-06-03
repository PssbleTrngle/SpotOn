import { Queries, queries, render } from '@testing-library/react'
import { FC, ReactElement } from 'react'
// import { ThemeProvider } from "my-ui-lib"
// import { TranslationProvider } from "my-i18n-lib"
// import defaultStrings from "i18n/en-x-default"

const Providers: FC = ({ children }) => {
  return <>{children}</>
  // return (
  //   <ThemeProvider theme="light">
  //     <TranslationProvider messages={defaultStrings}>
  //       {children}
  //     </TranslationProvider>
  //   </ThemeProvider>
  // )
}

function customRender<
  Q extends Queries = typeof queries,
  C extends Element | DocumentFragment = HTMLElement
>(ui: ReactElement, options = {}) {
  return render<Q, C>(ui, { wrapper: Providers, ...options })
}

// re-export everything
export * from '@testing-library/react'
// override render method
export { customRender as render }


