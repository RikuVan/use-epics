// import { useEpics } from '../src'
import React from 'react'
import { App } from '../demo/App'
import { cleanup, render, fireEvent, RenderResult } from 'react-testing-library'

afterEach(cleanup)

describe('counter', () => {
  let $: RenderResult

  function getCount() {
    return $.queryAllByTestId('count')
  }

  afterEach(() => {
    /*const actionsCreated = Number.parseInt(
      $.getByLabelText(/actions created/i).textContent,
      10
    )
    expect(actionsCreated).toBeLessThanOrEqual(0) */
  })

  describe('with count 0 intitially', () => {
    beforeEach(() => {
      $ = render(<App />)
    })

    it('is initially 0', () => {
      expect(getCount()).toBe(0)
    })
  })
})
