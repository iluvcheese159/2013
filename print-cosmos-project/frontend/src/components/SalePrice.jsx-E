export default function SalePrice({
  isOnSale,
  baseOriginalPrice,
  activeSalePrice,
  className = "",
  baseClassName = "",
  saleClassName = "",
}) {
  const base = Number(baseOriginalPrice ?? 0);
  const sale = Number(activeSalePrice ?? 0);

  if (!isOnSale || !sale || sale >= base) {
    return <span className={`font-tech font-bold text-foreground ${baseClassName} ${className}`}>${base.toFixed(2)}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`sale-strike-price font-tech ${baseClassName}`}>${base.toFixed(2)}</span>
      <span className={`font-tech font-bold text-[#F59E0B] ${saleClassName}`}>${sale.toFixed(2)}</span>
    </span>
  );
}
