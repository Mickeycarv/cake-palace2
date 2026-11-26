import { useState, type ImgHTMLAttributes } from 'react';
import { PLACEHOLDER_IMAGE } from '../lib/links';

/**
 * Image with fixed intrinsic size (prevents layout shift), lazy loading and a
 * fallback placeholder if the file is missing (e.g. a new menu item without a photo yet).
 */
export function Img({
  src,
  alt,
  width = 600,
  height = 600,
  eager = false,
  className,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      {...rest}
      className={className}
      src={failed ? PLACEHOLDER_IMAGE : src}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => !failed && setFailed(true)}
    />
  );
}
