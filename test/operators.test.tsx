import {Subject} from "rxjs"
import {ofType} from "../src"

const M = "MARILLA"
const L = "LORETTA"
const MI = "MILO"
type ActionType = typeof M | typeof L | typeof MI
type Action = {
    type: ActionType
    payload: number
}

describe("operators", () => {
    describe("ofType", () => {
        it("should filter by action type", () => {
            const actions = new Subject()
            const marilla: Action[] = []
            const loretta: Action[] = []

            actions.pipe(ofType(M)).subscribe((x: Action) => marilla.push(x))
            actions.pipe(ofType(L)).subscribe((x: Action) => loretta.push(x))

            actions.next({type: M, payload: 0})

            expect(marilla).toEqual([{type: M, payload: 0}])
            expect(loretta).toEqual([])

            actions.next({type: M, payload: 1})

            expect(marilla).toEqual([
                {type: M, payload: 0},
                {type: M, payload: 1}
            ])
            expect(loretta).toEqual([])

            actions.next({type: L, payload: 0})

            expect(marilla).toEqual([
                {type: M, payload: 0},
                {type: M, payload: 1}
            ])
            expect(loretta).toEqual([{type: L, payload: 0}])
        })

        it("should filter by multiple action types", () => {
            const actions = new Subject()
            const marillaOrMilo: Action[] = []
            const loretta: Action[] = []

            actions
                .pipe(ofType(M, MI))
                .subscribe((x: Action) => marillaOrMilo.push(x))
            actions.pipe(ofType(L)).subscribe((x: Action) => loretta.push(x))

            actions.next({type: M, i: 0})

            expect(marillaOrMilo).toEqual([{type: M, i: 0}])
            expect(loretta).toEqual([])

            actions.next({type: MI, i: 1})

            expect(marillaOrMilo).toEqual([{type: M, i: 0}, {type: MI, i: 1}])
            expect(loretta).toEqual([])

            actions.next({type: L, i: 0})

            expect(marillaOrMilo).toEqual([{type: M, i: 0}, {type: MI, i: 1}])
            expect(loretta).toEqual([{type: L, i: 0}])
        })
    })
})
