"use client";
import { useEffect, useRef, useState } from "react";
export function PublicImageThumbnail({
  assetId,
  description,
  className,
}: {
  assetId: string;
  description: string;
  className: string;
}) {
  const image = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(!!image.current?.complete && image.current.naturalWidth === 0);
  }, [assetId]);
  if (failed) return null;
  return (
    <img
      ref={image}
      className={className}
      src={`/api/imagenes-publicas/${assetId}?vista=miniatura`}
      alt={description}
      width={256}
      height={192}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
