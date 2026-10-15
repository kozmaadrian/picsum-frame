const numberFormat = new Intl.NumberFormat("en-US");

export const formatNumber = (n) => numberFormat.format(n);

export const formatDims = (w, h) => `${formatNumber(w)} × ${formatNumber(h)}`;
