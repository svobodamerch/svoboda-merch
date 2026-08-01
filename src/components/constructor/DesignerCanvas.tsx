"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Stage, Layer, Text, Image as KonvaImage, Rect, Transformer } from "react-konva";
import type Konva from "konva";
import type { PrintView } from "@/lib/constructor-products";

const FONT_OPTIONS = [
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
];

type ResolutionStatus = "ok" | "low" | "critical";

type BaseLayer = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

type TextLayerData = BaseLayer & {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
};

type ImageLayerData = BaseLayer & {
  type: "image";
  image: HTMLImageElement;
  width: number;
  height: number;
  naturalWidth: number;
};

type LayerData = TextLayerData | ImageLayerData;

export type DesignerCanvasHandle = {
  /** PNG зоны редактирования (без рамки трансформера и без подсказки-рамки), null если пусто/не готово. */
  exportPng: () => string | null;
  hasLayers: () => boolean;
};

type Props = {
  view: PrintView;
  /** null — исходный цвет фото, без тонировки. */
  colorHex: string | null;
};

let layerCounter = 0;
const nextId = () => `layer-${++layerCounter}-${Date.now()}`;

export const DesignerCanvas = forwardRef<DesignerCanvasHandle, Props>(function DesignerCanvas(
  { view, colorHex },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const guideRef = useRef<Konva.Rect>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setStageSize({ width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      exportPng: () => {
        if (!stageRef.current || layers.length === 0) return null;
        transformerRef.current?.nodes([]);
        guideRef.current?.hide();
        const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
        guideRef.current?.show();
        return uri;
      },
      hasLayers: () => layers.length > 0,
    }),
    [layers.length],
  );

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (!selectedId) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
      return;
    }
    const node = stageRef.current.findOne(`#${selectedId}`);
    if (node) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, layers]);

  const updateLayer = useCallback((id: string, patch: Partial<LayerData>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? ({ ...l, ...patch } as LayerData) : l)));
  }, []);

  const addText = () => {
    const id = nextId();
    const layer: TextLayerData = {
      id,
      type: "text",
      x: stageSize.width / 2 - 60,
      y: stageSize.height / 2 - 12,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      text: "Ваш текст",
      fontSize: 28,
      fontFamily: FONT_OPTIONS[0].value,
      fill: "#22304f",
    };
    setLayers((prev) => [...prev, layer]);
    setSelectedId(id);
  };

  const addImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = Math.min(stageSize.width, stageSize.height) * 0.6;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = img.width * scale;
        const height = img.height * scale;
        const id = nextId();
        const layer: ImageLayerData = {
          id,
          type: "image",
          image: img,
          width,
          height,
          naturalWidth: img.naturalWidth,
          x: stageSize.width / 2 - width / 2,
          y: stageSize.height / 2 - height / 2,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        };
        setLayers((prev) => [...prev, layer]);
        setSelectedId(id);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addImageFile(file);
    e.target.value = "";
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  };

  const selectedLayer = layers.find((l) => l.id === selectedId) ?? null;

  // Грубая оценка «хватит ли разрешения»: переводим текущий размер слоя на
  // экране в мм через масштаб guideZone → realMm, сравниваем с нативными px
  // картинки. Не итоговый print-ready расчёт — см. комментарий в
  // constructor-products.ts у realMm.
  const resolutionStatus: ResolutionStatus | null = (() => {
    if (!selectedLayer || selectedLayer.type !== "image" || stageSize.width <= 1) return null;
    const imagePxPerRenderedPx = view.workArea.width / stageSize.width;
    const mmPerImagePx = view.realMm.width / view.guideZone.width;
    const printedWidthMm = selectedLayer.width * selectedLayer.scaleX * imagePxPerRenderedPx * mmPerImagePx;
    const printedWidthIn = printedWidthMm / 25.4;
    if (printedWidthIn <= 0) return "ok";
    const dpi = selectedLayer.naturalWidth / printedWidthIn;
    if (dpi >= 200) return "ok";
    if (dpi >= 120) return "low";
    return "critical";
  })();

  // guideZone в координатах stage (относительно workArea, в той же шкале, что и рендер)
  const scale = stageSize.width / view.workArea.width;
  const guideX = (view.guideZone.x - view.workArea.x) * scale;
  const guideY = (view.guideZone.y - view.workArea.y) * scale;
  const guideW = view.guideZone.width * scale;
  const guideH = view.guideZone.height * scale;

  return (
    <div>
      <div
        className="relative mx-auto overflow-hidden rounded-2xl bg-surface"
        style={{
          maxWidth: 640,
          aspectRatio: `${view.workArea.width} / ${view.workArea.height}`,
        }}
      >
        <div className="absolute inset-0" style={{ isolation: "isolate" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={view.image}
            alt=""
            className="absolute h-auto select-none"
            style={{
              // Кадрируем фото до workArea: смещаем и увеличиваем изображение
              // так, чтобы его часть workArea заполнила контейнер целиком.
              left: `${-(view.workArea.x / view.workArea.width) * 100}%`,
              top: `${-(view.workArea.y / view.workArea.height) * 100}%`,
              width: `${(view.imageWidth / view.workArea.width) * 100}%`,
              maxWidth: "none",
            }}
            draggable={false}
          />
          {colorHex && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: colorHex,
                mixBlendMode: "multiply",
                clipPath: view.tintClipPath,
              }}
            />
          )}
        </div>

        <div ref={wrapperRef} className="absolute inset-0">
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            ref={stageRef}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
            onTouchStart={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
          >
            <Layer>
              <Rect
                ref={guideRef}
                x={guideX}
                y={guideY}
                width={guideW}
                height={guideH}
                stroke="#c05b3e"
                strokeWidth={2}
                dash={[6, 5]}
                listening={false}
              />
              {layers.map((l) =>
                l.type === "text" ? (
                  <Text
                    key={l.id}
                    id={l.id}
                    text={l.text}
                    x={l.x}
                    y={l.y}
                    rotation={l.rotation}
                    scaleX={l.scaleX}
                    scaleY={l.scaleY}
                    fontSize={l.fontSize}
                    fontFamily={l.fontFamily}
                    fill={l.fill}
                    draggable
                    onClick={() => setSelectedId(l.id)}
                    onTap={() => setSelectedId(l.id)}
                    onDragEnd={(e) => updateLayer(l.id, { x: e.target.x(), y: e.target.y() })}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      updateLayer(l.id, {
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        scaleX: node.scaleX(),
                        scaleY: node.scaleY(),
                      });
                    }}
                  />
                ) : (
                  <KonvaImage
                    key={l.id}
                    id={l.id}
                    image={l.image}
                    x={l.x}
                    y={l.y}
                    width={l.width}
                    height={l.height}
                    rotation={l.rotation}
                    scaleX={l.scaleX}
                    scaleY={l.scaleY}
                    draggable
                    onClick={() => setSelectedId(l.id)}
                    onTap={() => setSelectedId(l.id)}
                    onDragEnd={(e) => updateLayer(l.id, { x: e.target.x(), y: e.target.y() })}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      updateLayer(l.id, {
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        scaleX: node.scaleX(),
                        scaleY: node.scaleY(),
                      });
                    }}
                  />
                ),
              )}
              <Transformer ref={transformerRef} rotateEnabled anchorSize={9} borderStroke="#c05b3e" />
            </Layer>
          </Stage>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={addText}
          className="pill label bg-surface px-5 py-2.5 text-ink transition-colors hover:bg-line"
        >
          + Текст
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="pill label bg-surface px-5 py-2.5 text-ink transition-colors hover:bg-line"
        >
          + Своё фото
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        {selectedId && (
          <button
            type="button"
            onClick={removeSelected}
            className="pill label bg-surface px-5 py-2.5 text-accent transition-colors hover:bg-line"
          >
            Удалить слой
          </button>
        )}
      </div>

      {selectedLayer?.type === "text" && (
        <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-3">
          <input
            type="text"
            value={selectedLayer.text}
            onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink"
          />
          <select
            value={selectedLayer.fontFamily}
            onChange={(e) => updateLayer(selectedLayer.id, { fontFamily: e.target.value })}
            className="rounded-lg border border-line px-2 py-1.5 text-sm text-ink"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            type="color"
            value={selectedLayer.fill}
            onChange={(e) => updateLayer(selectedLayer.id, { fill: e.target.value })}
            className="h-8 w-10 rounded border border-line"
            aria-label="Цвет текста"
          />
          <input
            type="range"
            min={12}
            max={72}
            value={selectedLayer.fontSize}
            onChange={(e) => updateLayer(selectedLayer.id, { fontSize: Number(e.target.value) })}
            aria-label="Размер текста"
          />
        </div>
      )}

      {resolutionStatus && (
        <p
          className={`mt-3 text-center text-xs ${
            resolutionStatus === "ok"
              ? "text-emerald-600"
              : resolutionStatus === "low"
                ? "text-amber-600"
                : "text-red-600"
          }`}
        >
          {resolutionStatus === "ok" && "Разрешение картинки в порядке для печати."}
          {resolutionStatus === "low" &&
            "Разрешение на грани — печать может выйти нерезкой. Лучше загрузить картинку покрупнее."}
          {resolutionStatus === "critical" &&
            "Разрешение слишком низкое — печать будет размытой. Загрузите картинку большего размера."}
        </p>
      )}
    </div>
  );
});
