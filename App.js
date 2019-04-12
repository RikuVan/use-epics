import React, { useMemo, useReducer, useEffect, useRef, useState } from 'react'
import {
  BehaviorSubject,
  Subject,
  interval,
  empty,
  queueScheduler,
  Observable,
  merge
} from 'rxjs'
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
    filter(action => {
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

export class StateObservable extends Observable {
  constructor(stateSubject, initialState) {
    super(subscriber => {
      const subscription = this.__notifier.subscribe(subscriber)
      if (subscription && !subscription.closed) {
        subscriber.next(this.value)
      }
      return subscription
    })

    this.value = initialState
    this.__notifier = new Subject()
    this.__subscription = stateSubject.subscribe(value => {
      if (value !== this.value) {
        this.value = value
        this.__notifier.next(value)
      }
    })
  }
}

function useActions(createActions, initialState = {}, epics = []) {
  let stateRef$ = useRef(null)
  let actionRef$ = useRef(null)

  let wrappedActions

  const [lastAction, setLastAction] = useState(null)

  const reducer = useMemo(() => {
    return produce((state, action) =>
      createActions(state)[action.type](action.payload)
    )
  }, [createActions])

  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    stateRef$.current = new BehaviorSubject(initialState).pipe(
      observeOn(queueScheduler),
      distinctUntilChanged()
    )
    actionRef$.current = new Subject().pipe(observeOn(queueScheduler))

    const state$ = new StateObservable(stateRef$.current, initialState)

    const epics$ = epics.map(epic =>
      epic(actionRef$.current, state$, wrappedActions)
    )

    const effectSubscriptions$ = epics$.map(e => e.subscribe())

    return () => effectSubscriptions$.forEach(e => e.unsubscribe())
  }, [])

  const actionTypes = Object.keys(createActions(initialState))

  wrappedActions = useMemo(() => {
    return actionTypes.reduce((acc, type) => {
      const dispatchWithEpic = payload => {
        const action = { type, payload }
        const nextState = reducer(state, action)
        // while an action that returns undefined is not dispatched,
        // is is pushed into the epic to trigger side-effects
        nextState !== undefined && dispatch(action)
        setLastAction(action)
      }
      acc[type] = payload => dispatchWithEpic(payload)
      return acc
    }, {})
  }, [wrappedActions, state, createActions, dispatch, actionTypes])

  useEffect(() => {
    if (lastAction) {
      stateRef$.current.next(state)
      actionRef$.current.next(lastAction)
    }

    setLastAction(null)
  }, [lastAction])

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
          .pipe(map(res => actions.setDog(res.message)))
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
