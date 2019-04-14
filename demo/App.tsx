import React, { useRef, useEffect } from 'react'
import { interval, empty } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map, switchMap, tap, ignoreElements } from 'rxjs/operators'
import { Epic, useEpics, ofType } from '../src'

const initialState = {
  num: 0,
  delay: null,
  dogSrc: null
}

interface State {
  num: number
  delay: number | null
  dogSrc: string | null
}

const createActions = (state: State) => ({
  reset: () => initialState,
  inc() {
    state.num++
  },
  dec() {
    state.num--
  },
  start() {
    state.delay = 1000
  },
  stop() {
    state.delay = null
  },
  getDog: () => undefined,
  setDog(dogSrc: string) {
    state.dogSrc = dogSrc
  }
})

const counterEpic: Epic<State, ReturnType<typeof createActions>> = (
  action$,
  state$,
  actions
) =>
  action$.pipe(
    ofType('start', 'stop'),
    switchMap(({ type }) => {
      const delay = state$.value.delay
      return type === 'start' && delay
        ? interval(delay).pipe(map(actions.inc))
        : empty()
    })
  )

const dogFetchEpic: Epic<State, ReturnType<typeof createActions>> = (
  action$,
  _,
  actions
) =>
  action$.pipe(
    ofType('getDog'),
    switchMap(() => {
      return ajax
        .getJSON('https://dog.ceo/api/breeds/image/random')
        .pipe(map((res: any) => actions.setDog(res.message)))
    })
  )

/*const loggerEpic: Epic<State, ReturnType<typeof createActions>> = (
  action$,
  state$
) =>
  action$.pipe(
    tap(action => {
      console.group('%c action', 'color: gray; font-weight: lighter;', action)
      console.log(
        '%c state',
        'color: #9E9E9E; font-weight: bold;',
        state$.value
      )
      console.groupEnd()
    }),
    ignoreElements()
  )*/

const epics = [counterEpic, dogFetchEpic]

export function App() {
  const [state, { inc, dec, reset, start, stop, getDog }] = useEpics(
    createActions,
    initialState,
    epics
  )
  // track how many times methods change (should never be more than zero)
  const actionChanges = useRef(-1)
  useEffect(() => {
    actionChanges.current++
  }, [inc, dec, reset, start, stop, getDog])

  return (
    <div className="App">
      <div data-testid="count">{state.num}</div>
      <button onClick={() => inc()}>increment</button>
      <button onClick={() => dec()}>decrement</button>
      <button onClick={() => reset()}>reset</button>
      <div>
        <button onClick={() => start()}>start</button>
        <button onClick={() => stop()}>stop</button>
      </div>
      <button onClick={() => getDog()}>dog</button>
      <div>{state.dogSrc && <img src={state.dogSrc} />}</div>
      <label>
        actions created: <span>{actionChanges.current}</span>
      </label>
    </div>
  )
}
