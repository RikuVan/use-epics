import {StateObservable} from "../src"
import {Observable, Subject} from "rxjs"
import {map} from "rxjs/operators"

describe("StateObservable", () => {
    it("should exist", () => {
        expect(StateObservable.prototype).toBeInstanceOf(Observable)
    })

    it("should mirror the source subject", () => {
        const input$ = new Subject()
        const state$ = new StateObservable(input$, "first")
        let result = null

        state$.subscribe(state => {
            result = state
        })

        expect(result).toEqual("first")
        input$.next("second")
        expect(result).toEqual("second")
        input$.next("third")
        expect(result).toEqual("third")
    })

    it("should cache last state on the `value` property", () => {
        const input$ = new Subject()
        const state$ = new StateObservable(input$, "first")

        expect(state$.value).toEqual("first")
        input$.next("second")
        expect(state$.value).toEqual("second")
    })

    it("should only update when the next value shallowly differs", () => {
        const input$ = new Subject()
        const first = {value: "first"}
        const state$ = new StateObservable(input$, first)
        const next = jest.fn()
        state$.subscribe(next)

        expect(state$.value).toEqual(first)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toEqual(first)

        input$.next(first)
        expect(state$.value).toEqual(first)
        expect(next.mock.calls.length).toBe(1)

        first.value = "something else"
        input$.next(first)
        expect(state$.value).toEqual(first)
        expect(next.mock.calls.length).toBe(1)

        const second = {value: "second"}
        input$.next(second)
        expect(state$.value).toEqual(second)
        expect(next.mock.calls.length).toBe(2)
        expect(next.mock.calls[1][0]).toEqual(second)
    })

    it("works correctly (and does not lift) with operators applied", () => {
        const first = {value: "first"}
        const input$ = new Subject()
        const state$ = new StateObservable(input$, first).pipe(
            map<any, any>((d: {value: string}) => d.value)
        )

        const next = jest.fn()
        state$.subscribe(next)

        // because we piped an operator over it state$ is no longer a StateObservable
        // it's just a regular Observable and so it loses its `.value` prop
        expect((state$ as any).value).toEqual(undefined)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toEqual("first")

        first.value = "something else"
        input$.next(first)
        expect((state$ as any).value).toEqual(undefined)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toEqual("first")

        const second = {value: "second"}
        input$.next(second)
        expect((state$ as any).value).toEqual(undefined)
        expect(next.mock.calls.length).toBe(2)
        expect(next.mock.calls[1][0]).toEqual("second")
    })
})
