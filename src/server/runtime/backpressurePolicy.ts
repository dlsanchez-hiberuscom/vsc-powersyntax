export type RuntimeWorkloadClass =
  | 'interactive'
  | 'near-context'
  | 'diagnostics'
  | 'background-indexing'
  | 'export-reporting'
  | 'build'
  | 'legacy-orca'
  | 'ai-tooling'
  | 'maintenance';

export type RuntimeWorkloadLane = 'interactive' | 'near' | 'background';

export interface RuntimeWorkloadPolicy {
  workload: RuntimeWorkloadClass;
  label: string;
  lane: RuntimeWorkloadLane;
  throttledByLatency: boolean;
  preemptible: boolean;
}

const RUNTIME_WORKLOAD_POLICIES: Record<RuntimeWorkloadClass, RuntimeWorkloadPolicy> = {
  interactive: {
    workload: 'interactive',
    label: 'interactive',
    lane: 'interactive',
    throttledByLatency: false,
    preemptible: false,
  },
  'near-context': {
    workload: 'near-context',
    label: 'near-context',
    lane: 'near',
    throttledByLatency: false,
    preemptible: true,
  },
  diagnostics: {
    workload: 'diagnostics',
    label: 'diagnostics',
    lane: 'interactive',
    throttledByLatency: false,
    preemptible: false,
  },
  'background-indexing': {
    workload: 'background-indexing',
    label: 'background-indexing',
    lane: 'background',
    throttledByLatency: true,
    preemptible: true,
  },
  'export-reporting': {
    workload: 'export-reporting',
    label: 'export-reporting',
    lane: 'background',
    throttledByLatency: true,
    preemptible: true,
  },
  build: {
    workload: 'build',
    label: 'build',
    lane: 'background',
    throttledByLatency: true,
    preemptible: false,
  },
  'legacy-orca': {
    workload: 'legacy-orca',
    label: 'legacy-orca',
    lane: 'background',
    throttledByLatency: true,
    preemptible: false,
  },
  'ai-tooling': {
    workload: 'ai-tooling',
    label: 'ai-tooling',
    lane: 'background',
    throttledByLatency: true,
    preemptible: true,
  },
  maintenance: {
    workload: 'maintenance',
    label: 'maintenance',
    lane: 'background',
    throttledByLatency: true,
    preemptible: true,
  },
};

const RUNTIME_WORKLOAD_IDS = Object.freeze(Object.keys(RUNTIME_WORKLOAD_POLICIES) as RuntimeWorkloadClass[]);

export function getRuntimeWorkloadPolicy(workload: RuntimeWorkloadClass): RuntimeWorkloadPolicy {
  return RUNTIME_WORKLOAD_POLICIES[workload];
}

export function listRuntimeWorkloadPolicies(): RuntimeWorkloadPolicy[] {
  return RUNTIME_WORKLOAD_IDS.map((workload) => RUNTIME_WORKLOAD_POLICIES[workload]);
}

export function isRuntimeWorkloadPreemptible(workload: RuntimeWorkloadClass): boolean {
  return RUNTIME_WORKLOAD_POLICIES[workload].preemptible;
}