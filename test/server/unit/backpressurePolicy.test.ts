import * as assert from 'assert/strict';

import {
  getRuntimeWorkloadPolicy,
  listRuntimeWorkloadPolicies,
} from '../../../src/server/runtime/backpressurePolicy';

suite('unit/backpressurePolicy (B267)', () => {
  test('declara workload classes canonicas con lane y throttling explicitos', () => {
    const policies = listRuntimeWorkloadPolicies();

    assert.equal(policies.length, 10);
    assert.deepEqual(
      policies.map((policy) => policy.workload),
      [
        'interactive',
        'near-context',
        'diagnostics',
        'background-indexing',
        'export-reporting',
        'build',
        'legacy-orca',
        'ai-tooling',
        'maintenance',
        'critical-initialization',
      ]
    );
  });

  test('build, legacy-orca, export-reporting, ai-tooling y maintenance quedan como background throttled por latencia', () => {
    for (const workload of ['export-reporting', 'build', 'legacy-orca', 'ai-tooling', 'maintenance'] as const) {
      const policy = getRuntimeWorkloadPolicy(workload);
      assert.equal(policy.lane, 'background');
      assert.equal(policy.throttledByLatency, true);
    }
  });

  test('build y legacy-orca quedan preservados ante preempción, mientras reporting y maintenance siguen siendo cancelables', () => {
    assert.equal(getRuntimeWorkloadPolicy('build').preemptible, false);
    assert.equal(getRuntimeWorkloadPolicy('legacy-orca').preemptible, false);
    assert.equal(getRuntimeWorkloadPolicy('export-reporting').preemptible, true);
    assert.equal(getRuntimeWorkloadPolicy('maintenance').preemptible, true);
    assert.equal(getRuntimeWorkloadPolicy('critical-initialization').preemptible, false);
    assert.equal(getRuntimeWorkloadPolicy('critical-initialization').throttledByLatency, false);
  });
});