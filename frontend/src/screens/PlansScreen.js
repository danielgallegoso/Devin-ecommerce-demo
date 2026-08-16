import React, { useState } from 'react';
import { PLANS, MAX_LINES, getPlanPricing, formatPrice } from '../utils/plans';

function PlansScreen() {
  const [lineCount, setLineCount] = useState(1);

  return (
    <div className="plans-page">
      <div className="plans-hero">
        <h1>Pick the plan that fits your family</h1>
        <p>
          Three unlimited plans on our 5G network. Prices shown are per month
          with AutoPay.
        </p>
        <div className="plans-lines">
          <span>Lines</span>
          {Array.from({ length: MAX_LINES }, (_, index) => index + 1).map(
            (count) => (
              <button
                key={count}
                type="button"
                className={
                  count === lineCount ? 'button primary' : 'button secondary'
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
        {PLANS.map((plan) => {
          const { monthlyTotal, pricePerLine } = getPlanPricing(
            plan,
            lineCount
          );
          return (
            <li key={plan.id}>
              <div className={plan.popular ? 'plan plan-popular' : 'plan'}>
                {plan.popular && <div className="plan-badge">Most popular</div>}
                <h2 className="plan-name">{plan.name}</h2>
                <p className="plan-tagline">{plan.tagline}</p>
                <div className="plan-price">
                  {formatPrice(pricePerLine)}
                  <span className="plan-price-unit">/mo per line</span>
                </div>
                <div className="plan-total">
                  {formatPrice(monthlyTotal)} per month for {lineCount}{' '}
                  {lineCount === 1 ? 'line' : 'lines'}
                </div>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="plans-disclaimer">
        Demo pricing for illustration only. Plans on this page are not
        purchasable in this store.
      </p>
    </div>
  );
}

export default PlansScreen;
