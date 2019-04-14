// import { useEpics } from '../src'
import React from 'react'
import { App } from '../demo/App'
import {
  cleanup,
  render,
  fireEvent,
  RenderResult,
  act
} from 'react-testing-library'

afterEach(cleanup)

describe('counter', () => {
  let $: RenderResult

  afterEach(() => {
    const actionsCreated = parse(
      ($.getByLabelText(/actions created/i) as any).textContent
    )
    expect(actionsCreated).toBeLessThanOrEqual(0)
  })

  describe('with count 0 intitially', () => {
    beforeEach(() => {
      act(() => {
        $ = render(<App />)
      })
    })

    it('is initially 0', () => {
      expect(getCount()).toEqual(0)
    })

    it('inc', () => {
      fireEvent.click($.getByText(/inc/i))
      expect(getCount()).toEqual(1)
    })

    it('dec', () => {
      fireEvent.click($.getByText(/dec/i))
      expect(getCount()).toEqual(-1)
    })

    it('reset', () => {
      fireEvent.click($.getByText(/dec/i))
      fireEvent.click($.getByText(/reset/i))
      expect(getCount()).toEqual(0)
    })

    it('epic counter', async () => {
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
        ($.container as any).querySelector('[data-testid="count"]').textContent
      )
    }
  })
})

function parse(v: string) {
  return Number.parseInt(v, 10)
}
