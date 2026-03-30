import React, { useState, useEffect } from 'react';

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  fallbackSrc?: string;
}

// Default transparent pixel or a generic placeholder URL
const DEFAULT_FALLBACK = "https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback";

export const ImageWithFallback: React.FC<Props> = ({ 
  src, 
  alt, 
  className, 
  fallbackSrc = DEFAULT_FALLBACK, 
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setErrored(false);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!errored) {
      setErrored(true);
      setImgSrc(fallbackSrc);
    }
    
    if (props.onError) {
      props.onError(e);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${className} ${errored ? 'opacity-80 grayscale' : ''}`}
      {...props}
      onError={handleError}
    />
  );
};
