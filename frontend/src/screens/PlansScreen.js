import React, { useState } from 'react';
import {
  MAX_LINES,
  calculateMonthlyTotal,
  calculatePricePerLine,
  plans,
} from '../utils/planPricing';

const formatCurrency = (amount) =>
  amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function PlansScreen() {
  const [lines, setLines] = useState(1);

  const lineOptions = Array.from({ length: MAX_LINES }, (_, index) => index + 1);

  return (
    <div className="plans">
      <div className="plans-hero">
        <h1>Pick the plan that fits your crew</h1>
        <p>
          All plans include unlimited talk, text and data on the T-Mobile 5G
          network. Prices shown are per month with AutoPay.
        </p>
      </div>

      <div className="plans-lines">
        <label htmlFor="lines">How many lines do you need?</label>
        <select
          id="lines"
          name="lines"
          value={lines}
          onChange={(e) => setLines(Number(e.target.value))}
        >
          {lineOptions.map((option) => (
            <option key={option} value={option}>
              {option} {option === 1 ? 'line' : 'lines'}
            </option>
          ))}
        </select>
      </div>

      <ul className="plan-cards">
        {plans.map((plan) => (
          <li key={plan.id}>
            <div className="plan-card">
              <h2 className="plan-name">{plan.name}</h2>
              <p className="plan-tagline">{plan.tagline}</p>
              <div className="plan-price">
                ${formatCurrency(calculateMonthlyTotal(plan, lines))}/mo
              </div>
              <div className="plan-price-per-line">
                ${formatCurrency(calculatePricePerLine(plan, lines))}/mo per line
                for {lines} {lines === 1 ? 'line' : 'lines'}
              </div>
              <dl className="plan-details">
                <dt>Data</dt>
                <dd>{plan.data}</dd>
                <dt>Hotspot</dt>
                <dd>{plan.hotspot}</dd>
              </dl>
              <ul className="plan-highlights">
                {plan.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <p className="plans-disclaimer">
        Demo pricing for illustration only. Plan shopping is not connected to
        checkout yet.
      </p>
    </div>
  );
}

export default PlansScreen;
