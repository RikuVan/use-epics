import React, { useMemo, useReducer, useEffect, useRef } from 'react'
import { BehaviorSubject, interval, empty, queueScheduler } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import {
  map,
  filter,
  switchMap,
  observeOn,
  distinctUntilChanged,
  tap,
  ignoreElements
} from 'rxjs/operators'
import produce from 'immer'

export const ofType = (...keys) => source =>
  source.pipe(
    filter(({ action }) => {
      if (!action) return false
      const { type } = action
      const len = keys.length

      if (len === 1) {
        return type === keys[0]
      } else {
        for (let i = 0; i < len; i++) {
          if (type === keys[i]) {
            return true
          }
        }
      }
      return false
    })
  )

function useActions(createActions, initialState = {}, epics = []) {
  let subjectRef$ = useRef(null)
  let wrappedActions
  // create reducer
  const reducer = useMemo(() => {
    return produce((state, action) =>
      createActions(state)[action.type](action.payload)
    )
  }, [createActions])

  useEffect(() => {
    const subject = new BehaviorSubject({
      action: { type: null },
      state,
      actions: wrappedActions
    }).pipe(
      observeOn(queueScheduler),
      distinctUntilChanged()
    )

    subjectRef$.current = subject

    const epics$ = epics.map(epic => epic(subjectRef$.current))
    const effectSubscriptions$ = epics$.map(e => e.subscribe())

    subjectRef$.current.next({
      action: { type: '$$initialize', payload: null },
      state,
      actions: wrappedActions
    })

    return () => effectSubscriptions$.forEach(fx => fx.unsubscribe())
  }, [subjectRef$])

  const [state, dispatch] = useReducer(reducer, initialState)
  const actionTypes = Object.keys(createActions(initialState))

  wrappedActions = useMemo(() => {
    return actionTypes.reduce((acc, type) => {
      const dispatchWithEpic = payload => {
        const action = { type, payload }
        const nextState = reducer(state, action)
        nextState !== undefined && dispatch(action)
        subjectRef$.current.next({
          action,
          state: nextState || state,
          actions: wrappedActions
        })
      }
      acc[type] = payload => dispatchWithEpic(payload)
      return acc
    }, {})
  }, [wrappedActions, state, createActions, dispatch, actionTypes])
  return [state, wrappedActions]
}

const initialState = {
  num: 0,
  delay: null
}

const createActions = state => ({
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
  setDog(dogSrc) {
    state.dogSrc = dogSrc
  }
})

const epics = [
  obs$ =>
    obs$.pipe(
      ofType('start', 'stop'),
      switchMap(v => {
        return v.action.type === 'start'
          ? interval(v.state.delay).pipe(map(v.actions.inc))
          : empty()
      })
    ),
  obs$ =>
    obs$.pipe(
      ofType('getDog'),
      switchMap(v => {
        return ajax
          .getJSON('https://dog.ceo/api/breeds/image/random')
          .pipe(map(res => v.actions.setDog(res.message)))
      })
    ),
  obs$ =>
    obs$.pipe(
      tap(({ action, state }) => {
        console.group('%c action', 'color: gray; font-weight: lighter;', action)
        console.log('%c state', 'color: #9E9E9E; font-weight: bold;', state)
        console.groupEnd()
      }),
      ignoreElements()
    )
]

export function App() {
  const [state, actions] = useActions(createActions, initialState, epics)
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
