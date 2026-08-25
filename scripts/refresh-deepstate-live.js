const fs = require('fs');

async function main() {
const queryId = '8340363';
const apiKey = process.env.DUNE_API_KEY;

if (!apiKey) throw new Error('Missing DUNE_API_KEY. Configure it as a GitHub Actions secret.');

const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, {
  headers: { 'X-DUNE-API-KEY': apiKey, Accept: 'application/json' },
});
if (!response.ok) throw new Error(`Dune API ${response.status}: ${await response.text()}`);

const payload = await response.json();
const values = Object.fromEntries((payload?.result?.rows || []).map((row) => [row.metric, Number(row.value)]));
const compact = (value, digits = 2) => {
  if (value >= 1e6) return `${(value / 1e6).toFixed(digits)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(digits)}k`;
  return value.toFixed(digits);
};

const output = {
  updated_at: new Date().toISOString(),
  source_label: 'Dune query 8340363',
  source_url: 'https://dune.com/queries/8340363',
  metrics: {
    deep_distributed: compact(values['DEEP distributed']),
    rewarder_left: compact(values['Left in rewarder']),
    farmers: String(Math.round(values['Unique farmers'])),
    top10_share: `${values['Top-10 farmer share, %'].toFixed(1)}%`,
    deep_price: `$${values['DEEP price, USDG'].toFixed(4)}`,
    float_market_cap: `$${compact(values['Float market cap, USDG'], 1)}`,
    emission_to_revenue: `${values['Emission / revenue, x'].toFixed(1)}x`,
    nvda_price: values['NVDA price, USDG'].toFixed(4),
    burned_into_state: `${values['Burned / distributed, %'].toFixed(1)}%`,
    state_outstanding: compact(values['STATE outstanding']),
    vault_nav: `$${compact(values['Vault NAV, USDG'], 1)}`,
    protocol_fees_net: `$${compact(values['Protocol fees net, USDG'], 1)}`,
  },
  raw: { nvda_price: values['NVDA price, USDG'] },
};

fs.writeFileSync('deepstate-live.json', `${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
