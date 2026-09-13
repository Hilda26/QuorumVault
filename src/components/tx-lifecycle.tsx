import { ExternalLink } from "lucide-react";
import { txUrl } from "@/lib/quorumvault";
import { isFailureState, type TxRecord, type TxState } from "@/lib/tx/useTransaction";

const STEPS: { state: TxState; label: string }[] = [
  { state: "AWAITING_SIGNATURE", label: "Awaiting signature" },
  { state: "SUBMITTED", label: "Submitted" },
  { state: "CONSENSUS_RUNNING", label: "Consensus running" },
  { state: "FINALIZED", label: "Finalized" },
  { state: "EXECUTION_CONFIRMED", label: "Execution confirmed" },
  { state: "STATE_REREAD", label: "Reading final state" },
];

const FAILURE_COPY: Partial<Record<TxState, string>> = {
  USER_REJECTED: "You rejected the transaction in your wallet.",
  WRONG_NETWORK: "Wrong network -- switch to StudioNet and try again.",
  RPC_ERROR: "Network error talking to StudioNet. You can safely retry.",
  CONSENSUS_FAILURE: "Consensus did not finalize in time. It may still land -- check the explorer link.",
  EXECUTION_ERROR: "The transaction finalized, but execution failed on-chain.",
  STATE_MISMATCH: "The on-chain state after finalization did not match what we expected.",
};

function stepIndex(state: TxState): number {
  return STEPS.findIndex((s) => s.state === state);
}

function OneTx({ tx }: { tx: TxRecord }) {
  const failed = isFailureState(tx.state);
  const failureMessage = failed ? FAILURE_COPY[tx.state] ?? "Transaction failed." : undefined;
  const currentIndex = stepIndex(tx.state);
  const isDone = tx.state === "DONE";
  const isPending = !tx.hash.startsWith("pending-");

  return (
    <div className="tx-lifecycle" role="status" aria-live="polite">
      <div className="tx-lifecycle-head">
        <strong>{tx.label}</strong>
        {isPending && (
          <a href={txUrl(tx.hash)} target="_blank" rel="noreferrer" className="text-link">
            View on explorer <ExternalLink size={12} />
          </a>
        )}
      </div>
      {!failureMessage ? (
        <ol className="tx-steps">
          {STEPS.map((step, i) => {
            const reached = isDone || i <= currentIndex;
            const active = !isDone && i === currentIndex;
            return (
              <li key={step.state} className={[reached ? "reached" : "", active ? "active" : ""].join(" ").trim()}>
                {step.label}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="form-error">{failureMessage}</p>
      )}
      {tx.triggered.map((child) => (
        <a key={child} href={txUrl(child)} target="_blank" rel="noreferrer" className="text-link">
          Triggered upgrade transaction <ExternalLink size={12} />
        </a>
      ))}
      {isDone && <p className="tx-done">Done -- state re-read and confirmed.</p>}
    </div>
  );
}

export function TxLifecycleList({ transactions }: { transactions: TxRecord[] }) {
  if (!transactions.length) return null;
  return (
    <div className="rg-txs">
      <h3>Transaction activity</h3>
      {transactions.map((tx) => (
        <OneTx key={tx.hash} tx={tx} />
      ))}
    </div>
  );
}
