import React from 'react'
import { interval, empty } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { map, switchMap, tap, ignoreElements } from 'rxjs/operators'
import { useEpics, ofType } from '../dist/use-epics'

const initialState = {
  num: 0,
  delay: null,
  dogSrc: null
}

interface State {
  num: number
  delay: number | null
  dogSrc?: string
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
  getDog: () => {},
  setDog(dogSrc: string) {
    state.dogSrc = dogSrc
  }
})

const epics = [
  (action$, state$, actions) =>
    action$.pipe(
      ofType('start', 'stop'),
      switchMap(({ type }) => {
        return type === 'start'
          ? interval(state$.value.delay).pipe(map(actions.inc))
          : empty()
      })
    ),
  (action$, _, actions) =>
    action$.pipe(
      ofType('getDog'),
      switchMap(() => {
        return ajax
          .getJSON('https://dog.ceo/api/breeds/image/random')
          .pipe(map((res: { message: string }) => actions.setDog(res.message)))
      })
    ),
  (action$, state$) =>
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
    )
]

export function App() {
  const [state, actions] = useEpics(createActions, initialState, epics)
  return (
    <div className="App">
      <div>{state.num}</div>
      <button onClick={() => actions.inc()}>increment</button>
      <button onClick={() => actions.dec()}>decrement</button>
      <button onClick={() => actions.reset()}>reset</button>
      <div>
        <button onClick={() => actions.start()}>start</button>
        <button onClick={() => actions.stop()}>stop</button>
      </div>
      <button onClick={() => actions.getDog()}>dog</button>
      <div>{state.dogSrc && <img src={state.dogSrc} />}</div>
    </div>
  )
}
