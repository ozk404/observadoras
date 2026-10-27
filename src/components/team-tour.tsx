"use client";
import { useEffect, useRef, useState } from "react";
import type { Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "./report-tour.css";

export function TeamTour({ reviewer }: { reviewer: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const active = useRef<Driver | null>(null);
  const pending = useRef(false);
  const alive = useRef(false);
  const startRef = useRef<() => Promise<void>>(async () => {});
  const finishRef = useRef<() => void>(() => {});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [returnFocus, setReturnFocus] = useState(false);
  useEffect(() => {
    if (returnFocus && !loading) {
      trigger.current?.focus({ preventScroll: true });
      setReturnFocus(false);
    }
  }, [returnFocus, loading]);
  const [error, setError] = useState("");

  useEffect(() => {
    alive.current = true;
    setReady(true);
    const hash = () => {
      if (location.hash === "#tutorial") void startRef.current();
      else active.current?.destroy();
    };
    const frame = requestAnimationFrame(hash);
    window.addEventListener("hashchange", hash);
    return () => {
      alive.current = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", hash);
      active.current?.destroy();
      finishRef.current();
    };
  }, []);

  async function start() {
    if (pending.current || active.current?.isActive()) return;
    pending.current = true;
    setLoading(true);
    setError("");
    const requested = location.href;
    const address = location.pathname + location.search;
    const previous = location.hash === "#tutorial" ? "" : location.hash;
    try {
      const { driver } = await import("driver.js");
      if (!alive.current || location.href !== requested) return;
      const report = document.querySelector('[data-team-tour="open"]');
      const steps: DriveStep[] = [
        {
          element: '[data-team-tour="filters"]',
          popover: {
            title: "Filtra por estado",
            description:
              "Los contadores corresponden a los reportes que tu cuenta puede consultar.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: '[data-team-tour="reports"]',
          popover: {
            title: report ? "Consulta los reportes" : "No hay resultados aquí",
            description: report
              ? "Cada fila reúne el estado, el origen y la fecha. El listado conserva el filtro al cambiar de página."
              : "Cambia el estado o vuelve a la primera página para consultar otros reportes.",
            side: "top",
            align: "start",
          },
        },
      ];
      const capture = document.querySelector<HTMLButtonElement>(
        '[data-team-tour="reports"] button[aria-label^="Ampliar captura"]',
      );
      if (capture)
        steps.push({
          element: capture,
          popover: {
            title: "Amplía la captura",
            description:
              "Abre la imagen sin salir de la bandeja. Usa «Tamaño real» para leer capturas largas.",
            side: "right",
            align: "start",
          },
        });
      if (report)
        steps.push({
          element: report,
          popover: {
            title: "Abre la ficha",
            description: reviewer
              ? "Selecciona el título para consultar el reporte, el análisis de IA y las acciones de revisión disponibles."
              : "Selecciona el título para consultar el reporte y su estado de revisión.",
            side: "bottom",
            align: "start",
          },
        });
      const summary = document.querySelector(
        '.private-nav a[href="/equipo/dashboard"]',
      );
      if (reviewer && summary)
        steps.push({
          element: summary,
          popover: {
            title: "Consulta el resumen",
            description:
              "Aquí encontrarás datos agregados de los reportes validados y publicados.",
            side: "bottom",
            align: "start",
          },
        });
      const surfaces = Array.from(
        document.querySelectorAll<HTMLElement>(
          "main, .site-header, .site-footer",
        ),
      );
      const previousInert = surfaces.map((element) => element.inert);
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        surfaces.forEach((element, index) => {
          element.inert = previousInert[index];
        });
        active.current = null;
        if (
          location.pathname + location.search === address &&
          location.hash === "#tutorial"
        ) {
          history.replaceState(history.state, "", address + previous);
        }
        if (alive.current) setReturnFocus(true);
      };
      finishRef.current = finish;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const instance = driver({
        steps,
        popoverClass: "report-tour-popover team-tour-popover",
        animate: !reduced,
        duration: 420,
        smoothScroll: !reduced,
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
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            buttons[
              (index + (event.shiftKey ? -1 : 1) + buttons.length) %
                buttons.length
            ]?.focus();
          });
          queueMicrotask(() => {
            if (popover.wrapper.isConnected)
              popover.nextButton.focus({ preventScroll: true });
          });
        },
        onDestroyStarted(_element, _step, { driver: current }) {
          current.destroy();
          finish();
        },
        onDestroyed: finish,
      });
      active.current = instance;
      history.replaceState(history.state, "", address + "#tutorial");
      surfaces.forEach((element) => {
        element.inert = true;
      });
      instance.drive();
    } catch {
      active.current?.destroy();
      finishRef.current();
      if (alive.current)
        setError("No se pudo abrir el tutorial. Inténtalo otra vez.");
    } finally {
      pending.current = false;
      if (alive.current) setLoading(false);
    }
  }
  startRef.current = start;
  return (
    <div className="report-tour-launch">
      <button
        ref={trigger}
        type="button"
        disabled={!ready || loading}
        onClick={() => void start()}
      >
        {loading ? "Abriendo tutorial…" : "Ver tutorial"}
      </button>
      {error && <p role="status">{error}</p>}
    </div>
  );
}
