const { createComponent } = require('solid-js/web')
const { createContext } = require('solid-js')

const Context = createContext({})

function ContextProvider ({ children, context }) {
  return createComponent(Context.Provider, {
    value: context,
    children: children,
  })
}

module.exports = { ContextProvider, Context }
