"use client";

import { useEffect, useRef, useState } from "react";
import type { Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./report-tour.css";

export function ReportTour({ disabled }: { disabled: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const tour = useRef<Driver | null>(null);
  const alive = useRef(false);
  const unavailable = useRef(disabled);
  const pending = useRef(false);
  const restoreForm = useRef<(() => void) | null>(null);
  const finishCurrent = useRef<(() => void) | null>(null);
  const startFromHash = useRef<((manual?: boolean) => Promise<void>) | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [returnFocus, setReturnFocus] = useState(false);
  unavailable.current = disabled;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      tour.current?.destroy();
      finishCurrent.current?.();
      restoreForm.current?.();
    };
  }, []);
  useEffect(() => {
    if (disabled) {
      tour.current?.destroy();
      finishCurrent.current?.();
      restoreForm.current?.();
      tour.current = null;
    }
  }, [disabled]);
  useEffect(() => {
    if (returnFocus && !loading && !disabled && !tour.current?.isActive()) {
      trigger.current?.focus();
      setReturnFocus(false);
    }
  }, [returnFocus, loading, disabled]);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#tutorial") {
        void startFromHash.current?.(false);
      } else {
        tour.current?.destroy();
        finishCurrent.current?.();
      }
    };
    const frame = requestAnimationFrame(handleHash);
    window.addEventListener("hashchange", handleHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  async function start(manual = true) {
    if (pending.current || unavailable.current || tour.current?.isActive())
      return;
    const requestedUrl = window.location.href;
    const pageAddress = window.location.pathname + window.location.search;
    const previousHash =
      manual && window.location.hash !== "#tutorial"
        ? window.location.hash
        : "";
    pending.current = true;
    setLoading(true);
    setError("");
    try {
      const { driver } = await import("driver.js");
      if (
        !alive.current ||
        unavailable.current ||
        window.location.href !== requestedUrl
      )
        return;
      const form = trigger.current?.form;
      if (!form) return;
      const wasInert = form.inert;
      restoreForm.current = () => {
        form.inert = wasInert;
        restoreForm.current = null;
      };
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let finished = false;
      const finishTour = () => {
        if (finished) return;
        finished = true;
        restoreForm.current?.();
        tour.current = null;
        finishCurrent.current = null;
        if (
          window.location.pathname + window.location.search === pageAddress &&
          window.location.hash === "#tutorial"
        ) {
          window.history.replaceState(
            window.history.state,
            "",
            pageAddress + previousHash,
          );
        }
        if (alive.current && !unavailable.current) setReturnFocus(true);
      };
      finishCurrent.current = finishTour;
      const instance = driver({
        popoverClass: "report-tour-popover",
        animate: !reduced,
        duration: 180,
        smoothScroll: false,
        overlayColor: "#271B30",
        overlayOpacity: 0.56,
        stagePadding: 8,
        stageRadius: 12,
        popoverOffset: 16,
        disableActiveInteraction: true,
        allowClose: true,
        allowKeyboardControl: true,
        showProgress: true,
        progressText: "{{current}} de {{total}}",
        nextBtnText: "Siguiente",
        prevBtnText: "Anterior",
        doneBtnText: "Terminar",
        closeBtnLabel: "Cerrar tutorial",
        onPopoverRender(popover) {
          popover.wrapper.setAttribute("aria-modal", "true");
          popover.wrapper.addEventListener("keydown", (event) => {
            if (event.key !== "Tab") return;
            event.preventDefault();
            event.stopPropagation();
            const buttons = Array.from(
              popover.wrapper.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)",
              ),
            ).filter((button) => button.getClientRects().length);
            const current = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            const next =
              (current + (event.shiftKey ? -1 : 1) + buttons.length) %
              buttons.length;
            buttons[next]?.focus();
          });
          queueMicrotask(() => {
            if (popover.wrapper.isConnected)
              popover.nextButton.focus({ preventScroll: true });
          });
        },
        onDestroyStarted(_element, _step, { driver: activeDriver }) {
          activeDriver.destroy();
          // Driver can close before its first animated step has become active.
          finishTour();
        },
        onDestroyed: finishTour,
        steps: [
          {
            element: "[data-report-tour='capture']",
            popover: {
              title: "Adjunta la captura",
              description:
                "Selecciona o arrastra una imagen. Oculta datos personales innecesarios antes de subirla.",
              side: "bottom",
              align: "center",
            },
          },
          {
            element: "[data-report-tour='url']",
            popover: {
              title: "El enlace es opcional",
              description:
                "Si tienes la publicación original, pega su URL aquí.",
              side: "bottom",
              align: "center",
            },
          },
          {
            element: "[data-report-tour='description']",
            popover: {
              title: "Cuenta qué ocurrió",
              description:
                "Incluye el contexto necesario, sin datos que identifiquen a otras personas.",
              side: "top",
              align: "center",
            },
          },
          {
            element: "[data-report-tour='consent']",
            popover: {
              title: "Revisa la autorización",
              description:
                "Lee el aviso y decide si autorizas el análisis con OpenAI.",
              side: "top",
              align: "center",
            },
          },
          {
            element: "[data-report-tour='submit']",
            popover: {
              title: "Envía a revisión",
              description:
                "El equipo recibirá el reporte en privado. Publicarlo requiere aprobación humana.",
              side: "top",
              align: "end",
            },
          },
        ],
      });
      tour.current = instance;
      if (window.location.hash !== "#tutorial") {
        window.history.replaceState(
          window.history.state,
          "",
          pageAddress + "#tutorial",
        );
      }
      form.inert = true;
      instance.drive();
    } catch {
      tour.current?.destroy();
      finishCurrent.current?.();
      restoreForm.current?.();
      if (alive.current)
        setError(
          "No se pudo abrir el tutorial. Puedes continuar con el formulario.",
        );
    } finally {
      pending.current = false;
      if (alive.current) setLoading(false);
    }
  }

  startFromHash.current = start;

  return (
    <div className="report-tour-launch">
      <button
        type="button"
        ref={trigger}
        onClick={() => void start()}
        disabled={disabled || loading}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
        </svg>
        {loading ? "Abriendo tutorial…" : "Ver cómo reportar"}
      </button>
      {error && <p role="status">{error}</p>}
    </div>
  );
}
