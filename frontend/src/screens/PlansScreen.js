import React, { useState } from 'react';
import {
  PLANS,
  MAX_LINES,
  getPricePerLine,
  calculatePlanMonthlyTotal,
} from '../utils/planCatalog';

function PlansScreen() {
  const [lines, setLines] = useState(1);

  return (
    <div className="plans-page">
      <div className="plans-hero">
        <h1>Pick the plan that fits your family</h1>
        <p>
          Every plan includes unlimited talk, text and data on America's largest
          5G network. Prices shown are per line with AutoPay.
        </p>
        <div className="plans-lines">
          <label htmlFor="lines">Number of lines</label>
          <select
            id="lines"
            name="lines"
            value={lines}
            onChange={(e) => setLines(Number(e.target.value))}
          >
            {Array.from({ length: MAX_LINES }, (_, index) => index + 1).map(
              (count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? 'line' : 'lines'}
                </option>
              )
            )}
          </select>
        </div>
      </div>
      <ul className="plans">
        {PLANS.map((plan) => (
          <li key={plan.id}>
            <div className="plan-card">
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-tagline">{plan.tagline}</div>
              <div className="plan-price">
                ${getPricePerLine(plan, lines).toFixed(2)}
                <span className="plan-price-unit">/mo per line</span>
              </div>
              <div className="plan-total">
                ${calculatePlanMonthlyTotal(plan, lines).toFixed(2)} per month
                for {lines} {lines === 1 ? 'line' : 'lines'}
                {plan.taxesIncluded
                  ? ', taxes and fees included'
                  : ', plus taxes and fees'}
              </div>
              <dl className="plan-details">
                <dt>Data</dt>
                <dd>{plan.data}</dd>
                <dt>Hotspot</dt>
                <dd>{plan.hotspot}</dd>
                <dt>Streaming</dt>
                <dd>{plan.streaming}</dd>
              </dl>
              <ul className="plan-perks">
                {plan.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      <p className="plans-disclaimer">
        Plan details are for demonstration only. Coverage not available
        everywhere.
      </p>
    </div>
  );
}

export default PlansScreen;
