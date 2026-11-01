import { Store } from '@tanstack/store'

export const store = new Store({
  firstName: 'Jane',
  lastName: 'Smith',
})

export const fullName = new Store(`${store.state.firstName} ${store.state.lastName}`)

store.subscribe(() => {
  fullName.setState(() => `${store.state.firstName} ${store.state.lastName}`)
})
