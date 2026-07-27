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

  const isLarge = saleClassName.includes("text-4xl") || baseClassName.includes("text-4xl") || saleClassName.includes("text-3xl") || baseClassName.includes("text-3xl");

  return (
    <span className={`inline-flex ${isLarge ? "flex-col items-start gap-0.5" : "flex-row items-baseline gap-2"} ${className}`}>
      <span className={`sale-strike-price font-tech ${baseClassName}`} style={{ textDecoration: "line-through", textDecorationColor: "currentColor", textDecorationThickness: "2px" }}>${base.toFixed(2)}</span>
      <span className={`font-tech font-bold text-[#F59E0B] ${saleClassName}`}>${sale.toFixed(2)}</span>
    </span>
  );
}
