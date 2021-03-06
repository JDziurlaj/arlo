import React from 'react'
import { waitForElement, wait } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import AuditForms from './index'
import { statusStates, dummyBallots } from './_mocks'
import * as utilities from '../utilities'
import { routerTestProps, asyncActRender } from '../testUtilities'

const apiMock: jest.SpyInstance<
  ReturnType<typeof utilities.api>,
  Parameters<typeof utilities.api>
> = jest.spyOn(utilities, 'api').mockImplementation()
const checkAndToastMock: jest.SpyInstance<
  ReturnType<typeof utilities.checkAndToast>,
  Parameters<typeof utilities.checkAndToast>
> = jest.spyOn(utilities, 'checkAndToast').mockReturnValue(false)

checkAndToastMock.mockReturnValue(false)

const routeProps = routerTestProps('/election/:electionId', { electionId: '1' })

afterEach(() => {
  apiMock.mockClear()
  checkAndToastMock.mockClear()
})

describe('RiskLimitingAuditForm', () => {
  it('fetches initial state from api', async () => {
    apiMock.mockImplementation(async () => statusStates[0])
    const { container } = await asyncActRender(<AuditForms {...routeProps} />)

    expect(container).toMatchSnapshot()
    await wait(() => {
      expect(apiMock).toBeCalledTimes(1)
      expect(apiMock.mock.calls[0][0]).toMatch(
        /\/election\/[^/]+\/audit\/status/
      )
      expect(apiMock.mock.results[0].value).resolves.toBe(statusStates[0])
    })
  })

  it('renders correctly with initialData', async () => {
    const { container } = await asyncActRender(<AuditForms {...routeProps} />)
    expect(container).toMatchSnapshot()
  })

  it('still renders if there is a server error', async () => {
    checkAndToastMock.mockReturnValueOnce(true)
    await asyncActRender(<AuditForms {...routeProps} />)
    expect(checkAndToastMock).toBeCalledTimes(1)
  })

  it('does not render SelectBallotsToAudit when /audit/status is processing samplesizes', async () => {
    apiMock.mockImplementation(async () => statusStates[1])
    const { container, queryByTestId } = await asyncActRender(
      <AuditForms {...routeProps} />
    )

    expect(queryByTestId('form-two')).toBeNull()
    expect(container).toMatchSnapshot()
    await wait(() => {
      expect(apiMock).toBeCalledTimes(1)
      expect(apiMock.mock.calls[0][0]).toMatch(
        /\/election\/[^/]+\/audit\/status/
      )
      expect(apiMock.mock.results[0].value).resolves.toBe(statusStates[1])
    })
  })

  it('renders SelectBallotsToAudit when /audit/status returns contest data', async () => {
    apiMock.mockImplementation(async () => statusStates[2])
    const { container, getByTestId } = await asyncActRender(
      <AuditForms {...routeProps} />
    )

    const fillFormTwo = await waitForElement(() => getByTestId('form-two'), {
      container,
    })

    expect(fillFormTwo).toBeTruthy()
    expect(container).toMatchSnapshot()
    await wait(() => {
      expect(apiMock).toBeCalledTimes(1)
      expect(apiMock.mock.calls[0][0]).toMatch(
        /\/election\/[^/]+\/audit\/status/
      )
      expect(apiMock.mock.results[0].value).resolves.toBe(statusStates[2])
    })
  })

  it('does not render CalculateRiskMeasurement when audit.jurisdictions has length but audit.rounds does not', async () => {
    apiMock.mockImplementation(async () => statusStates[3])
    const { container, getByTestId, queryByTestId } = await asyncActRender(
      <AuditForms {...routeProps} />
    ) // this one will not have the first empty round

    const fillFormTwo = await waitForElement(() => getByTestId('form-two'), {
      container,
    })

    expect(fillFormTwo).toBeTruthy()
    expect(queryByTestId('form-three-1')).toBeNull()
    expect(container).toMatchSnapshot()
    await wait(() => {
      expect(apiMock).toBeCalledTimes(1)
      expect(apiMock.mock.calls[0][0]).toMatch(
        /\/election\/[^/]+\/audit\/status/
      )
      expect(apiMock.mock.results[0].value).resolves.toBe(statusStates[3])
    })
  })

  it('renders CalculateRiskMeasurement when /audit/status returns round data', async () => {
    apiMock
      .mockImplementationOnce(async () => statusStates[4])
      .mockImplementationOnce(async () => dummyBallots)
    const { container, getByTestId } = await asyncActRender(
      <Router>
        <AuditForms {...routeProps} />
      </Router>
    ) // this one will not have the first empty round

    const formThree = await waitForElement(() => getByTestId('form-three-1'), {
      container,
    })

    expect(formThree).toBeTruthy()
    expect(container).toMatchSnapshot()
    await wait(() => {
      expect(apiMock).toBeCalledTimes(2)
      expect(apiMock.mock.calls[0][0]).toMatch(
        /\/election\/[^/]+\/audit\/status/
      )
      expect(apiMock.mock.results[0].value).resolves.toBe(statusStates[4])
    })
  })
})
