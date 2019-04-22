# `use-epics`

## Purpose

If you like handling side-effects with [redux-observable](https://github.com/redux-observable/redux-observable) and [rxjs](https://github.com/ReactiveX/RxJS), but want to do so more simply with a useReducer hook instead of redux, this is for you. Epics are combined with the simplicity of [use-methods](https://github.com/pelotom/use-methods), abstracting away `useReducer` into simple actions (reminiscent of [hyperapp](https://github.com/jorgebucaran/hyperapp)) and adding in [immer](https://github.com/mweststrate/immer). If you only want the actions without the epics, install `use-methods` instead. `use-epics` is built with Typescript.

## Getting started

```
npm install use-epics
```

## Api

`useEpics` takes, at a minimum, a map of actions and initial state. 

Actions use immer under the covers by default, so you can either return a new state (as if not using `immer`) or you can just update properties and not return a new state as `immer` does this for you. These actions will update state via a single useReducer hook which you do not have to worry about. If an action returns `undefined`, the state update will be skipped. This can be used to trigger a side-effect. Types are also derived for your actions so you do not need to provide your own action types. 

The optional third argument is an list of epics, which are called in order after the state is updated by an action with the observables of the action and updated state.

The final optional argument is an options object through which you can pass an initializer as the third argument to `useReducer` inside of `useEpics`, allowing lazy initialization of state. See the [React docs](https://reactjs.org/docs/hooks-reference.html#lazy-initialization) for more information in lazy initialization. You may also pass a `{immer: false}` option if you would rather not use immer.


### `useEpic`

```

const [state, actions] = useEpics(createActions, initialState, [epic1, epic2], options)

```

### `options`

```

{ 
  // defaults to  undefined
  init: (initial: number) => ({count}),
  // defaults to true
  immer: false
}

```

## Example

```

import React from 'react' import { interval, empty } from 'rxjs' import { map, switchMap } from 'rxjs/operators' import { Epic, useEpics, ofType } from 'use-epics'

const initialState = { count: 0, delay: null }

interface State { count: number delay: number | null }

const createActions = (state: State) => ({ reset: () => initialState, inc() { state.count++ }, dec() { state.count-- }, start(delay: number) { state.delay = delay }, stop() { state.delay = null } })

const counterEpic: Epic<State, ReturnType<typeof createActions>> = ( action$,
  state$, actions ) => action$.pipe(
    ofType('start', 'stop'),
    switchMap(({ type }) => {
      const delay = state$.value.delay return type === 'start' && delay ? interval(delay).pipe(map(actions.inc)) : empty() }) )

export function App() { const [{count}, { inc, dec, reset, start, stop }] = useEpics( createActions, initialState, [counterEpic] )

return ( <div className="App"> <div>{count}</div> <button onClick={() => inc()}>increment</button> <button onClick={() => dec()}>decrement</button> <button onClick={() => reset()}>reset</button> <button onClick={() => start(1000)}>start</button> <button onClick={() => stop()}>stop</button> </div> ) }

```

```
