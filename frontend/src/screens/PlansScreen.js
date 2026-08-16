import React, { useState } from 'react';
import {
  PLANS,
  MAX_DISCOUNTED_LINES,
  getPricePerLine,
  calculateMonthlyTotal,
} from '../utils/plans';

function PlansScreen() {
  const [lineCount, setLineCount] = useState(1);

  return (
    <div className="plans-page">
      <div className="plans-hero">
        <h1>Pick the plan that fits your family</h1>
        <p>
          All plans include unlimited talk, text and data on our 5G network. Pick
          the number of lines to see your per-line price.
        </p>
        <div className="plans-line-picker">
          <span>Lines</span>
          {Array.from({ length: MAX_DISCOUNTED_LINES }, (_, i) => i + 1).map(
            (count) => (
              <button
                key={count}
                type="button"
                className={
                  count === lineCount
                    ? 'plans-line-button selected'
                    : 'plans-line-button'
                }
                onClick={() => setLineCount(count)}
              >
                {count}
              </button>
            )
          )}
        </div>
      </div>
      <ul className="plans">
        {PLANS.map((plan) => (
          <li key={plan.id}>
            <div className="plan-card">
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-tagline">{plan.tagline}</div>
              <div className="plan-price">
                ${getPricePerLine(plan, lineCount)}
                <span className="plan-price-unit">/line per month</span>
              </div>
              <div className="plan-total">
                ${calculateMonthlyTotal(plan, lineCount)} per month for{' '}
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </div>
              <div className="plan-taxes">
                {plan.taxesIncluded
                  ? 'Taxes and fees included'
                  : 'Plus taxes and fees'}
              </div>
              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      <p className="plans-disclaimer">
        Demo pricing shown with AutoPay. Coverage not available everywhere.
      </p>
    </div>
  );
}

export default PlansScreen;
