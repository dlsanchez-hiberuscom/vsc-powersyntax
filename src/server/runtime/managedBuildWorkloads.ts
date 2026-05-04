import type { PbAutoBuildRunnerRequest } from '../build/pbAutoBuildRunner';
import type { OrcaRunnerRequest } from '../build/orcaRunner';
import type { PbAutoBuildRunResult } from '../../shared/pbAutoBuildProtocol';
import type { OrcaRunResult } from '../../shared/orcaProtocol';
import type { CancellationToken } from './cancellation';
import type { RuntimeWorkloadClass } from './backpressurePolicy';

type RunBackgroundWorkload = <T>(
  idPrefix: string,
  workload: RuntimeWorkloadClass,
  execute: (token: CancellationToken) => Promise<T> | T,
) => Promise<T>;

type PbAutoBuildRunnerLike = {
  run(request: PbAutoBuildRunnerRequest): Promise<PbAutoBuildRunResult>;
  cancel(): void;
};

type OrcaRunnerLike = {
  run(request: OrcaRunnerRequest): Promise<OrcaRunResult>;
  cancel(): void;
};

export interface ManagedBuildWorkloads {
  runPbAutoBuildWithBackpressure(request: PbAutoBuildRunnerRequest): Promise<PbAutoBuildRunResult>;
  runOrcaWithBackpressure(request: OrcaRunnerRequest): Promise<OrcaRunResult>;
}

export function createManagedBuildWorkloads(args: {
  runBackgroundWorkload: RunBackgroundWorkload;
  pbAutoBuildRunner: PbAutoBuildRunnerLike;
  orcaRunner: OrcaRunnerLike;
}): ManagedBuildWorkloads {
  const { runBackgroundWorkload, pbAutoBuildRunner, orcaRunner } = args;

  async function runPbAutoBuildWithBackpressure(request: PbAutoBuildRunnerRequest): Promise<PbAutoBuildRunResult> {
    return runBackgroundWorkload('pbautobuild', 'build', async (token) => {
      token.onCancelled(() => {
        pbAutoBuildRunner.cancel();
      });
      return pbAutoBuildRunner.run(request);
    });
  }

  async function runOrcaWithBackpressure(request: OrcaRunnerRequest): Promise<OrcaRunResult> {
    return runBackgroundWorkload('orca', 'legacy-orca', async (token) => {
      token.onCancelled(() => {
        orcaRunner.cancel();
      });
      return orcaRunner.run(request);
    });
  }

  return {
    runPbAutoBuildWithBackpressure,
    runOrcaWithBackpressure,
  };
}