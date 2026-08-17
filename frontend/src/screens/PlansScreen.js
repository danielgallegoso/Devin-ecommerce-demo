import React from 'react';
import plans from '../data/plans';

function PlansScreen() {
  return (
    <div className="plans-page">
      <div className="plans-hero">
        <h1>Pick the plan that fits you</h1>
        <p>
          Every plan runs on our 5G network with unlimited talk and text. Prices
          shown are per line for a single line of service.
        </p>
      </div>
      <ul className="plans">
        {plans.map((plan) => (
          <li key={plan.id}>
            <div className={plan.featured ? 'plan plan-featured' : 'plan'}>
              {plan.featured && <div className="plan-badge">Most popular</div>}
              <h2 className="plan-name">{plan.name}</h2>
              <p className="plan-tagline">{plan.tagline}</p>
              <div className="plan-price">
                <span className="plan-price-amount">${plan.pricePerLine}</span>
                <span className="plan-price-unit">/mo per line</span>
              </div>
              <div className="plan-price-note">
                {plan.taxesIncluded
                  ? 'Taxes and fees included'
                  : 'Plus taxes and fees'}
              </div>
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
        Plan details are for demonstration only. Coverage not available
        everywhere.
      </p>
    </div>
  );
}

export default PlansScreen;
