import {useEpics} from "../src"
import React from "react"
import {App} from "../demo/App"
import {
    cleanup,
    render,
    fireEvent,
    RenderResult,
    act
} from "react-testing-library"

afterEach(cleanup)

describe("counter with default options", () => {
    let $: RenderResult

    afterEach(() => {
        const actionsCreated = parse(
            ($.getByLabelText(/actions created/i) as any).textContent
        )
        expect(actionsCreated).toBeLessThanOrEqual(0)
    })

    describe("with count 0 intitially", () => {
        beforeEach(() => {
            act(() => {
                $ = render(<App />)
            })
        })

        it("is initially 0", () => {
            expect(getCount()).toEqual(0)
        })

        it("inc", () => {
            fireEvent.click($.getByText(/inc/i))
            expect(getCount()).toEqual(1)
        })

        it("dec", () => {
            fireEvent.click($.getByText(/dec/i))
            expect(getCount()).toEqual(-1)
        })

        it("reset", () => {
            fireEvent.click($.getByText(/dec/i))
            fireEvent.click($.getByText(/reset/i))
            expect(getCount()).toEqual(0)
        })

        it("epic counter", async () => {
            fireEvent.click($.getByText(/start/i))
            const count1 = await waitFor(getCount, 1)
            const count2 = await waitFor(getCount, 1)
            expect(count1).toBe(1)
            expect(count2).toBe(2)
            fireEvent.click($.getByText(/stop/i))
            const count3 = await waitFor(getCount, 2)
            expect(count3).toBe(2)
        })

        async function waitFor(callback: Function, seconds: number) {
            const promise = new Promise(resolve => {
                return setTimeout(() => resolve(callback()), seconds * 1000)
            })
            return promise
        }

        function getCount() {
            return parse(
                ($.container as any).querySelector('[data-testid="count"]')
                    .textContent
            )
        }
    })
})

function parse(v: string) {
    return Number.parseInt(v, 10)
}

describe("counter with options", () => {
    interface CounterProps {
        initialCount: number | {count: number}
        immer: boolean
        init?: any
        actions: any
    }

    const testId = "counter-testid"

    function Counter({initialCount, init, immer, actions}: CounterProps) {
        const [state, {increment, decrement, reset}] = useEpics(
            actions,
            initialCount,
            [],
            {
                init,
                immer
            }
        )
        return (
            <>
                Count: <span data-testid={testId}>{(state as any).count}</span>
                <button onClick={increment}>+</button>
                <button onClick={decrement}>-</button>
                <button onClick={() => reset(initialCount)}>Reset</button>
            </>
        )
    }
    it("allows lazy initialization option", () => {
        // Adapted from https://reactjs.org/docs/hooks-reference.html#lazy-initialization

        interface State {
            count: number
        }

        const init = (count: number): State => ({
            count
        })

        const actions = (state: State) => ({
            increment() {
                state.count++
            },
            decrement() {
                state.count--
            },
            reset(newCount: number) {
                return init(newCount)
            }
        })

        const $ = render(
            <Counter initialCount={0} immer init={init} actions={actions} />
        ) as any

        const expectCount = (count: number) =>
            expect(parse($.getByTestId(testId).textContent)).toBe(count)

        expectCount(0)

        fireEvent.click($.getByText("+"))

        expectCount(1)

        fireEvent.click($.getByText("+"))

        expectCount(2)

        fireEvent.click($.getByText(/reset/i))

        expectCount(0)

        fireEvent.click($.getByText("-"))

        expectCount(-1)

        $.rerender(
            <Counter initialCount={3} immer init={init} actions={actions} />
        )

        expectCount(-1)

        fireEvent.click($.getByText(/reset/i))

        expectCount(3)
    })

    it("counter without immer", () => {
        interface State {
            count: number
        }

        const actions = (state: State) => ({
            increment: () => ({
                ...state,
                count: state.count + 1
            }),
            decrement: () => ({
                ...state,
                count: state.count - 1
            }),
            reset: () => ({
                count: 0
            })
        })

        const testId = "counter-testid"

        const $ = render(
            <Counter
                initialCount={{count: 0}}
                immer={false}
                actions={actions}
            />
        ) as any

        const expectCount = (count: number) =>
            expect(parse($.getByTestId(testId).textContent)).toBe(count)

        expectCount(0)

        fireEvent.click($.getByText("+"))

        expectCount(1)

        fireEvent.click($.getByText("+"))

        expectCount(2)

        fireEvent.click($.getByText(/reset/i))

        expectCount(0)

        fireEvent.click($.getByText("-"))

        expectCount(-1)
    })
})
