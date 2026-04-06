"use client";

import React from "react";

type Props = {
  step: number;
  setStep?: (n: number) => void;
  children: React.ReactNode;
};

export default function WizardShell({ step, setStep, children }: Props) {
  const steps = [
    { n: 1, title: "Enviar PDFs" },
    { n: 2, title: "Seus dados" },
    { n: 3, title: "Pagamento" },
    { n: 4, title: "Resultados" },
    { n: 5, title: "Resolver agora" },
  ];

  return (
    <div className="clara-wizard">
      <div className="clara-wizard__header">
        <div className="clara-wizard__title">Resultado da análise</div>
        <div className="clara-wizard__subtitle">
          Uma etapa por vez, pra ficar fácil. Você sempre pode voltar e editar.
        </div>

        <div className="clara-wizard__steps" role="tablist" aria-label="Etapas">
          {steps.map((s) => {
            const active = s.n === step;
            const done = s.n < step;
            return (
              <button
                key={s.n}
                type="button"
                className={[
                  "clara-step",
                  active ? "is-active" : "",
                  done ? "is-done" : "",
                ].join(" ")}
                onClick={() => setStep?.(s.n)}
                disabled={!setStep}
              >
                <span className="clara-step__dot">{s.n}</span>
                <span className="clara-step__label">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="clara-wizard__body">{children}</div>

      <style jsx global>{`
        .clara-wizard {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 18px 60px;
        }
        .clara-wizard__header {
          margin-bottom: 18px;
        }
        .clara-wizard__title {
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0b2440;
        }
        .clara-wizard__subtitle {
          margin-top: 6px;
          color: #4b5a6a;
          font-size: 15px;
        }
        .clara-wizard__steps {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        .clara-step {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid #e7eef6;
          border-radius: 999px;
          background: #ffffff;
          cursor: pointer;
          transition: 150ms ease;
        }
        .clara-step:hover {
          border-color: #cfe0f2;
        }
        .clara-step:disabled {
          cursor: default;
          opacity: 0.75;
        }
        .clara-step__dot {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-weight: 700;
          background: #eef4fb;
          color: #0b2440;
          border: 1px solid #dbe8f6;
        }
        .clara-step.is-active .clara-step__dot {
          background: #0b2440;
          color: #fff;
          border-color: #0b2440;
        }
        .clara-step.is-done .clara-step__dot {
          background: #e9f6ef;
          color: #166534;
          border-color: #bfe8cf;
        }
        .clara-step__label {
          font-size: 13px;
          color: #0b2440;
          font-weight: 600;
        }

        .clara-wizard__body .clara-section {
          border: 1px solid #e7eef6;
          border-radius: 18px;
          background: #ffffff;
          padding: 18px;
          box-shadow: 0 2px 10px rgba(11, 36, 64, 0.05);
          margin-top: 16px;
        }

        .clara-section__title {
          font-size: 18px;
          font-weight: 800;
          color: #0b2440;
          margin-bottom: 6px;
        }
        .clara-section__hint {
          font-size: 13px;
          color: #5a6b7c;
          margin-bottom: 12px;
        }

        .clara-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .clara-btn {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #dbe8f6;
          background: #fff;
          color: #0b2440;
          font-weight: 700;
          cursor: pointer;
        }
        .clara-btn.primary {
          background: #0b2440;
          color: #fff;
          border-color: #0b2440;
        }
        .clara-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .clara-two-col {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 960px) {
          .clara-two-col {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
