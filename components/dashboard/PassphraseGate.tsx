"use client";

import { useActionState } from "react";
import { checkPassphraseAction, type LoginState } from "@/app/dashboard/login/actions";
import styles from "./PassphraseGate.module.css";

const initialState: LoginState = { error: false };

export default function PassphraseGate() {
  const [state, formAction, pending] = useActionState(checkPassphraseAction, initialState);

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.icon}>🔒</div>
        <div className={styles.title}>Admin access only</div>
        <div className={styles.subtitle}>Enter the leadership passphrase to view local church submissions.</div>
        <form action={formAction}>
          <input
            type="password"
            name="passphrase"
            placeholder="Passphrase"
            autoFocus
            className={`${styles.input} ${state.error ? styles.inputError : ""}`}
          />
          {state.error ? (
            <div className={styles.error}>{state.message ?? "Incorrect passphrase — please try again."}</div>
          ) : null}
          <button type="submit" className={styles.button} disabled={pending}>
            {pending ? "Checking…" : "Unlock dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}
